import { Injectable } from '@nestjs/common';
import { ComplianceRiskStatus, Prisma, WithdrawalStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { getRuleByCode } from '../admin/v1/mappers/admin-compliance.mapper';
import { MarketAbuseService } from './market-abuse.service';

const LARGE_DEPOSIT_USDT = 1000;
const LARGE_WITHDRAWAL_USDT = 1000;
const WD_VELOCITY_WINDOW_MS = 24 * 60 * 60 * 1000;
const WD_VELOCITY_COUNT = 3;
const FAILED_WD_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const FAILED_WD_COUNT = 2;
const SECONDARY_SPIKE_WINDOW_MS = 24 * 60 * 60 * 1000;
const SECONDARY_SPIKE_COUNT = 5;
const MULTI_ADDRESS_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

type FlagDraft = {
  flagCode: string;
  severity: string;
  riskScore: number;
  entityType: string;
  entityId: string;
  note?: string;
};

@Injectable()
export class ComplianceRiskScoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marketAbuse: MarketAbuseService,
  ) {}

  async evaluateWithdrawal(params: {
    userId: string;
    withdrawalId: string;
    amount: Prisma.Decimal;
    toAddress: string;
  }): Promise<string[]> {
    const created: string[] = [];
    const drafts: FlagDraft[] = [];

    if (
      params.amount.greaterThanOrEqualTo(
        new Prisma.Decimal(LARGE_WITHDRAWAL_USDT),
      )
    ) {
      drafts.push({
        flagCode: 'first_wd_large',
        severity: 'high',
        riskScore: 70,
        entityType: 'withdrawal',
        entityId: params.withdrawalId,
        note: `Withdrawal amount ${params.amount.toString()} USDT`,
      });
    }

    const since = new Date(Date.now() - WD_VELOCITY_WINDOW_MS);
    const walletIds = (
      await this.prisma.wallet.findMany({
        where: { userId: params.userId },
        select: { id: true },
      })
    ).map((w) => w.id);

    const recentWd = await this.prisma.withdrawal.count({
      where: {
        walletTx: { walletId: { in: walletIds } },
        requestedAt: { gte: since },
        status: { not: WithdrawalStatus.CANCELLED },
      },
    });
    if (recentWd >= WD_VELOCITY_COUNT) {
      drafts.push({
        flagCode: 'wd_velocity',
        severity: 'high',
        riskScore: 75,
        entityType: 'withdrawal',
        entityId: params.withdrawalId,
        note: `${recentWd} withdrawals in 24h`,
      });
    }

    const failedSince = new Date(Date.now() - FAILED_WD_WINDOW_MS);
    const failedCount = await this.prisma.withdrawal.count({
      where: {
        walletTx: { walletId: { in: walletIds } },
        status: WithdrawalStatus.FAILED,
        updatedAt: { gte: failedSince },
      },
    });
    if (failedCount >= FAILED_WD_COUNT) {
      drafts.push({
        flagCode: 'wd_failed_repeat',
        severity: 'medium',
        riskScore: 55,
        entityType: 'user',
        entityId: params.userId,
        note: `${failedCount} failed withdrawals in 7d`,
      });
    }

    const addrSince = new Date(Date.now() - MULTI_ADDRESS_WINDOW_MS);
    const distinctAddresses = await this.prisma.withdrawal.findMany({
      where: {
        walletTx: { walletId: { in: walletIds } },
        requestedAt: { gte: addrSince },
      },
      distinct: ['toAddress'],
      select: { toAddress: true },
    });
    if (distinctAddresses.length >= 3) {
      drafts.push({
        flagCode: 'multi_address',
        severity: 'critical',
        riskScore: 85,
        entityType: 'user',
        entityId: params.userId,
        note: `${distinctAddresses.length} distinct withdrawal addresses`,
      });
    }

    const suspiciousAddr = await this.findSuspiciousAddress(params.toAddress);
    if (suspiciousAddr) {
      drafts.push({
        flagCode: 'suspicious_address',
        severity: 'critical',
        riskScore: 90,
        entityType: 'withdrawal',
        entityId: params.withdrawalId,
        note: `Address flagged: ${params.toAddress}`,
      });
    }

    for (const d of drafts) {
      const id = await this.upsertActiveFlag(params.userId, d);
      if (id) created.push(id);
    }
    return created;
  }

  async evaluateDeposit(params: {
    userId: string;
    depositId: string;
    amount: Prisma.Decimal;
    fromAddress?: string | null;
  }): Promise<string[]> {
    const created: string[] = [];
    if (params.amount.lessThan(new Prisma.Decimal(LARGE_DEPOSIT_USDT))) {
      return created;
    }

    const id = await this.upsertActiveFlag(params.userId, {
      flagCode: 'large_deposit',
      severity: 'medium',
      riskScore: 60,
      entityType: 'deposit',
      entityId: params.depositId,
      note: `Large deposit ${params.amount.toString()} USDT`,
    });
    if (id) created.push(id);

    if (params.fromAddress) {
      const suspicious = await this.findSuspiciousAddress(params.fromAddress);
      if (suspicious) {
        const addrFlag = await this.upsertActiveFlag(params.userId, {
          flagCode: 'suspicious_address',
          severity: 'high',
          riskScore: 80,
          entityType: 'deposit',
          entityId: params.depositId,
          note: `Suspicious source address ${params.fromAddress}`,
        });
        if (addrFlag) created.push(addrFlag);
      }
    }
    return created;
  }

  async evaluateTrade(params: {
    buyerUserId: string;
    sellerUserId: string;
    tradeId: string;
    releaseId: string;
  }): Promise<string[]> {
    const created: string[] = [];
    const abuseFlags = await this.marketAbuse.evaluateAfterTrade({
      buyerUserId: params.buyerUserId,
      sellerUserId: params.sellerUserId,
      releaseId: params.releaseId,
      tradeId: params.tradeId,
    });

    for (const flagCode of abuseFlags) {
      const mapped = this.mapAbuseFlag(flagCode, params);
      if (!mapped) continue;
      const userId =
        flagCode === 'self_trade_direct' ? params.buyerUserId : params.buyerUserId;
      const id = await this.upsertActiveFlag(userId, mapped);
      if (id) created.push(id);
    }

    if (params.buyerUserId === params.sellerUserId) {
      return created;
    }

    const since = new Date(Date.now() - SECONDARY_SPIKE_WINDOW_MS);
    const tradeCount = await this.prisma.trade.count({
      where: {
        OR: [
          { buyerUserId: params.buyerUserId },
          { sellerUserId: params.buyerUserId },
        ],
        executedAt: { gte: since },
      },
    });
    if (tradeCount >= SECONDARY_SPIKE_COUNT) {
      const id = await this.upsertActiveFlag(params.buyerUserId, {
        flagCode: 'secondary_spike',
        severity: 'medium',
        riskScore: 50,
        entityType: 'trade',
        entityId: params.tradeId,
        note: `${tradeCount} trades in 24h`,
      });
      if (id) created.push(id);
    }
    return created;
  }

  async evaluateListingCancel(userId: string, listingId: string): Promise<string[]> {
    const created: string[] = [];
    const flags = await this.marketAbuse.evaluateListingManipulation(userId, listingId);
    for (const flagCode of flags) {
      const mapped = this.mapAbuseFlag(flagCode, {
        buyerUserId: userId,
        sellerUserId: userId,
        tradeId: listingId,
      });
      if (!mapped) continue;
      const id = await this.upsertActiveFlag(userId, {
        ...mapped,
        entityType: 'listing',
        entityId: listingId,
      });
      if (id) created.push(id);
    }
    return created;
  }

  private mapAbuseFlag(
    flagCode: string,
    params: { buyerUserId: string; sellerUserId: string; tradeId: string },
  ): FlagDraft | null {
    const map: Record<string, FlagDraft> = {
      self_trade_direct: {
        flagCode: 'wash_trade_suspect',
        severity: 'critical',
        riskScore: 95,
        entityType: 'trade',
        entityId: params.tradeId,
        note: 'Self-trade detected',
      },
      rapid_pair_trading: {
        flagCode: 'rapid_pair_trading',
        severity: 'high',
        riskScore: 72,
        entityType: 'trade',
        entityId: params.tradeId,
        note: 'Repeated trading between same counterparties',
      },
      deposit_trade_withdraw_pattern: {
        flagCode: 'deposit_trade_withdraw_pattern',
        severity: 'high',
        riskScore: 78,
        entityType: 'user',
        entityId: params.buyerUserId,
        note: 'Deposit, trade and withdrawal within short window',
      },
      rapid_cancel_relist: {
        flagCode: 'rapid_cancel_relist',
        severity: 'medium',
        riskScore: 55,
        entityType: 'listing',
        entityId: params.tradeId,
        note: 'High listing cancel/relist churn',
      },
    };
    return map[flagCode] ?? null;
  }

  private async findSuspiciousAddress(address: string): Promise<boolean> {
    const normalized = address.trim();
    const prior = await this.prisma.withdrawal.findFirst({
      where: {
        toAddress: normalized,
        suspiciousFlag: true,
      },
    });
    return Boolean(prior);
  }

  private async upsertActiveFlag(
    userId: string,
    draft: FlagDraft,
  ): Promise<string | null> {
    const existing = await this.prisma.riskFlag.findFirst({
      where: {
        userId,
        flagCode: draft.flagCode,
        entityId: draft.entityId,
        isActive: true,
      },
    });
    if (existing) return null;

    const rule = getRuleByCode(draft.flagCode);
    const saved = await this.prisma.riskFlag.create({
      data: {
        userId,
        flagCode: draft.flagCode,
        severity: draft.severity ?? rule?.defaultSeverity ?? 'medium',
        entityType: draft.entityType,
        entityId: draft.entityId,
        riskScore: draft.riskScore,
        note: draft.note ?? null,
        status: ComplianceRiskStatus.OPEN,
        isActive: true,
      },
    });
    return saved.id;
  }
}
