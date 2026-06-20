import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ListingStatus,
  Prisma,
  TradeSettlementStatus,
  UserRoleCode,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { assertAdminArea } from '../common/admin-permissions';
import { throwAdminError } from '../common/admin-http.util';
import { buildPaginated } from '../common/types/paginated-response.type';
import type { AdminHoldingsQueryDto } from './dto/admin-holdings-query.dto';
import {
  inferLockReason,
  mapHoldingRow,
  mapOwnershipEventType,
  type AdminHoldingDetailDto,
  type AdminHoldingSummaryDto,
} from './mappers/admin-holding.mapper';
import { apiReleaseStatusToDb } from './mappers/admin-track.mapper';

@Injectable()
export class AdminHoldingsService {
  constructor(private readonly prisma: PrismaService) {}

  private positionInclude() {
    return {
      user: { include: { profile: true } },
      release: {
        include: {
          releaseArtists: {
            include: { artist: true },
            orderBy: { createdAt: 'asc' as const },
            take: 1,
          },
        },
      },
    } satisfies Prisma.UserPositionInclude;
  }

  async summary(roles: string[]): Promise<AdminHoldingSummaryDto> {
    this.assertHoldingsView(roles);

    const [holderRow, agg, earnedAgg, activeListings, riskUsers] =
      await Promise.all([
        this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT user_id)::bigint AS count FROM user_positions
      `,
        this.prisma.userPosition.aggregate({
          _sum: { unitsTotal: true, unitsAvailable: true, unitsLocked: true },
        }),
        this.prisma.payout.aggregate({
          where: { status: 'PAID' },
          _sum: { amountNet: true },
        }),
        this.prisma.marketListing.count({
          where: { status: ListingStatus.ACTIVE, deletedAt: null },
        }),
        this.prisma.riskFlag.findMany({
          where: { isActive: true },
          select: { userId: true },
          distinct: ['userId'],
        }),
      ]);

    const valueRow = await this.prisma.$queryRaw<
      Array<{ total: string | null }>
    >`
      SELECT SUM(units_total * avg_entry_price)::text AS total FROM user_positions
    `;

    const holdersWithPositions = await this.prisma.userPosition.findMany({
      select: { userId: true },
      distinct: ['userId'],
    });
    const positionUserIds = new Set(holdersWithPositions.map((p) => p.userId));
    const holdingsWithRisk = riskUsers.filter((r) =>
      positionUserIds.has(r.userId),
    ).length;

    return {
      totalHolders: Number(holderRow[0]?.count ?? 0),
      totalUnits: this.unitsStr(agg._sum.unitsTotal),
      availableUnits: this.unitsStr(agg._sum.unitsAvailable),
      lockedUnits: this.unitsStr(agg._sum.unitsLocked),
      totalCurrentValueUsdt: this.decStr(valueRow[0]?.total),
      totalEarnedUsdt: this.decStr(earnedAgg._sum.amountNet?.toString()),
      activeListingsCount: activeListings,
      holdingsWithRiskFlags: holdingsWithRisk,
    };
  }

  async list(roles: string[], query: AdminHoldingsQueryDto) {
    this.assertHoldingsView(roles);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where = await this.buildWhere(query);
    const orderBy = this.buildOrderBy(query);

    const [total, rows] = await Promise.all([
      this.prisma.userPosition.count({ where }),
      this.prisma.userPosition.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: this.positionInclude(),
      }),
    ]);

    const items = await this.mapRowsWithContext(rows);
    return buildPaginated(items, total, page, pageSize);
  }

  async getById(roles: string[], id: string, include?: string) {
    this.assertHoldingsView(roles);
    const row = await this.prisma.userPosition.findUnique({
      where: { id },
      include: this.positionInclude(),
    });
    if (!row) {
      throwAdminError(
        'HOLDING_NOT_FOUND',
        'Holding not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const [mapped] = await this.mapRowsWithContext([row]);
    const detail: AdminHoldingDetailDto = mapped;

    const includes = new Set(
      (include ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );

    if (includes.has('history')) {
      detail.history = await this.loadHistory(row.userId, row.releaseId);
    }
    if (includes.has('distributions')) {
      detail.distributions = await this.loadDistributions(
        row.userId,
        row.releaseId,
      );
    }
    if (includes.has('market')) {
      detail.market = await this.loadMarket(row.userId, row.releaseId);
    }
    if (includes.has('wallet') && this.canViewWalletDetails(roles)) {
      detail.wallet = await this.loadWallet(row.userId, row.releaseId);
    }
    if (includes.has('risk')) {
      detail.risk = await this.loadRisk(row.userId);
    }

    return detail;
  }

  async listByUser(
    roles: string[],
    userId: string,
    query: AdminHoldingsQueryDto,
  ) {
    this.assertHoldingsView(roles);
    return this.list(roles, { ...query, userId });
  }

  async listByTrack(
    roles: string[],
    trackId: string,
    query: AdminHoldingsQueryDto,
  ) {
    this.assertHoldingsView(roles);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const baseWhere = await this.buildWhere(query);
    const where: Prisma.UserPositionWhereInput = {
      ...baseWhere,
      releaseId: trackId,
    };

    const [total, rows] = await Promise.all([
      this.prisma.userPosition.count({ where }),
      this.prisma.userPosition.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: this.buildOrderBy(query),
        include: this.positionInclude(),
      }),
    ]);

    return buildPaginated(
      await this.mapRowsWithContext(rows),
      total,
      page,
      pageSize,
    );
  }

  private async buildWhere(
    query: AdminHoldingsQueryDto,
  ): Promise<Prisma.UserPositionWhereInput> {
    const where: Prisma.UserPositionWhereInput = {};
    const andParts: Prisma.UserPositionWhereInput[] = [];

    if (query.userId?.trim()) {
      where.userId = query.userId.trim();
    }

    if (query.search?.trim()) {
      const q = query.search.trim();
      andParts.push({
        OR: [
          { user: { email: { contains: q, mode: 'insensitive' } } },
          { user: { id: q } },
          {
            user: {
              profile: { displayName: { contains: q, mode: 'insensitive' } },
            },
          },
          { release: { title: { contains: q, mode: 'insensitive' } } },
          { releaseId: q },
          { id: q },
        ],
      });
    }

    if (query.releaseStatus && query.releaseStatus !== 'all') {
      where.release = { status: apiReleaseStatusToDb(query.releaseStatus) };
    }

    const minU = this.parseNum(query.minUnits);
    const maxU = this.parseNum(query.maxUnits);
    if (minU !== null || maxU !== null) {
      where.unitsTotal = {};
      if (minU !== null) where.unitsTotal.gte = new Prisma.Decimal(minU);
      if (maxU !== null) where.unitsTotal.lte = new Prisma.Decimal(maxU);
    }

    if (query.dateFrom || query.dateTo) {
      where.updatedAt = {};
      if (query.dateFrom) where.updatedAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.updatedAt.lte = new Date(query.dateTo);
    }

    if (query.holdingFilter === 'locked') {
      where.unitsLocked = { gt: 0 };
    }

    if (query.holdingFilter === 'listing') {
      const pairs = await this.prisma.marketListing.findMany({
        where: { status: ListingStatus.ACTIVE, deletedAt: null },
        select: { sellerUserId: true, releaseId: true },
      });
      andParts.push(
        pairs.length
          ? {
              OR: pairs.map((p) => ({
                userId: p.sellerUserId,
                releaseId: p.releaseId,
              })),
            }
          : { id: { in: ['00000000-0000-0000-0000-000000000000'] } },
      );
    }

    if (query.holdingFilter === 'earned') {
      const earnedPairs = await this.prisma.payout.findMany({
        where: { status: 'PAID' },
        select: { userId: true, releaseId: true },
        distinct: ['userId', 'releaseId'],
      });
      andParts.push(
        earnedPairs.length
          ? {
              OR: earnedPairs.map((p) => ({
                userId: p.userId,
                releaseId: p.releaseId,
              })),
            }
          : { id: { in: ['00000000-0000-0000-0000-000000000000'] } },
      );
    }

    if (query.holdingFilter === 'risk') {
      where.user = { riskFlags: { some: { isActive: true } } };
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

    const minV = this.parseNum(query.minValue);
    const maxV = this.parseNum(query.maxValue);
    if (minV !== null || maxV !== null) {
      const baseWhere = { ...where };
      delete baseWhere.id;
      const all = await this.prisma.userPosition.findMany({
        where: baseWhere,
        select: { id: true, unitsTotal: true, avgEntryPrice: true },
      });
      const ids = all
        .filter((p) => {
          const v =
            Number(p.unitsTotal.toString()) *
            Number(p.avgEntryPrice.toString());
          if (minV !== null && v < minV) return false;
          if (maxV !== null && v > maxV) return false;
          return true;
        })
        .map((p) => p.id);
      where.id = ids.length
        ? { in: ids }
        : { in: ['00000000-0000-0000-0000-000000000000'] };
    }

    return where;
  }

  private buildOrderBy(
    query: AdminHoldingsQueryDto,
  ): Prisma.UserPositionOrderByWithRelationInput {
    const dir = query.sortDir ?? 'desc';
    switch (query.sortBy) {
      case 'total_units':
        return { unitsTotal: dir };
      case 'locked_units':
        return { unitsLocked: dir };
      case 'last_activity':
        return { updatedAt: dir };
      default:
        return { updatedAt: dir };
    }
  }

  private async mapRowsWithContext(
    rows: Prisma.UserPositionGetPayload<{
      include: ReturnType<AdminHoldingsService['positionInclude']>;
    }>[],
  ) {
    if (!rows.length) return [];

    const userIds = [...new Set(rows.map((r) => r.userId))];
    const releaseIds = [...new Set(rows.map((r) => r.releaseId))];
    const earnedMap = await this.earnedMap(userIds, releaseIds);

    const [listings, pendingTrades, riskFlags] = await Promise.all([
      this.prisma.marketListing.findMany({
        where: {
          sellerUserId: { in: userIds },
          releaseId: { in: releaseIds },
          status: ListingStatus.ACTIVE,
          deletedAt: null,
        },
        select: { sellerUserId: true, releaseId: true },
      }),
      this.prisma.trade.findMany({
        where: {
          sellerUserId: { in: userIds },
          releaseId: { in: releaseIds },
          settlementStatus: TradeSettlementStatus.PENDING,
        },
        select: { sellerUserId: true, releaseId: true },
      }),
      this.prisma.riskFlag.findMany({
        where: { userId: { in: userIds }, isActive: true },
        select: { userId: true, severity: true },
      }),
    ]);

    const listingCount = new Map<string, number>();
    for (const l of listings) {
      const k = `${l.sellerUserId}:${l.releaseId}`;
      listingCount.set(k, (listingCount.get(k) ?? 0) + 1);
    }

    const pendingSet = new Set(
      pendingTrades.map((t) => `${t.sellerUserId}:${t.releaseId}`),
    );
    const riskByUser = new Map<string, string>();
    for (const f of riskFlags) {
      if (!riskByUser.has(f.userId)) riskByUser.set(f.userId, f.severity);
    }

    return rows.map((row) => {
      const key = `${row.userId}:${row.releaseId}`;
      const earned = earnedMap.get(key) ?? new Prisma.Decimal(0);
      const locked = Number(row.unitsLocked.toString());
      const lockReason = inferLockReason({
        lockedUnits: locked,
        hasActiveListing: listingCount.has(key),
        hasPendingTrade: pendingSet.has(key),
        hasComplianceRisk: riskByUser.has(row.userId),
      });

      return mapHoldingRow(row, {
        earned,
        activeListingsCount: listingCount.get(key) ?? 0,
        hasRiskFlag: riskByUser.has(row.userId),
        riskSeverity: riskByUser.get(row.userId) ?? null,
        lockReason,
      });
    });
  }

  private async earnedMap(userIds: string[], releaseIds: string[]) {
    const payouts = await this.prisma.payout.findMany({
      where: {
        userId: { in: userIds },
        releaseId: { in: releaseIds },
        status: 'PAID',
      },
      select: { userId: true, releaseId: true, amountNet: true },
    });
    const map = new Map<string, Prisma.Decimal>();
    for (const p of payouts) {
      const key = `${p.userId}:${p.releaseId}`;
      map.set(key, (map.get(key) ?? new Prisma.Decimal(0)).plus(p.amountNet));
    }
    return map;
  }

  private async loadHistory(userId: string, releaseId: string) {
    const rows = await this.prisma.ownershipLedger.findMany({
      where: { userId, releaseId },
      orderBy: { happenedAt: 'desc' },
      take: 100,
    });
    return rows.map((r) => ({
      id: r.id,
      happenedAt: r.happenedAt.toISOString(),
      eventType: mapOwnershipEventType(r.eventType),
      unitsDelta: Number(r.unitsDelta.toString()).toFixed(0),
      pricePerUnit: r.pricePerUnit
        ? Number(r.pricePerUnit.toString()).toFixed(2)
        : null,
      relatedEntityType: r.tradeId
        ? 'trade'
        : r.orderFillId
          ? 'order_fill'
          : r.walletTransactionId
            ? 'wallet_tx'
            : null,
      relatedEntityId:
        r.tradeId ?? r.orderFillId ?? r.walletTransactionId ?? null,
      status: 'completed',
    }));
  }

  private async loadDistributions(userId: string, releaseId: string) {
    const rows = await this.prisma.payout.findMany({
      where: { userId, releaseId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((r) => ({
      id: r.id,
      distributionId: r.earningDistributionId,
      amountNet: Number(r.amountNet.toString()).toFixed(2),
      amountGross: Number(r.amountGross.toString()).toFixed(2),
      status: r.status.toLowerCase(),
      walletTxId: r.walletTxId,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  private async loadMarket(userId: string, releaseId: string) {
    const [listings, buyTrades, sellTrades] = await Promise.all([
      this.prisma.marketListing.findMany({
        where: { sellerUserId: userId, releaseId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { seller: { select: { email: true } } },
      }),
      this.prisma.trade.findMany({
        where: { buyerUserId: userId, releaseId },
        orderBy: { executedAt: 'desc' },
        take: 20,
        include: { seller: { select: { email: true } } },
      }),
      this.prisma.trade.findMany({
        where: { sellerUserId: userId, releaseId },
        orderBy: { executedAt: 'desc' },
        take: 20,
        include: { buyer: { select: { email: true } } },
      }),
    ]);

    const listingItems = listings.map((l) => ({
      id: l.id,
      kind: 'listing' as const,
      side: 'sell',
      pricePerUnit: Number(l.pricePerUnit.toString()).toFixed(2),
      units: Number(l.unitsAvailable.toString()).toFixed(0),
      feeUsdt: null,
      counterpartyEmail: null,
      status: l.status.toLowerCase(),
      happenedAt: l.updatedAt.toISOString(),
    }));

    const tradeItems = [
      ...buyTrades.map((t) => ({
        id: t.id,
        kind: 'trade' as const,
        side: 'buy',
        pricePerUnit: Number(t.price.toString()).toFixed(2),
        units: Number(t.units.toString()).toFixed(0),
        feeUsdt: Number(t.feeTotal.toString()).toFixed(2),
        counterpartyEmail: t.seller.email,
        status: t.settlementStatus.toLowerCase(),
        happenedAt: t.executedAt.toISOString(),
      })),
      ...sellTrades.map((t) => ({
        id: t.id,
        kind: 'trade' as const,
        side: 'sell',
        pricePerUnit: Number(t.price.toString()).toFixed(2),
        units: Number(t.units.toString()).toFixed(0),
        feeUsdt: Number(t.feeTotal.toString()).toFixed(2),
        counterpartyEmail: t.buyer.email,
        status: t.settlementStatus.toLowerCase(),
        happenedAt: t.executedAt.toISOString(),
      })),
    ].sort((a, b) => b.happenedAt.localeCompare(a.happenedAt));

    return [...listingItems, ...tradeItems].slice(0, 40);
  }

  private async loadWallet(userId: string, releaseId: string) {
    const ledger = await this.prisma.ownershipLedger.findMany({
      where: { userId, releaseId, walletTransactionId: { not: null } },
      select: { walletTransactionId: true },
    });
    const payoutTx = await this.prisma.payout.findMany({
      where: { userId, releaseId, walletTxId: { not: null } },
      select: { walletTxId: true },
    });
    const ids = [
      ...ledger.map((l) => l.walletTransactionId!),
      ...payoutTx.map((p) => p.walletTxId!),
    ];
    if (!ids.length) return [];

    const txs = await this.prisma.walletTransaction.findMany({
      where: { id: { in: ids } },
      orderBy: { happenedAt: 'desc' },
      take: 50,
    });

    return txs.map((t) => ({
      id: t.id,
      txType: t.txType.toLowerCase(),
      direction: t.direction.toLowerCase(),
      amount: Number(t.amount.toString()).toFixed(2),
      netAmount: Number(t.netAmount.toString()).toFixed(2),
      status: t.status.toLowerCase(),
      happenedAt: t.happenedAt.toISOString(),
      referenceType: t.referenceType,
      referenceId: t.referenceId,
    }));
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

  private assertHoldingsView(roles: string[]) {
    assertAdminArea(roles, 'holdings', 'view');
    const ok = roles.some((r) =>
      (
        [
          UserRoleCode.SUPER_ADMIN,
          UserRoleCode.ADMIN,
          UserRoleCode.ACCOUNTANT,
          UserRoleCode.SUPPORT_MANAGER,
          UserRoleCode.COMPLIANCE,
          UserRoleCode.CONTENT_MANAGER,
          UserRoleCode.BUSINESS_ANALYST,
        ] as string[]
      ).includes(r),
    );
    if (!ok) {
      throwAdminError(
        'ADMIN_FORBIDDEN',
        'Insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private canViewWalletDetails(roles: string[]): boolean {
    return roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'].includes(r),
    );
  }

  private parseNum(value?: string): number | null {
    if (!value?.trim()) return null;
    const n = Number(value.replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  private unitsStr(v: Prisma.Decimal | null | undefined): string {
    if (!v) return '0';
    return Number(v.toString()).toFixed(0);
  }

  private decStr(v: string | null | undefined): string {
    if (!v) return '0';
    return Number(v).toFixed(2).replace(/\.00$/, '');
  }
}
