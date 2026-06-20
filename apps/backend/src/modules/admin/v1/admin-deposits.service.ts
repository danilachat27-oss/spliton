import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ActorRole,
  DepositStatus,
  LedgerOperationType,
  Prisma,
  WithdrawalStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { assertAdminArea } from '../common/admin-permissions';
import { throwAdminError } from '../common/admin-http.util';
import { buildPaginated } from '../common/types/paginated-response.type';
import { AdminDepositSettlementService } from './admin-deposit-settlement.service';
import type { AdminDepositsQueryDto } from './dto/admin-deposits-query.dto';
import {
  apiDepositStatusToDb,
  HIGH_VALUE_DEPOSIT_USDT,
  mapDepositDetail,
  mapDepositLedger,
  mapDepositListItem,
  type AdminDepositDetailDto,
  type AdminDepositSummaryDto,
} from './mappers/admin-deposit.mapper';

@Injectable()
export class AdminDepositsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly settlement: AdminDepositSettlementService,
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
    } satisfies Prisma.DepositInclude;
  }

  async summary(
    roles: string[],
    query?: AdminDepositsQueryDto,
  ): Promise<AdminDepositSummaryDto> {
    assertAdminArea(roles, 'deposits', 'view');

    const dateWhere: Prisma.DepositWhereInput = {};
    if (query?.dateFrom || query?.dateTo) {
      dateWhere.createdAt = {};
      if (query.dateFrom) dateWhere.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) dateWhere.createdAt.lte = new Date(query.dateTo);
    }

    const [
      pendingCount,
      manualReviewCount,
      completedCount,
      failedCount,
      highValueCount,
      confirmedForAvg,
      totalDepositedAgg,
      depositsWithRiskFlags,
    ] = await Promise.all([
      this.prisma.deposit.count({
        where: {
          ...dateWhere,
          status: {
            in: [
              DepositStatus.PENDING,
              DepositStatus.CONFIRMING,
              DepositStatus.DETECTED,
              DepositStatus.PENDING_CONFIRMATIONS,
            ],
          },
        },
      }),
      this.prisma.deposit.count({
        where: { ...dateWhere, status: DepositStatus.MANUAL_REVIEW },
      }),
      this.prisma.deposit.count({
        where: {
          ...dateWhere,
          status: { in: [DepositStatus.CONFIRMED, DepositStatus.CREDITED] },
        },
      }),
      this.prisma.deposit.count({
        where: { ...dateWhere, status: DepositStatus.FAILED },
      }),
      this.prisma.deposit.count({
        where: {
          ...dateWhere,
          walletTx: {
            amount: { gte: new Prisma.Decimal(HIGH_VALUE_DEPOSIT_USDT) },
          },
        },
      }),
      this.prisma.deposit.findMany({
        where: {
          ...dateWhere,
          status: { in: [DepositStatus.CONFIRMED, DepositStatus.CREDITED] },
          receivedAt: { not: null },
        },
        select: { createdAt: true, receivedAt: true },
        take: 500,
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          deposit: {
            ...dateWhere,
            status: { in: [DepositStatus.CONFIRMED, DepositStatus.CREDITED] },
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.user.count({
        where: {
          riskFlags: { some: { isActive: true } },
          wallets: {
            some: {
              transactions: {
                some: {
                  deposit: dateWhere.createdAt
                    ? { createdAt: dateWhere.createdAt }
                    : { isNot: null },
                },
              },
            },
          },
        },
      }),
    ]);

    const totalDeposited = Number(
      totalDepositedAgg._sum.amount?.toString() ?? '0',
    );
    const withRisk = depositsWithRiskFlags;

    let avgConfirmationMinutes: number | null = null;
    if (confirmedForAvg.length) {
      const totalMs = confirmedForAvg.reduce((s, d) => {
        if (!d.receivedAt) return s;
        return s + (d.receivedAt.getTime() - d.createdAt.getTime());
      }, 0);
      avgConfirmationMinutes = Math.round(
        totalMs / confirmedForAvg.length / 60000,
      );
    }

    return {
      totalDepositedUsdt: totalDeposited.toFixed(2).replace(/\.00$/, ''),
      pendingCount,
      manualReviewCount,
      completedCount,
      failedCount,
      avgConfirmationMinutes,
      highValueCount,
      depositsWithRiskFlags: withRisk,
    };
  }

  async list(roles: string[], query: AdminDepositsQueryDto) {
    assertAdminArea(roles, 'deposits', 'view');
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where = this.buildWhere(query);
    const orderBy = this.buildOrderBy(query);

    const [total, rows] = await Promise.all([
      this.prisma.deposit.count({ where }),
      this.prisma.deposit.findMany({
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
    assertAdminArea(roles, 'deposits', 'view');
    const row = await this.prisma.deposit.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!row) {
      throwAdminError(
        'DEPOSIT_NOT_FOUND',
        'Deposit not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const [ctx] = await this.buildContextMaps([row]);
    const detail: AdminDepositDetailDto = mapDepositDetail(row, ctx);

    const parts = (include ?? '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.includes('ledger') || parts.includes('wallet')) {
      detail.ledger = mapDepositLedger(row);
    }
    if (parts.includes('audit')) {
      detail.audit = await this.loadAudit(id);
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
    rows: Prisma.DepositGetPayload<{
      include: ReturnType<AdminDepositsService['include']>;
    }>[],
  ) {
    if (!rows.length) return [];
    const contexts = await this.buildContextMaps(rows);
    return rows.map((row, i) => mapDepositListItem(row, contexts[i]));
  }

  private async buildContextMaps(
    rows: Prisma.DepositGetPayload<{
      include: ReturnType<AdminDepositsService['include']>;
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

  private buildWhere(query: AdminDepositsQueryDto): Prisma.DepositWhereInput {
    const where: Prisma.DepositWhereInput = {};
    const andParts: Prisma.DepositWhereInput[] = [];

    if (query.search?.trim()) {
      const q = query.search.trim();
      andParts.push({
        OR: [
          { id: q },
          { blockchainTxid: { contains: q, mode: 'insensitive' } },
          { toAddress: { contains: q, mode: 'insensitive' } },
          { fromAddress: { contains: q, mode: 'insensitive' } },
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
      where.status = apiDepositStatusToDb(query.status);
    }

    if (query.asset?.trim() && query.asset !== 'all') {
      where.walletTx = { currency: query.asset.trim().toUpperCase() };
    }
    if (query.network?.trim() && query.network !== 'all') {
      where.walletTx = {
        ...(where.walletTx as object),
        wallet: { network: query.network.trim().toUpperCase() },
      };
    }

    const minA = this.parseNum(query.minAmount);
    const maxA = this.parseNum(query.maxAmount);
    if (minA !== null || maxA !== null) {
      where.walletTx = {
        ...(where.walletTx as object),
        amount: {
          ...(minA !== null ? { gte: new Prisma.Decimal(minA) } : {}),
          ...(maxA !== null ? { lte: new Prisma.Decimal(maxA) } : {}),
        },
      };
    }

    const minConf = this.parseNum(query.minConfirmations);
    if (minConf !== null) {
      where.confirmations = { gte: minConf };
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    if (query.depositFilter === 'manual_review') {
      where.status = DepositStatus.MANUAL_REVIEW;
    }
    if (query.depositFilter === 'high_value') {
      where.walletTx = {
        ...(where.walletTx as object),
        amount: { gte: new Prisma.Decimal(HIGH_VALUE_DEPOSIT_USDT) },
      };
    }
    if (query.depositFilter === 'failed') {
      where.status = DepositStatus.FAILED;
    }
    if (query.depositFilter === 'no_tx_hash') {
      where.OR = [{ blockchainTxid: null }, { blockchainTxid: '' }];
    }
    if (query.depositFilter === 'with_risk') {
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
    query: AdminDepositsQueryDto,
  ): Prisma.DepositOrderByWithRelationInput {
    const dir = query.sortDir ?? 'desc';
    switch (query.sortBy) {
      case 'oldest':
        return { createdAt: 'asc' };
      case 'amount':
        return { walletTx: { amount: dir } };
      case 'confirmations':
        return { confirmations: dir };
      default:
        return { createdAt: dir };
    }
  }

  private async loadAudit(depositId: string) {
    const rows = await this.prisma.auditLog.findMany({
      where: { entityType: 'deposit', entityId: depositId },
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
    const [wallet, depCount, wdCount, riskFlags] = await Promise.all([
      this.prisma.wallet.findUnique({
        where: { id: walletId },
        include: { balance: true, user: true },
      }),
      this.prisma.deposit.count({
        where: {
          walletTx: { wallet: { userId } },
          status: { in: [DepositStatus.CONFIRMED, DepositStatus.CREDITED] },
        },
      }),
      this.prisma.withdrawal.count({
        where: {
          walletTx: { wallet: { userId } },
          status: WithdrawalStatus.COMPLETED,
        },
      }),
      this.prisma.riskFlag.findMany({
        where: { userId, isActive: true },
        select: { id: true, flagCode: true, severity: true },
      }),
    ]);

    return {
      userEmail: wallet?.user.email ?? '—',
      userStatus: wallet?.user.status.toLowerCase() ?? 'unknown',
      availableUsdt: Number(wallet?.balance?.available.toString() ?? 0).toFixed(
        2,
      ),
      lockedUsdt: Number(wallet?.balance?.locked.toString() ?? 0).toFixed(2),
      previousDepositsCount: depCount,
      previousWithdrawalsCount: wdCount,
      riskFlags,
    };
  }

  private async mutate(
    actorId: string,
    actorRoles: string[],
    id: string,
    action: string,
    targetStatus: DepositStatus | 'settle' | 'fail',
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    assertAdminArea(actorRoles, 'deposits', 'mutate');

    const result = await this.prisma.$transaction(async (tx) => {
      const row = await tx.deposit.findUnique({
        where: { id },
        include: this.include(),
      });
      if (!row) {
        throwAdminError(
          'DEPOSIT_NOT_FOUND',
          'Deposit not found',
          HttpStatus.NOT_FOUND,
        );
      }
      const before = mapDepositListItem(row);

      if (targetStatus === 'settle') {
        await this.settlement.settleConfirmed(tx, row, {
          operationType: LedgerOperationType.DEPOSIT_SETTLE,
          sourceEntityType: 'deposit',
          sourceEntityId: row.id,
          actorUserId: actorId,
          actorRole: ActorRole.ADMIN,
          currency: row.walletTx.currency,
        });
      } else if (targetStatus === 'fail') {
        await this.settlement.markFailed(tx, row);
      } else {
        await tx.deposit.update({
          where: { id },
          data: { status: targetStatus },
        });
      }

      const saved = await tx.deposit.findUnique({
        where: { id },
        include: this.include(),
      });
      if (!saved) {
        throwAdminError(
          'DEPOSIT_NOT_FOUND',
          'Deposit not found',
          HttpStatus.NOT_FOUND,
        );
      }

      await this.audit.logOperatorAction({
        actorUserId: actorId,
        actorRoles,
        entityType: 'deposit',
        entityId: id,
        action: `deposit.${action}`,
        before: { status: before.status, note: null },
        after: {
          status: mapDepositListItem(saved).status,
          note: note ?? null,
          ledgerMutation: targetStatus === 'settle',
        },
        ...meta,
      });

      return saved;
    });

    return mapDepositListItem(result);
  }

  patchStatus(
    actorId: string,
    actorRoles: string[],
    id: string,
    status: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    const dbStatus = apiDepositStatusToDb(status);
    if (dbStatus === DepositStatus.CONFIRMED) {
      return this.mutate(
        actorId,
        actorRoles,
        id,
        'status_completed',
        'settle',
        note,
        meta,
      );
    }
    if (dbStatus === DepositStatus.FAILED) {
      return this.mutate(
        actorId,
        actorRoles,
        id,
        'status_failed',
        'fail',
        note,
        meta,
      );
    }
    return this.mutate(
      actorId,
      actorRoles,
      id,
      'status_change',
      dbStatus,
      note,
      meta,
    );
  }

  review(
    actorId: string,
    actorRoles: string[],
    id: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    return this.mutate(
      actorId,
      actorRoles,
      id,
      'manual_review',
      DepositStatus.MANUAL_REVIEW,
      note,
      meta,
    );
  }

  reconcile(
    actorId: string,
    actorRoles: string[],
    id: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    return this.mutate(
      actorId,
      actorRoles,
      id,
      'reconcile',
      'settle',
      note,
      meta,
    );
  }

  private parseNum(value?: string): number | null {
    if (!value?.trim()) return null;
    const n = Number(value.replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  private decStr(v: string | null | undefined): string {
    if (!v) return '0';
    return Number(v).toFixed(2).replace(/\.00$/, '');
  }
}
