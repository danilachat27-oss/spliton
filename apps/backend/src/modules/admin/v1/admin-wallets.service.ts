import { HttpStatus, Injectable } from '@nestjs/common';
import {
  DepositStatus,
  Prisma,
  UserRoleCode,
  UserStatus,
  WalletStatus,
  WalletTransaction,
  WalletTxStatus,
  WalletTxType,
  WithdrawalStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { assertAdminArea } from '../common/admin-permissions';
import { throwAdminError } from '../common/admin-http.util';
import { buildPaginated } from '../common/types/paginated-response.type';
import type { AdminWalletsQueryDto } from './dto/admin-wallets-query.dto';
import {
  mapLedgerEntry,
  mapTxTypeToOperation,
  mapWalletDetail,
  mapWalletListItem,
  type AdminWalletDetailDto,
  type AdminWalletSummaryDto,
} from './mappers/admin-wallet.mapper';
import { depositStatusToApi } from './mappers/admin-deposit.mapper';
import { mapWithdrawal } from './mappers/admin-withdrawal.mapper';

const STAFF_ROLE_CODES = new Set<string>([
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.ACCOUNTANT,
  UserRoleCode.CONTENT_MANAGER,
  UserRoleCode.SUPPORT_MANAGER,
  UserRoleCode.COMPLIANCE,
  UserRoleCode.BUSINESS_ANALYST,
]);

const PENDING_WITHDRAWAL_STATUSES: WithdrawalStatus[] = [
  WithdrawalStatus.REQUESTED,
  WithdrawalStatus.PROCESSING,
  WithdrawalStatus.ON_HOLD,
];

const PENDING_DEPOSIT_STATUSES: DepositStatus[] = [
  DepositStatus.PENDING,
  DepositStatus.CONFIRMING,
  DepositStatus.MANUAL_REVIEW,
];

@Injectable()
export class AdminWalletsService {
  constructor(private readonly prisma: PrismaService) {}

  private walletInclude() {
    return {
      user: {
        include: {
          profile: true,
          userRoles: { include: { role: true } },
        },
      },
      balance: true,
    } satisfies Prisma.WalletInclude;
  }

  async summary(roles: string[]): Promise<AdminWalletSummaryDto> {
    this.assertWalletsView(roles);

    const [
      balanceAgg,
      earnedRow,
      withdrawnRow,
      pendingWdAgg,
      pendingDepAgg,
      activeCount,
      walletsWithRiskFlags,
      anomalousCount,
    ] = await Promise.all([
      this.prisma.walletBalance.aggregate({
        _sum: { available: true, locked: true, pending: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          txType: WalletTxType.PAYOUT,
          status: WalletTxStatus.COMPLETED,
        },
        _sum: { netAmount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          txType: WalletTxType.WITHDRAWAL,
          status: WalletTxStatus.COMPLETED,
        },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          withdrawal: { status: { in: PENDING_WITHDRAWAL_STATUSES } },
        },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          deposit: { status: { in: PENDING_DEPOSIT_STATUSES } },
        },
        _sum: { amount: true },
      }),
      this.prisma.wallet.count({ where: { status: WalletStatus.ACTIVE } }),
      this.prisma.user.count({
        where: {
          riskFlags: { some: { isActive: true } },
          wallets: { some: {} },
        },
      }),
      this.prisma.walletBalance.count({
        where: {
          OR: [
            { available: { lt: 0 } },
            { locked: { lt: 0 } },
            { pending: { lt: 0 } },
          ],
        },
      }),
    ]);

    const pendingWdSum = Number(pendingWdAgg._sum.amount?.toString() ?? '0');
    const pendingDepSum = Number(pendingDepAgg._sum.amount?.toString() ?? '0');

    return {
      totalAvailableUsdt: this.decStr(balanceAgg._sum.available?.toString()),
      totalLockedUsdt: this.decStr(balanceAgg._sum.locked?.toString()),
      totalPendingUsdt: this.decStr(balanceAgg._sum.pending?.toString()),
      totalEarnedUsdt: this.decStr(earnedRow._sum.netAmount?.toString()),
      totalWithdrawnUsdt: this.decStr(withdrawnRow._sum.amount?.toString()),
      pendingWithdrawalsUsdt: pendingWdSum.toFixed(2).replace(/\.00$/, ''),
      pendingDepositsUsdt: pendingDepSum.toFixed(2).replace(/\.00$/, ''),
      activeWalletsCount: activeCount,
      walletsWithRiskFlags,
      anomalousWalletsCount: anomalousCount,
    };
  }

  async list(roles: string[], query: AdminWalletsQueryDto) {
    this.assertWalletsView(roles);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where = this.buildWhere(query);
    const orderBy = this.buildOrderBy(query);

    const [total, rows] = await Promise.all([
      this.prisma.wallet.count({ where }),
      this.prisma.wallet.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: this.walletInclude(),
      }),
    ]);

    const items = await this.mapRowsWithContext(rows);
    return buildPaginated(items, total, page, pageSize);
  }

  async getById(roles: string[], id: string, include?: string) {
    this.assertWalletsView(roles);
    const row = await this.prisma.wallet.findUnique({
      where: { id },
      include: this.walletInclude(),
    });
    if (!row) {
      throwAdminError(
        'WALLET_NOT_FOUND',
        'Wallet not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const [ctx] = await this.buildContextMaps([row]);
    const detail: AdminWalletDetailDto = mapWalletDetail(row, ctx);

    const parts = (include ?? '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.includes('transactions') || parts.includes('ledger')) {
      detail.ledger = await this.loadLedger(row.id);
    }
    if (parts.includes('deposits')) {
      detail.deposits = await this.loadDeposits(row.id);
    }
    if (parts.includes('withdrawals')) {
      detail.withdrawals = await this.loadWithdrawals(row.id);
    }
    if (parts.includes('market')) {
      detail.market = await this.loadMarket(row.userId);
    }
    if (parts.includes('risk')) {
      detail.risk = await this.loadRisk(row.userId);
    }
    if (parts.includes('audit') && this.canViewAudit(roles)) {
      detail.audit = await this.loadAudit(row.userId, row.id);
    }

    return detail;
  }

  async listTransactions(
    roles: string[],
    walletId: string,
    query: AdminWalletsQueryDto,
  ) {
    this.assertWalletsView(roles);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where: Prisma.WalletTransactionWhereInput = { walletId };

    if (query.status) {
      const key = query.status.toUpperCase() as keyof typeof WalletTxStatus;
      if (WalletTxStatus[key]) where.status = WalletTxStatus[key];
    }
    if (query.role) {
      const op = query.role.toUpperCase() as keyof typeof WalletTxType;
      if (WalletTxType[op]) where.txType = WalletTxType[op];
    }
    if (query.dateFrom || query.dateTo) {
      where.happenedAt = {};
      if (query.dateFrom) where.happenedAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.happenedAt.lte = new Date(query.dateTo);
    }

    const [total, rows] = await Promise.all([
      this.prisma.walletTransaction.count({ where }),
      this.prisma.walletTransaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { happenedAt: 'desc' },
      }),
    ]);

    const ledger = await this.loadLedger(walletId, rows);
    return buildPaginated(ledger, total, page, pageSize);
  }

  async getUserWallet(roles: string[], userId: string, include?: string) {
    this.assertWalletsView(roles);
    const row = await this.prisma.wallet.findFirst({
      where: { userId },
      include: this.walletInclude(),
    });
    if (!row) {
      throwAdminError(
        'WALLET_NOT_FOUND',
        'Wallet not found for user',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.getById(roles, row.id, include);
  }

  async getUserWalletTransactions(
    roles: string[],
    userId: string,
    query: AdminWalletsQueryDto,
  ) {
    const wallet = await this.prisma.wallet.findFirst({ where: { userId } });
    if (!wallet) {
      throwAdminError(
        'WALLET_NOT_FOUND',
        'Wallet not found for user',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.listTransactions(roles, wallet.id, query);
  }

  private buildWhere(query: AdminWalletsQueryDto): Prisma.WalletWhereInput {
    const where: Prisma.WalletWhereInput = {};
    const andParts: Prisma.WalletWhereInput[] = [];

    if (query.search?.trim()) {
      const q = query.search.trim();
      andParts.push({
        OR: [
          { id: q },
          { userId: q },
          { user: { email: { contains: q, mode: 'insensitive' } } },
          {
            user: {
              profile: { displayName: { contains: q, mode: 'insensitive' } },
            },
          },
        ],
      });
    }

    if (query.asset?.trim() && query.asset !== 'all') {
      where.assetCode = query.asset.trim().toUpperCase();
    }
    if (query.network?.trim() && query.network !== 'all') {
      where.network = query.network.trim().toUpperCase();
    }

    if (query.userStatus === 'active') {
      where.user = { status: UserStatus.ACTIVE };
    } else if (query.userStatus === 'blocked') {
      where.user = {
        status: { in: [UserStatus.SUSPENDED, UserStatus.BANNED] },
      };
    } else if (query.userStatus === 'staff') {
      where.user = {
        userRoles: {
          some: {
            role: { code: { in: [...STAFF_ROLE_CODES] as UserRoleCode[] } },
          },
        },
      };
    } else if (query.userStatus === 'risk') {
      where.user = { riskFlags: { some: { isActive: true } } };
    }

    const minA = this.parseNum(query.minAvailable);
    const maxA = this.parseNum(query.maxAvailable);
    if (minA !== null || maxA !== null) {
      where.balance = {};
      if (minA !== null)
        where.balance.available = { gte: new Prisma.Decimal(minA) };
      if (maxA !== null)
        where.balance.available = {
          ...(where.balance.available as object),
          lte: new Prisma.Decimal(maxA),
        };
    }

    const minL = this.parseNum(query.minLocked);
    const maxL = this.parseNum(query.maxLocked);
    if (minL !== null || maxL !== null) {
      where.balance = where.balance ?? {};
      if (minL !== null)
        where.balance.locked = { gte: new Prisma.Decimal(minL) };
      if (maxL !== null)
        where.balance.locked = {
          ...(where.balance.locked as object),
          lte: new Prisma.Decimal(maxL),
        };
    }

    if (query.dateFrom || query.dateTo) {
      where.updatedAt = {};
      if (query.dateFrom) where.updatedAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.updatedAt.lte = new Date(query.dateTo);
    }

    if (query.walletFilter === 'locked') {
      where.balance = { ...(where.balance as object), locked: { gt: 0 } };
    }
    if (query.walletFilter === 'pending_withdrawal') {
      where.transactions = {
        some: {
          txType: WalletTxType.WITHDRAWAL,
          status: WalletTxStatus.PENDING,
        },
      };
    }
    if (query.walletFilter === 'pending_deposit') {
      where.transactions = {
        some: {
          txType: WalletTxType.DEPOSIT,
          status: WalletTxStatus.PENDING,
        },
      };
    }
    if (query.walletFilter === 'risk') {
      where.user = { riskFlags: { some: { isActive: true } } };
    }
    if (query.walletFilter === 'recent_activity') {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      where.updatedAt = { gte: since };
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
    query: AdminWalletsQueryDto,
  ): Prisma.WalletOrderByWithRelationInput {
    const dir = query.sortDir ?? 'desc';
    switch (query.sortBy) {
      case 'available':
        return { balance: { available: dir } };
      case 'locked':
        return { balance: { locked: dir } };
      case 'last_activity':
        return { updatedAt: dir };
      case 'created_at':
        return { createdAt: dir };
      default:
        return { updatedAt: dir };
    }
  }

  private async mapRowsWithContext(
    rows: Prisma.WalletGetPayload<{
      include: ReturnType<AdminWalletsService['walletInclude']>;
    }>[],
  ) {
    if (!rows.length) return [];
    const contexts = await this.buildContextMaps(rows);
    return rows.map((row, i) => mapWalletListItem(row, contexts[i]));
  }

  private async buildContextMaps(
    rows: Prisma.WalletGetPayload<{
      include: ReturnType<AdminWalletsService['walletInclude']>;
    }>[],
  ) {
    const walletIds = rows.map((r) => r.id);
    const userIds = [...new Set(rows.map((r) => r.userId))];

    const [
      aggRows,
      lastTxRows,
      riskFlags,
      pendingWdWallets,
      pendingDepWallets,
    ] = await Promise.all([
      this.prisma.walletTransaction.groupBy({
        by: ['walletId', 'txType'],
        where: {
          walletId: { in: walletIds },
          status: WalletTxStatus.COMPLETED,
        },
        _sum: { amount: true, netAmount: true },
      }),
      this.prisma.walletTransaction.findMany({
        where: { walletId: { in: walletIds } },
        orderBy: { happenedAt: 'desc' },
        distinct: ['walletId'],
      }),
      this.prisma.riskFlag.findMany({
        where: { userId: { in: userIds }, isActive: true },
        select: { userId: true, severity: true },
      }),
      this.prisma.withdrawal.findMany({
        where: {
          status: { in: PENDING_WITHDRAWAL_STATUSES },
          walletTx: { walletId: { in: walletIds } },
        },
        select: { walletTx: { select: { walletId: true } } },
      }),
      this.prisma.deposit.findMany({
        where: {
          status: { in: PENDING_DEPOSIT_STATUSES },
          walletTx: { walletId: { in: walletIds } },
        },
        select: { walletTx: { select: { walletId: true } } },
      }),
    ]);

    const earnedByWallet = new Map<string, number>();
    const withdrawnByWallet = new Map<string, number>();
    const depositedByWallet = new Map<string, number>();

    for (const g of aggRows) {
      const amt = Number(
        (g._sum.netAmount ?? g._sum.amount ?? new Prisma.Decimal(0)).toString(),
      );
      if (g.txType === WalletTxType.PAYOUT) {
        earnedByWallet.set(
          g.walletId,
          (earnedByWallet.get(g.walletId) ?? 0) + amt,
        );
      }
      if (g.txType === WalletTxType.WITHDRAWAL) {
        withdrawnByWallet.set(
          g.walletId,
          (withdrawnByWallet.get(g.walletId) ?? 0) + amt,
        );
      }
      if (g.txType === WalletTxType.DEPOSIT) {
        depositedByWallet.set(
          g.walletId,
          (depositedByWallet.get(g.walletId) ?? 0) + amt,
        );
      }
    }

    const lastTxByWallet = new Map(lastTxRows.map((t) => [t.walletId, t]));
    const riskByUser = new Map<string, string>();
    for (const f of riskFlags) {
      if (!riskByUser.has(f.userId)) riskByUser.set(f.userId, f.severity);
    }
    const pendingWdSet = new Set(
      pendingWdWallets.map((w) => w.walletTx.walletId),
    );
    const pendingDepSet = new Set(
      pendingDepWallets.map((d) => d.walletTx.walletId),
    );

    return rows.map((row) => {
      const last = lastTxByWallet.get(row.id);
      return {
        earnedTotalUsdt: (earnedByWallet.get(row.id) ?? 0)
          .toFixed(2)
          .replace(/\.00$/, ''),
        withdrawnTotalUsdt: (withdrawnByWallet.get(row.id) ?? 0)
          .toFixed(2)
          .replace(/\.00$/, ''),
        depositsTotalUsdt: (depositedByWallet.get(row.id) ?? 0)
          .toFixed(2)
          .replace(/\.00$/, ''),
        lastOperationType: last
          ? mapTxTypeToOperation(last.txType, last.status, last.referenceType)
          : null,
        lastOperationStatus: last ? last.status.toLowerCase() : null,
        lastTransactionAt: last?.happenedAt ?? null,
        hasRiskFlag: riskByUser.has(row.userId),
        riskSeverity: riskByUser.get(row.userId) ?? null,
        hasPendingWithdrawal: pendingWdSet.has(row.id),
        hasPendingDeposit: pendingDepSet.has(row.id),
      };
    });
  }

  private async loadLedger(walletId: string, preloaded?: WalletTransaction[]) {
    const txs =
      preloaded ??
      (await this.prisma.walletTransaction.findMany({
        where: { walletId },
        orderBy: { happenedAt: 'asc' },
        take: 500,
      }));

    const wallet = await this.prisma.walletBalance.findUnique({
      where: { walletId },
    });
    let running = Number(wallet?.available.toString() ?? 0);
    const sorted = [...txs].sort(
      (a, b) => a.happenedAt.getTime() - b.happenedAt.getTime(),
    );
    const withBalance = sorted.map((tx) => {
      const net = Number(tx.netAmount.toString());
      if (tx.direction === 'IN') running += net;
      else running -= net;
      return mapLedgerEntry(tx, running.toFixed(2));
    });
    return withBalance.reverse();
  }

  private async loadDeposits(walletId: string) {
    const rows = await this.prisma.deposit.findMany({
      where: { walletTx: { walletId } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        walletTx: {
          include: { wallet: { select: { network: true } } },
        },
      },
    });
    return rows.map((d) => ({
      id: d.id,
      amountUsdt: Number(d.walletTx.amount.toString()).toFixed(2),
      network: d.walletTx.wallet.network,
      address: d.toAddress ?? '—',
      txHash: d.blockchainTxid ?? '—',
      status: depositStatusToApi(d.status),
      confirmations: d.confirmations,
      createdAt: d.createdAt.toISOString(),
      completedAt: d.walletTx.settledAt?.toISOString() ?? null,
    }));
  }

  private async loadWithdrawals(walletId: string) {
    const rows = await this.prisma.withdrawal.findMany({
      where: { walletTx: { walletId } },
      orderBy: { requestedAt: 'desc' },
      take: 50,
      include: {
        walletTx: { include: { wallet: { include: { user: true } } } },
      },
    });
    return rows.map((w) => ({
      id: w.id,
      amountGrossUsdt: Number(w.walletTx.amount.toString()).toFixed(2),
      feeUsdt: Number(w.walletTx.feeAmount.toString()).toFixed(2),
      netAmountUsdt: Number(w.walletTx.netAmount.toString()).toFixed(2),
      address: w.toAddress,
      status: mapWithdrawal(w).status,
      requestedAt: w.requestedAt.toISOString(),
      reviewedBy: null,
      completedAt: w.completedAt?.toISOString() ?? null,
      blockchainTxId: w.blockchainTxid,
    }));
  }

  private async loadMarket(userId: string) {
    const fills = await this.prisma.orderFill.findMany({
      where: { order: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: {
        order: { include: { release: { select: { title: true } } } },
      },
    });

    const tradeItems = await this.prisma.trade.findMany({
      where: { OR: [{ buyerUserId: userId }, { sellerUserId: userId }] },
      orderBy: { executedAt: 'desc' },
      take: 20,
      include: { release: { select: { title: true } } },
    });

    const fillItems = fills.map((f) => ({
      id: f.id,
      kind: f.order.listingId
        ? f.side === 'BUY'
          ? ('secondary_buy' as const)
          : ('secondary_sell' as const)
        : ('primary' as const),
      releaseTitle: f.order.release?.title ?? null,
      units: Number(f.units.toString()).toFixed(0),
      amountUsdt: Number(f.grossAmount.toString()).toFixed(2),
      feeUsdt: Number(f.feeAmount.toString()).toFixed(2),
      status: f.order.status.toLowerCase(),
      happenedAt: f.createdAt.toISOString(),
    }));

    const tradeMapped = tradeItems.map((t) => ({
      id: t.id,
      kind:
        t.buyerUserId === userId
          ? ('secondary_buy' as const)
          : ('secondary_sell' as const),
      releaseTitle: t.release.title,
      units: Number(t.units.toString()).toFixed(0),
      amountUsdt: Number(t.grossAmount.toString()).toFixed(2),
      feeUsdt: Number(t.feeTotal.toString()).toFixed(2),
      status: t.settlementStatus.toLowerCase(),
      happenedAt: t.executedAt.toISOString(),
    }));

    const seen = new Set<string>();
    return [...fillItems, ...tradeMapped]
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a, b) => b.happenedAt.localeCompare(a.happenedAt))
      .slice(0, 40);
  }

  private async loadRisk(userId: string) {
    const rows = await this.prisma.riskFlag.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      flagCode: r.flagCode,
      severity: r.severity,
      status: r.status.toLowerCase(),
      note: r.note,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  private async loadAudit(userId: string, walletId: string) {
    const rows = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { actorUserId: userId },
          { AND: [{ entityType: 'user' }, { entityId: userId }] },
          { AND: [{ entityType: 'wallet' }, { entityId: walletId }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { actorUser: { select: { email: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      actorEmail: r.actorUser?.email ?? null,
      entityType: r.entityType,
      entityId: r.entityId,
      summary: r.action,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  private assertWalletsView(roles: string[]) {
    assertAdminArea(roles, 'wallets', 'view');
  }

  private canViewAudit(roles: string[]): boolean {
    return roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'COMPLIANCE'].includes(r),
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
