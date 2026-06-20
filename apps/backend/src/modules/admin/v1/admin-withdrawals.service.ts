import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { assertAdminArea } from '../common/admin-permissions';
import { throwAdminError } from '../common/admin-http.util';
import { buildPaginated } from '../common/types/paginated-response.type';
import type { AdminWithdrawalsQueryDto } from './dto/admin-withdrawals-query.dto';
import {
  apiWithdrawalStatusToDb,
  HIGH_VALUE_WITHDRAWAL_USDT,
  mapWithdrawalDetail,
  mapWithdrawalLedger,
  mapWithdrawalListItem,
  type AdminWithdrawalDetailDto,
  type AdminWithdrawalSummaryDto,
} from './mappers/admin-withdrawal.mapper';
import { AdminWithdrawalSettlementService } from './admin-withdrawal-settlement.service';
import { ComplianceEnforcementService } from '../../compliance/compliance-enforcement.service';
import { WithdrawalApprovalService } from '../../treasury/withdrawal-approval.service';
import { ProviderWithdrawalLifecycleService } from '../../treasury/provider-withdrawal-lifecycle.service';
import {
  WithdrawalProviderStatus,
  WithdrawalStatus,
} from '@prisma/client';

@Injectable()
export class AdminWithdrawalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly settlement: AdminWithdrawalSettlementService,
    private readonly enforcement: ComplianceEnforcementService,
    private readonly withdrawalApprovals: WithdrawalApprovalService,
    private readonly providerLifecycle: ProviderWithdrawalLifecycleService,
  ) {}

  private include() {
    return {
      walletTx: {
        include: {
          wallet: {
            include: {
              user: { include: { profile: true } },
              balance: true,
            },
          },
        },
      },
    } satisfies Prisma.WithdrawalInclude;
  }

  async summary(
    roles: string[],
    query?: AdminWithdrawalsQueryDto,
  ): Promise<AdminWithdrawalSummaryDto> {
    assertAdminArea(roles, 'withdrawals', 'view');

    const dateWhere: Prisma.WithdrawalWhereInput = {};
    if (query?.dateFrom || query?.dateTo) {
      dateWhere.requestedAt = {};
      if (query.dateFrom) dateWhere.requestedAt.gte = new Date(query.dateFrom);
      if (query.dateTo) dateWhere.requestedAt.lte = new Date(query.dateTo);
    }

    const [
      pendingCount,
      onHoldCount,
      approvedCount,
      completedCount,
      failedCount,
      highValueCount,
      completedForAvg,
      totalWithdrawnAgg,
      withdrawalsWithRiskFlags,
    ] = await Promise.all([
      this.prisma.withdrawal.count({
        where: {
          ...dateWhere,
          status: { in: [WithdrawalStatus.REQUESTED, WithdrawalStatus.LOCKED] },
        },
      }),
      this.prisma.withdrawal.count({
        where: {
          ...dateWhere,
          status: { in: [WithdrawalStatus.ON_HOLD, WithdrawalStatus.REVIEW] },
        },
      }),
      this.prisma.withdrawal.count({
        where: {
          ...dateWhere,
          status: {
            in: [WithdrawalStatus.APPROVED, WithdrawalStatus.PROCESSING],
          },
        },
      }),
      this.prisma.withdrawal.count({
        where: { ...dateWhere, status: WithdrawalStatus.COMPLETED },
      }),
      this.prisma.withdrawal.count({
        where: {
          ...dateWhere,
          status: {
            in: [
              WithdrawalStatus.CANCELLED,
              WithdrawalStatus.REJECTED,
              WithdrawalStatus.FAILED,
            ],
          },
        },
      }),
      this.prisma.withdrawal.count({
        where: {
          ...dateWhere,
          walletTx: {
            amount: { gte: new Prisma.Decimal(HIGH_VALUE_WITHDRAWAL_USDT) },
          },
        },
      }),
      this.prisma.withdrawal.findMany({
        where: {
          ...dateWhere,
          status: WithdrawalStatus.COMPLETED,
          completedAt: { not: null },
        },
        select: { requestedAt: true, completedAt: true },
        take: 500,
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          withdrawal: {
            ...dateWhere,
            status: WithdrawalStatus.COMPLETED,
          },
        },
        _sum: { netAmount: true },
      }),
      this.prisma.user.count({
        where: {
          riskFlags: { some: { isActive: true } },
          wallets: {
            some: {
              transactions: {
                some: {
                  withdrawal: dateWhere.requestedAt
                    ? { requestedAt: dateWhere.requestedAt }
                    : { isNot: null },
                },
              },
            },
          },
        },
      }),
    ]);

    const totalWithdrawn = Number(
      totalWithdrawnAgg._sum.netAmount?.toString() ?? '0',
    );
    const withRisk = withdrawalsWithRiskFlags;

    let avgProcessingMinutes: number | null = null;
    if (completedForAvg.length) {
      const totalMs = completedForAvg.reduce((s, w) => {
        if (!w.completedAt) return s;
        return s + (w.completedAt.getTime() - w.requestedAt.getTime());
      }, 0);
      avgProcessingMinutes = Math.round(
        totalMs / completedForAvg.length / 60000,
      );
    }

    return {
      totalWithdrawnUsdt: totalWithdrawn.toFixed(2).replace(/\.00$/, ''),
      pendingCount,
      onHoldCount,
      approvedCount,
      completedCount,
      failedCount,
      avgProcessingMinutes,
      highValueCount,
      withdrawalsWithRiskFlags: withRisk,
    };
  }

  async list(roles: string[], query: AdminWithdrawalsQueryDto) {
    assertAdminArea(roles, 'withdrawals', 'view');
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where = this.buildWhere(query);
    const orderBy = this.buildOrderBy(query);

    const [total, rows] = await Promise.all([
      this.prisma.withdrawal.count({ where }),
      this.prisma.withdrawal.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: this.include(),
      }),
    ]);

    const items = await this.mapRowsWithContext(rows);
    return buildPaginated(items, total, page, pageSize);
  }

  async getById(roles: string[], id: string, include?: string) {
    assertAdminArea(roles, 'withdrawals', 'view');
    const row = await this.prisma.withdrawal.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!row) {
      throwAdminError(
        'WITHDRAWAL_NOT_FOUND',
        'Withdrawal not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const [ctx] = await this.buildContextMaps([row]);
    const detail: AdminWithdrawalDetailDto = mapWithdrawalDetail(row, ctx);

    const parts = (include ?? '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.includes('ledger') || parts.includes('wallet')) {
      detail.ledger = mapWithdrawalLedger(row);
    }
    if (parts.includes('audit')) {
      detail.audit = await this.loadAudit(id);
    }
    if (parts.includes('approvals') || parts.includes('approval')) {
      const hasRisk = Boolean(
        (await this.buildContextMaps([row]))[0]?.hasRiskFlag,
      );
      (detail as AdminWithdrawalDetailDto & { approvalStatus?: unknown }).approvalStatus =
        await this.withdrawalApprovals.getApprovalStatus(
          id,
          row.walletTx.amount,
          hasRisk,
        );
    }
    if (parts.includes('user') || parts.includes('userContext')) {
      detail.userContext = await this.loadUserContext(
        row.walletTx.wallet.userId,
        row.walletTx.walletId,
      );
    }

    return detail;
  }

  private async mapRowsWithContext(
    rows: Prisma.WithdrawalGetPayload<{
      include: ReturnType<AdminWithdrawalsService['include']>;
    }>[],
  ) {
    if (!rows.length) return [];
    const contexts = await this.buildContextMaps(rows);
    return rows.map((row, i) => mapWithdrawalListItem(row, contexts[i]));
  }

  private async buildContextMaps(
    rows: Prisma.WithdrawalGetPayload<{
      include: ReturnType<AdminWithdrawalsService['include']>;
    }>[],
  ) {
    const userIds = [...new Set(rows.map((r) => r.walletTx.wallet.userId))];
    const riskFlags = await this.prisma.riskFlag.findMany({
      where: { userId: { in: userIds }, isActive: true },
      select: { userId: true, severity: true },
    });
    const riskByUser = new Map<string, string>();
    for (const f of riskFlags) {
      if (!riskByUser.has(f.userId)) riskByUser.set(f.userId, f.severity);
    }
    return rows.map((row) => ({
      hasRiskFlag: riskByUser.has(row.walletTx.wallet.userId),
      riskSeverity: riskByUser.get(row.walletTx.wallet.userId) ?? null,
    }));
  }

  private buildWhere(
    query: AdminWithdrawalsQueryDto,
  ): Prisma.WithdrawalWhereInput {
    const where: Prisma.WithdrawalWhereInput = {};
    const andParts: Prisma.WithdrawalWhereInput[] = [];

    if (query.search?.trim()) {
      const q = query.search.trim();
      andParts.push({
        OR: [
          { id: q },
          { blockchainTxid: { contains: q, mode: 'insensitive' } },
          { toAddress: { contains: q, mode: 'insensitive' } },
          { walletTx: { walletId: q } },
          { walletTx: { wallet: { userId: q } } },
          {
            walletTx: {
              wallet: { user: { email: { contains: q, mode: 'insensitive' } } },
            },
          },
        ],
      });
    }

    if (query.status && query.status !== 'all') {
      where.status = apiWithdrawalStatusToDb(query.status);
    }

    const minA = this.parseNum(query.minAmount);
    const maxA = this.parseNum(query.maxAmount);
    if (minA !== null || maxA !== null) {
      where.walletTx = {
        amount: {
          ...(minA !== null ? { gte: new Prisma.Decimal(minA) } : {}),
          ...(maxA !== null ? { lte: new Prisma.Decimal(maxA) } : {}),
        },
      };
    }

    if (query.dateFrom || query.dateTo) {
      where.requestedAt = {};
      if (query.dateFrom) where.requestedAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.requestedAt.lte = new Date(query.dateTo);
    }

    if (query.withdrawalFilter === 'high_value') {
      where.walletTx = {
        ...(where.walletTx as object),
        amount: { gte: new Prisma.Decimal(HIGH_VALUE_WITHDRAWAL_USDT) },
      };
    }
    if (query.withdrawalFilter === 'on_hold') {
      where.status = {
        in: [WithdrawalStatus.ON_HOLD, WithdrawalStatus.REVIEW],
      };
    }
    if (query.withdrawalFilter === 'failed') {
      where.status = {
        in: [
          WithdrawalStatus.FAILED,
          WithdrawalStatus.CANCELLED,
          WithdrawalStatus.REJECTED,
        ],
      };
    }
    if (query.withdrawalFilter === 'no_tx_hash') {
      andParts.push({ OR: [{ blockchainTxid: null }, { blockchainTxid: '' }] });
    }
    if (query.withdrawalFilter === 'pending_queue') {
      where.status = {
        in: [
          WithdrawalStatus.REQUESTED,
          WithdrawalStatus.LOCKED,
          WithdrawalStatus.APPROVED,
          WithdrawalStatus.PROCESSING,
        ],
      };
    }
    if (query.withdrawalFilter === 'with_risk') {
      andParts.push({
        walletTx: {
          wallet: { user: { riskFlags: { some: { isActive: true } } } },
        },
      });
    }

    if (query.hasRisk === 'true' || query.hasRisk === '1') {
      andParts.push({
        walletTx: {
          wallet: { user: { riskFlags: { some: { isActive: true } } } },
        },
      });
    }

    if (andParts.length) {
      where.AND = [
        ...(Array.isArray(where.AND)
          ? where.AND
          : where.AND
            ? [where.AND]
            : []),
        ...andParts,
      ];
    }

    return where;
  }

  private buildOrderBy(
    query: AdminWithdrawalsQueryDto,
  ): Prisma.WithdrawalOrderByWithRelationInput {
    const dir = query.sortDir ?? 'desc';
    switch (query.sortBy) {
      case 'oldest':
        return { requestedAt: 'asc' };
      case 'amount':
        return { walletTx: { amount: dir } };
      default:
        return { requestedAt: dir };
    }
  }

  private parseNum(v?: string): number | null {
    if (v == null || v.trim() === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  private async loadAudit(withdrawalId: string) {
    const rows = await this.prisma.auditLog.findMany({
      where: { entityType: 'withdrawal', entityId: withdrawalId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { actorUser: { select: { email: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      actorEmail: r.actorUser?.email ?? null,
      before: r.beforeJsonb,
      after: r.afterJsonb,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  private async loadUserContext(userId: string, walletId: string) {
    const [user, balance, depCount, wdCount, riskFlags] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, status: true },
      }),
      this.prisma.walletBalance.findUnique({ where: { walletId } }),
      this.prisma.deposit.count({
        where: { walletTx: { walletId } },
      }),
      this.prisma.withdrawal.count({
        where: { walletTx: { walletId } },
      }),
      this.prisma.riskFlag.findMany({
        where: { userId, isActive: true },
        select: { id: true, flagCode: true, severity: true },
        take: 10,
      }),
    ]);

    return {
      userEmail: user?.email ?? '',
      userStatus: user?.status.toLowerCase() ?? 'unknown',
      availableUsdt: Number(balance?.available.toString() ?? 0).toFixed(2),
      lockedUsdt: Number(balance?.locked.toString() ?? 0).toFixed(2),
      previousDepositsCount: depCount,
      previousWithdrawalsCount: wdCount,
      riskFlags: riskFlags.map((f) => ({
        id: f.id,
        flagCode: f.flagCode,
        severity: f.severity,
      })),
    };
  }

  private async transition(
    actorId: string,
    actorRoles: string[],
    id: string,
    action: 'approve' | 'reject' | 'hold' | 'complete',
    note: string | undefined,
    rejectionReason: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
    blockchainTxid?: string,
    manualOverride?: boolean,
    manualCompleteReason?: string,
  ) {
    assertAdminArea(actorRoles, 'withdrawals', 'approve');

    const existing = await this.prisma.withdrawal.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!existing) {
      throwAdminError(
        'WITHDRAWAL_NOT_FOUND',
        'Withdrawal not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const [ctx] = await this.buildContextMaps([existing]);
    const hasRiskFlag = ctx?.hasRiskFlag ?? false;
    const amount = existing.walletTx.amount;
    const beforeStatus = mapWithdrawalListItem(existing).status;

    if (action === 'approve') {
      const required = await this.withdrawalApprovals.getRequiredRoles(
        amount,
        hasRiskFlag,
      );
      const approvalRole = this.withdrawalApprovals.resolveActorApprovalRole(
        actorRoles,
        required,
      );
      if (!approvalRole) {
        throwAdminError(
          'APPROVAL_ROLE_REQUIRED',
          'Недостаточно прав для подтверждения на этом уровне',
          HttpStatus.FORBIDDEN,
        );
      }
      await this.withdrawalApprovals.recordApproval(
        id,
        actorId,
        approvalRole,
        note,
      );
    }

    if (action === 'complete') {
      await this.withdrawalApprovals.assertApprovalsSatisfied(
        id,
        amount,
        hasRiskFlag,
      );
    }

    const updated = await this.prisma.$transaction(
      async (tx) => {
      const row = await tx.withdrawal.findUnique({
        where: { id },
        include: this.include(),
      });
      if (!row) {
        throwAdminError(
          'WITHDRAWAL_NOT_FOUND',
          'Withdrawal not found',
          HttpStatus.NOT_FOUND,
        );
      }
      if (action === 'approve' || action === 'complete') {
        await this.enforcement.assertWithdrawalCanComplete(id, tx);
      }

      let nextStatus: WithdrawalStatus;
      switch (action) {
        case 'approve': {
          await this.settlement.ensureLocked(tx, row, actorId);
          const approvalStatus =
            await this.withdrawalApprovals.getApprovalStatus(
              id,
              amount,
              hasRiskFlag,
              tx,
            );
          nextStatus = approvalStatus.satisfied
            ? WithdrawalStatus.APPROVED
            : WithdrawalStatus.LOCKED;
          break;
        }
        case 'hold':
          nextStatus = await this.settlement.hold(tx, row, actorId);
          break;
        case 'reject':
          nextStatus = await this.settlement.reject(
            tx,
            row,
            actorId,
            rejectionReason,
          );
          break;
        case 'complete':
          this.providerLifecycle.assertCanComplete(row, {
            actorRoles,
            blockchainTxid,
            manualOverride,
            manualReason: manualCompleteReason,
          });
          nextStatus = await this.settlement.complete(
            tx,
            row,
            actorId,
            blockchainTxid,
          );
          break;
        default:
          throwAdminError(
            'INVALID_ACTION',
            'Unknown action',
            HttpStatus.BAD_REQUEST,
          );
      }

      const data: Prisma.WithdrawalUpdateInput = { status: nextStatus };
      if (action === 'complete') {
        data.completedAt = new Date();
        data.processedAt = new Date();
        if (blockchainTxid?.trim()) {
          data.blockchainTxid = blockchainTxid.trim();
        }
        if (manualOverride) {
          data.manualCompleteOverride = true;
          data.manualCompleteReason = manualCompleteReason?.trim() ?? null;
        }
        if (!row.providerStatus) {
          data.providerStatus = blockchainTxid?.trim()
            ? WithdrawalProviderStatus.BROADCASTED
            : manualOverride
              ? WithdrawalProviderStatus.CONFIRMED
              : undefined;
        }
      }
      if (action === 'approve' || action === 'hold') {
        data.processedAt = new Date();
      }
      if (action === 'approve') data.approvedAt = new Date();
      if (action === 'reject') data.rejectionReason = rejectionReason ?? null;

      return tx.withdrawal.update({
        where: { id },
        data,
        include: this.include(),
      });
    },
      { timeout: 15_000 },
    );

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles,
      entityType: 'withdrawal',
      entityId: id,
      action: `withdrawal.${action}`,
      before: { status: beforeStatus },
      after: {
        status: mapWithdrawalListItem(updated).status,
        note,
        ledgerMutation: true,
      },
      ...meta,
    });

    return mapWithdrawalListItem(updated, undefined, { reviewedBy: actorId });
  }

  approve(
    actorId: string,
    actorRoles: string[],
    id: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    return this.transition(
      actorId,
      actorRoles,
      id,
      'approve',
      note,
      undefined,
      meta,
    );
  }

  reject(
    actorId: string,
    actorRoles: string[],
    id: string,
    note: string | undefined,
    rejectionReason: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    return this.transition(
      actorId,
      actorRoles,
      id,
      'reject',
      note,
      rejectionReason,
      meta,
    );
  }

  hold(
    actorId: string,
    actorRoles: string[],
    id: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    return this.transition(
      actorId,
      actorRoles,
      id,
      'hold',
      note,
      undefined,
      meta,
    );
  }

  complete(
    actorId: string,
    actorRoles: string[],
    id: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
    blockchainTxid?: string,
    manualOverride?: boolean,
    manualCompleteReason?: string,
  ) {
    return this.transition(
      actorId,
      actorRoles,
      id,
      'complete',
      note,
      undefined,
      meta,
      blockchainTxid,
      manualOverride,
      manualCompleteReason,
    );
  }
}
