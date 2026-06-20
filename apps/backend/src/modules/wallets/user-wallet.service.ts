import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Prisma,
  WalletStatus,
  WalletTxStatus,
  WalletTxType,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class UserWalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private walletConfig() {
    return this.config.get<{
      defaultAssetCode: string;
      defaultNetwork: string;
    }>('wallet')!;
  }

  /** One wallet per (user, asset, network) — enforced by DB unique index. */
  async getOrCreateWallet(userId: string) {
    const { defaultAssetCode, defaultNetwork } = this.walletConfig();
    const composite = {
      userId_assetCode_network: {
        userId,
        assetCode: defaultAssetCode,
        network: defaultNetwork,
      },
    };

    const existing = await this.prisma.wallet.findUnique({
      where: composite,
      include: { balance: true },
    });
    if (existing) return existing;

    try {
      return await this.prisma.wallet.create({
        data: {
          userId,
          assetCode: defaultAssetCode,
          network: defaultNetwork,
          status: WalletStatus.ACTIVE,
          balance: {
            create: {
              available: new Prisma.Decimal(0),
              locked: new Prisma.Decimal(0),
              pending: new Prisma.Decimal(0),
            },
          },
        },
        include: { balance: true },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return this.prisma.wallet.findUniqueOrThrow({
          where: composite,
          include: { balance: true },
        });
      }
      throw err;
    }
  }

  private async aggregateTotals(walletId: string) {
    const [deposits, withdrawals, payouts] = await Promise.all([
      this.prisma.walletTransaction.aggregate({
        where: {
          walletId,
          txType: WalletTxType.DEPOSIT,
          status: WalletTxStatus.COMPLETED,
        },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          walletId,
          txType: WalletTxType.WITHDRAWAL,
          status: WalletTxStatus.COMPLETED,
        },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          walletId,
          txType: WalletTxType.PAYOUT,
          status: WalletTxStatus.COMPLETED,
        },
        _sum: { amount: true },
      }),
    ]);

    const pendingWithdrawals = await this.prisma.withdrawal.count({
      where: {
        walletTx: { walletId },
        status: { in: ['REQUESTED', 'PROCESSING', 'ON_HOLD'] },
      },
    });

    return {
      totalDeposits: deposits._sum.amount ?? new Prisma.Decimal(0),
      totalWithdrawals: withdrawals._sum.amount ?? new Prisma.Decimal(0),
      totalPayouts: payouts._sum.amount ?? new Prisma.Decimal(0),
      pendingWithdrawals,
    };
  }

  private async resolveWithdrawalFee(): Promise<Prisma.Decimal> {
    const active = await this.prisma.platformFeeSetting.findFirst({
      where: { isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (active) {
      return active.withdrawalFeeFixed;
    }
    const cfg = this.config.get<{ defaultWithdrawalFeeUsdt: number }>('wallet');
    return new Prisma.Decimal(cfg?.defaultWithdrawalFeeUsdt ?? 0);
  }

  private mapWalletSummary(
    wallet: NonNullable<Awaited<ReturnType<typeof this.getOrCreateWallet>>>,
    totals: Awaited<ReturnType<typeof this.aggregateTotals>>,
  ) {
    const bal = wallet.balance!;
    return {
      walletId: wallet.id,
      asset: wallet.assetCode,
      network: wallet.network,
      availableBalance: bal.available.toString(),
      lockedBalance: bal.locked.toString(),
      pendingBalance: bal.pending.toString(),
      earnedTotal: totals.totalPayouts.toString(),
      withdrawnTotal: totals.totalWithdrawals.toString(),
      totalDeposits: totals.totalDeposits.toString(),
      pendingWithdrawalsCount: totals.pendingWithdrawals,
      updatedAt: bal.updatedAt.toISOString(),
    };
  }

  async getSummary(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    const [totals, withdrawalFee] = await Promise.all([
      this.aggregateTotals(wallet.id),
      this.resolveWithdrawalFee(),
    ]);
    const cfg = this.config.get<{
      minWithdrawalUsdt: number;
    }>('wallet');
    const base = this.mapWalletSummary(wallet, totals);
    return {
      ...base,
      minWithdrawalUsdt: String(cfg?.minWithdrawalUsdt ?? 50),
      withdrawalFeeUsdt: withdrawalFee.toString(),
      withdrawalEnabled: true,
    };
  }

  async getBalance(userId: string) {
    const summary = await this.getSummary(userId);
    return {
      walletId: summary.walletId,
      availableBalance: summary.availableBalance,
      lockedBalance: summary.lockedBalance,
      pendingBalance: summary.pendingBalance,
      asset: summary.asset,
      network: summary.network,
      updatedAt: summary.updatedAt,
    };
  }

  async listTransactions(userId: string, page = 1, pageSize = 20) {
    const wallet = await this.getOrCreateWallet(userId);
    const skip = (page - 1) * pageSize;
    const [total, rows] = await Promise.all([
      this.prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { happenedAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map((r) => ({
        id: r.id,
        type: r.txType.toLowerCase(),
        direction: r.direction.toLowerCase(),
        amount: r.amount.toString(),
        fee: r.feeAmount.toString(),
        netAmount: r.netAmount.toString(),
        status: r.status.toLowerCase(),
        referenceType: r.referenceType,
        referenceId: r.referenceId,
        createdAt: r.createdAt.toISOString(),
        completedAt: r.settledAt?.toISOString() ?? null,
      })),
      total,
      page,
      pageSize,
      hasMore: skip + rows.length < total,
    };
  }
}
