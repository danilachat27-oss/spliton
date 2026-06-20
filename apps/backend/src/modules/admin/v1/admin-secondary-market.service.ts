import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ListingStatus,
  OwnershipEventType,
  Prisma,
  TradeSettlementStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  resolveAnalyticsPeriod,
  formatMoneyRu,
} from '../common/admin-analytics.util';
import { AdminAuditService } from '../common/admin-audit.service';
import { throwAdminError } from '../common/admin-http.util';
import { buildPaginated } from '../common/types/paginated-response.type';
import type { AdminSecondaryMarketQueryDto } from './dto/admin-secondary-market-query.dto';
import {
  apiListingStatusToDb,
  buildSummaryMetrics,
  mapListingListItem,
  mapTradeListItem,
} from './mappers/admin-secondary-market.mapper';

const listingInclude = {
  seller: true,
  release: true,
} satisfies Prisma.MarketListingInclude;

const tradeInclude = {
  buyer: true,
  seller: true,
  release: true,
  buyOrder: { select: { listingId: true } },
} satisfies Prisma.TradeInclude;

@Injectable()
export class AdminSecondaryMarketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async getSummary(roles: string[], query: AdminSecondaryMarketQueryDto) {
    this.assertAccess(roles, 'view');
    const { from, to, previousFrom, previousTo } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );

    const tradeWhere = {
      executedAt: { gte: from, lte: to },
      settlementStatus: TradeSettlementStatus.SETTLED,
    };
    const prevTradeWhere = {
      executedAt: { gte: previousFrom, lte: previousTo },
      settlementStatus: TradeSettlementStatus.SETTLED,
    };

    const [
      activeListingsCount,
      activeListings,
      frozenListingsCount,
      cancelledListingsCount,
      tradesAgg,
      prevTradesAgg,
      suspiciousCount,
      topReleasesRaw,
    ] = await Promise.all([
      this.prisma.marketListing.count({
        where: { deletedAt: null, status: ListingStatus.ACTIVE },
      }),
      this.prisma.marketListing.findMany({
        where: { deletedAt: null, status: ListingStatus.ACTIVE },
        select: { unitsAvailable: true, unitsTotal: true },
      }),
      this.prisma.marketListing.count({
        where: { deletedAt: null, status: ListingStatus.PAUSED },
      }),
      this.prisma.marketListing.count({
        where: {
          deletedAt: null,
          status: ListingStatus.CANCELLED,
          updatedAt: { gte: from, lte: to },
        },
      }),
      this.prisma.trade.aggregate({
        where: tradeWhere,
        _count: true,
        _sum: { grossAmount: true, feeTotal: true, units: true },
        _avg: { price: true, grossAmount: true },
      }),
      this.prisma.trade.aggregate({
        where: prevTradeWhere,
        _sum: { grossAmount: true },
      }),
      this.prisma.auditLog.count({
        where: {
          action: 'trade.mark_suspicious',
          createdAt: { gte: from, lte: to },
        },
      }),
      this.prisma.trade.groupBy({
        by: ['releaseId'],
        where: tradeWhere,
        _count: true,
        _sum: { grossAmount: true },
        orderBy: { _sum: { grossAmount: 'desc' } },
        take: 5,
      }),
    ]);

    let unitsListed = new Prisma.Decimal(0);
    let lockedUnits = new Prisma.Decimal(0);
    for (const row of activeListings) {
      unitsListed = unitsListed.add(row.unitsAvailable);
      lockedUnits = lockedUnits.add(row.unitsTotal.sub(row.unitsAvailable));
    }

    const volume = Number(tradesAgg._sum.grossAmount ?? 0);
    const prevVolume = Number(prevTradesAgg._sum.grossAmount ?? 0);
    const { deltaVolumePct } = buildSummaryMetrics(volume, prevVolume);

    const releaseIds = topReleasesRaw.map((r) => r.releaseId);
    const releases = releaseIds.length
      ? await this.prisma.release.findMany({
          where: { id: { in: releaseIds } },
          select: { id: true, title: true },
        })
      : [];
    const releaseTitleById = new Map(releases.map((r) => [r.id, r.title]));

    return {
      activeListingsCount,
      unitsListed: unitsListed.toString(),
      lockedUnits: lockedUnits.toString(),
      tradeVolumeUsdt: formatMoneyRu(volume),
      completedTradesCount: tradesAgg._count,
      avgPricePerUnitUsdt: tradesAgg._avg.price
        ? formatMoneyRu(tradesAgg._avg.price.toString())
        : null,
      avgTradeSizeUsdt: tradesAgg._avg.grossAmount
        ? formatMoneyRu(tradesAgg._avg.grossAmount.toString())
        : null,
      platformFeesUsdt: formatMoneyRu(Number(tradesAgg._sum.feeTotal ?? 0)),
      suspiciousCount,
      frozenListingsCount,
      cancelledListingsCount,
      deltaVolumePct,
      topReleases: topReleasesRaw.map((r) => ({
        releaseId: r.releaseId,
        releaseTitle: releaseTitleById.get(r.releaseId) ?? r.releaseId,
        tradeCount: r._count,
        volumeUsdt: formatMoneyRu(Number(r._sum.grossAmount ?? 0)),
      })),
    };
  }

  async getLiquidity(roles: string[], query: AdminSecondaryMarketQueryDto) {
    this.assertAccess(roles, 'view');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );

    const trades = await this.prisma.trade.findMany({
      where: {
        executedAt: { gte: from, lte: to },
        settlementStatus: TradeSettlementStatus.SETTLED,
      },
      select: {
        executedAt: true,
        grossAmount: true,
        releaseId: true,
        price: true,
        units: true,
      },
      orderBy: { executedAt: 'asc' },
    });

    const volumeByDay = new Map<string, { volume: number; trades: number }>();
    for (const t of trades) {
      const day = t.executedAt.toISOString().slice(0, 10);
      const cur = volumeByDay.get(day) ?? { volume: 0, trades: 0 };
      cur.volume += Number(t.grossAmount);
      cur.trades += 1;
      volumeByDay.set(day, cur);
    }

    const listingsByRelease = await this.prisma.marketListing.groupBy({
      by: ['releaseId'],
      where: { deletedAt: null, status: ListingStatus.ACTIVE },
      _count: true,
      _sum: { unitsAvailable: true },
      _avg: { pricePerUnit: true },
    });

    const releaseIds = listingsByRelease.map((r) => r.releaseId);
    const releases = releaseIds.length
      ? await this.prisma.release.findMany({
          where: { id: { in: releaseIds } },
          select: { id: true, title: true, totalUnits: true },
        })
      : [];
    const releaseById = new Map(releases.map((r) => [r.id, r]));

    return {
      volumeByDay: [...volumeByDay.entries()].map(([period, v]) => ({
        period,
        volumeUsdt: formatMoneyRu(v.volume),
        tradeCount: v.trades,
      })),
      activeListingsByRelease: listingsByRelease.map((r) => {
        const rel = releaseById.get(r.releaseId);
        const listed = Number(r._sum.unitsAvailable ?? 0);
        const total = Number(rel?.totalUnits ?? 0);
        return {
          releaseId: r.releaseId,
          releaseTitle: rel?.title ?? r.releaseId,
          listingCount: r._count,
          unitsListed: listed.toString(),
          totalUnits: total.toString(),
          listedPct:
            total > 0 ? Math.round((listed / total) * 1000) / 10 : null,
          avgPricePerUnitUsdt: r._avg.pricePerUnit
            ? formatMoneyRu(r._avg.pricePerUnit.toString())
            : null,
        };
      }),
      priceChanges: trades.slice(-20).map((t) => ({
        releaseId: t.releaseId,
        executedAt: t.executedAt.toISOString(),
        pricePerUnitUsdt: formatMoneyRu(t.price.toString()),
        units: t.units.toString(),
      })),
    };
  }

  async getFees(roles: string[], query: AdminSecondaryMarketQueryDto) {
    this.assertAccess(roles, 'view');
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );

    const fees = await this.prisma.fee.findMany({
      where: {
        feeCode: 'secondary_market_fee',
        createdAt: { gte: from, lte: to },
      },
      include: { walletTransaction: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const total = fees.reduce((s, f) => s + Number(f.amountCharged), 0);

    const byRelease = new Map<string, number>();
    for (const f of fees) {
      if (f.subjectId) {
        byRelease.set(
          f.subjectId,
          (byRelease.get(f.subjectId) ?? 0) + Number(f.amountCharged),
        );
      }
    }

    const listingIds = [...byRelease.keys()];
    const listings = listingIds.length
      ? await this.prisma.marketListing.findMany({
          where: { id: { in: listingIds } },
          select: { id: true, release: { select: { id: true, title: true } } },
        })
      : [];
    const releaseByListing = new Map(
      listings.map((l) => [
        l.id,
        { releaseId: l.release.id, title: l.release.title },
      ]),
    );

    const byReleaseRows = [...byRelease.entries()].map(
      ([listingId, amount]) => {
        const rel = releaseByListing.get(listingId);
        return {
          releaseId: rel?.releaseId ?? listingId,
          releaseTitle: rel?.title ?? listingId,
          feeUsdt: formatMoneyRu(amount),
        };
      },
    );

    return {
      totalFeesUsdt: formatMoneyRu(total),
      byRelease: byReleaseRows,
      transactions: fees.map((f) => ({
        id: f.id,
        walletTransactionId: f.walletTransactionId,
        subjectId: f.subjectId,
        amountUsdt: formatMoneyRu(f.amountCharged.toString()),
        createdAt: f.createdAt.toISOString(),
      })),
    };
  }

  async listListings(roles: string[], query: AdminSecondaryMarketQueryDto) {
    this.assertAccess(roles, 'view');
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where = this.buildListingWhere(query);

    const [total, rows] = await Promise.all([
      this.prisma.marketListing.count({ where }),
      this.prisma.marketListing.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: listingInclude,
      }),
    ]);

    return buildPaginated(
      rows.map((r) =>
        mapListingListItem(r, {
          hasRisk: r.status === ListingStatus.PAUSED,
          lockedUnits: r.unitsTotal.sub(r.unitsAvailable).toString(),
        }),
      ),
      total,
      page,
      pageSize,
    );
  }

  async getListingById(roles: string[], id: string, include?: string) {
    this.assertAccess(roles, 'view');
    const row = await this.prisma.marketListing.findFirst({
      where: { id, deletedAt: null },
      include: listingInclude,
    });
    if (!row) {
      throwAdminError(
        'LISTING_NOT_FOUND',
        'Listing not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const parts = new Set(
      (include ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
    const base = mapListingListItem(row, {
      hasRisk: row.status === ListingStatus.PAUSED,
      lockedUnits: row.unitsTotal.sub(row.unitsAvailable).toString(),
    });

    const result: Record<string, unknown> = { ...base };

    if (parts.has('trades') || parts.size === 0) {
      const orders = await this.prisma.order.findMany({
        where: { listingId: id },
        select: { id: true },
      });
      const orderIds = orders.map((o) => o.id);
      const trades = orderIds.length
        ? await this.prisma.trade.findMany({
            where: {
              OR: [
                { buyOrderId: { in: orderIds } },
                { sellOrderId: { in: orderIds } },
              ],
            },
            include: { buyer: true, seller: true },
            orderBy: { executedAt: 'desc' },
          })
        : [];
      result.trades = trades.map((t) => ({
        id: t.id,
        buyerEmail: t.buyer.email,
        sellerEmail: t.seller.email,
        units: t.units.toString(),
        amountUsdt: formatMoneyRu(t.grossAmount.toString()),
        feeUsdt: formatMoneyRu(t.feeTotal.toString()),
        status: t.settlementStatus.toLowerCase(),
        completedAt: t.executedAt.toISOString(),
      }));
    }

    if (parts.has('ledger')) {
      const txs = await this.prisma.walletTransaction.findMany({
        where: { referenceType: 'secondary_trade', referenceId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      result.ledger = txs.map((tx) => ({
        id: tx.id,
        txType: tx.txType,
        direction: tx.direction,
        amountUsdt: formatMoneyRu(tx.amount.toString()),
        status: tx.status,
        createdAt: tx.createdAt.toISOString(),
      }));
    }

    if (parts.has('risk')) {
      const flags = await this.prisma.riskFlag.findMany({
        where: { userId: row.sellerUserId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      result.risk = {
        score: row.status === ListingStatus.PAUSED ? 75 : null,
        frozen: row.status === ListingStatus.PAUSED,
        flags: flags.map((f) => ({
          code: f.flagCode,
          severity: f.severity,
          note: f.note,
          createdAt: f.createdAt.toISOString(),
        })),
      };
    }

    if (parts.has('audit')) {
      result.audit = await this.loadAudit('listing', id);
    }

    result.unitsDetail = {
      unitsTotal: row.unitsTotal.toString(),
      unitsAvailable: row.unitsAvailable.toString(),
      lockedUnits: row.unitsTotal.sub(row.unitsAvailable).toString(),
      lockedReason:
        row.status === ListingStatus.PAUSED
          ? 'frozen_by_operator'
          : 'listed_for_sale',
    };

    return result;
  }

  async freezeListing(
    actorId: string,
    actorRoles: string[],
    id: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertAccess(actorRoles, 'mutate');
    if (!note?.trim()) {
      throwAdminError(
        'NOTE_REQUIRED',
        'Причина обязательна',
        HttpStatus.BAD_REQUEST,
      );
    }
    const existing = await this.prisma.marketListing.findUnique({
      where: { id },
    });
    if (!existing) {
      throwAdminError(
        'LISTING_NOT_FOUND',
        'Listing not found',
        HttpStatus.NOT_FOUND,
      );
    }
    const updated = await this.prisma.marketListing.update({
      where: { id },
      data: { status: ListingStatus.PAUSED },
      include: listingInclude,
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles,
      entityType: 'listing',
      entityId: id,
      action: 'listing.freeze',
      before: { status: existing.status },
      after: { status: 'paused', note },
      ...meta,
    });
    return mapListingListItem(updated);
  }

  async releaseListing(
    actorId: string,
    actorRoles: string[],
    id: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertAccess(actorRoles, 'mutate');
    const existing = await this.prisma.marketListing.findUnique({
      where: { id },
    });
    if (!existing) {
      throwAdminError(
        'LISTING_NOT_FOUND',
        'Listing not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (existing.status !== ListingStatus.PAUSED) {
      throwAdminError(
        'LISTING_NOT_FROZEN',
        'Listing is not frozen',
        HttpStatus.BAD_REQUEST,
      );
    }
    const updated = await this.prisma.marketListing.update({
      where: { id },
      data: { status: ListingStatus.ACTIVE },
      include: listingInclude,
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles,
      entityType: 'listing',
      entityId: id,
      action: 'listing.release',
      before: { status: existing.status },
      after: { status: 'active', note },
      ...meta,
    });
    return mapListingListItem(updated);
  }

  async cancelListing(
    actorId: string,
    actorRoles: string[],
    id: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertAccess(actorRoles, 'mutate');
    if (!note?.trim()) {
      throwAdminError(
        'NOTE_REQUIRED',
        'Причина обязательна',
        HttpStatus.BAD_REQUEST,
      );
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.marketListing.findFirst({
        where: { id, deletedAt: null },
      });
      if (!existing) {
        throwAdminError(
          'LISTING_NOT_FOUND',
          'Listing not found',
          HttpStatus.NOT_FOUND,
        );
      }
      if (existing.status === ListingStatus.CANCELLED) {
        throwAdminError(
          'LISTING_ALREADY_CANCELLED',
          'Listing is already cancelled',
          HttpStatus.CONFLICT,
        );
      }
      if (
        existing.status !== ListingStatus.ACTIVE &&
        existing.status !== ListingStatus.PAUSED
      ) {
        throwAdminError(
          'LISTING_NOT_CANCELLABLE',
          'Listing cannot be cancelled in current status',
          HttpStatus.CONFLICT,
        );
      }

      const unlock = existing.unitsAvailable;
      const position = await tx.userPosition.findUnique({
        where: {
          userId_releaseId: {
            userId: existing.sellerUserId,
            releaseId: existing.releaseId,
          },
        },
      });
      if (position && unlock.greaterThan(0)) {
        await tx.userPosition.update({
          where: { id: position.id },
          data: {
            unitsAvailable: position.unitsAvailable.plus(unlock),
            unitsLocked: position.unitsLocked.minus(unlock),
          },
        });
      }

      const row = await tx.marketListing.update({
        where: { id },
        data: { status: ListingStatus.CANCELLED },
        include: listingInclude,
      });

      if (unlock.greaterThan(0)) {
        await tx.ownershipLedger.create({
          data: {
            userId: existing.sellerUserId,
            releaseId: existing.releaseId,
            eventType: OwnershipEventType.UNLOCK_AFTER_CANCEL,
            unitsDelta: unlock,
            happenedAt: new Date(),
          },
        });
      }

      return { row, beforeStatus: existing.status };
    });

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles,
      entityType: 'listing',
      entityId: id,
      action: 'listing.cancel',
      before: { status: updated.beforeStatus },
      after: { status: 'cancelled', note },
      ...meta,
    });
    return mapListingListItem(updated.row);
  }

  async listTrades(roles: string[], query: AdminSecondaryMarketQueryDto) {
    this.assertAccess(roles, 'view');
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where = await this.buildTradeWhere(query);

    const suspiciousIds = await this.loadSuspiciousTradeIds();

    const [total, rows] = await Promise.all([
      this.prisma.trade.count({ where }),
      this.prisma.trade.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { executedAt: 'desc' },
        include: tradeInclude,
      }),
    ]);

    return buildPaginated(
      rows.map((t) => mapTradeListItem(t, suspiciousIds.has(t.id))),
      total,
      page,
      pageSize,
    );
  }

  async getTradeById(roles: string[], id: string, include?: string) {
    this.assertAccess(roles, 'view');
    const row = await this.prisma.trade.findUnique({
      where: { id },
      include: tradeInclude,
    });
    if (!row) {
      throwAdminError(
        'TRADE_NOT_FOUND',
        'Trade not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const suspiciousIds = await this.loadSuspiciousTradeIds();
    const parts = new Set(
      (include ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
    const listingId = row.buyOrder?.listingId ?? null;
    const base = mapTradeListItem(row, suspiciousIds.has(row.id));

    const result: Record<string, unknown> = { ...base, listingId };

    if (parts.has('settlement') || parts.size === 0) {
      const refId = listingId ?? id;
      const txs = await this.prisma.walletTransaction.findMany({
        where: {
          OR: [
            { referenceType: 'secondary_trade', referenceId: refId },
            { referenceType: 'secondary_fee', referenceId: refId },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });
      result.settlement = {
        buyerDebit: txs.find(
          (t) => t.direction === 'OUT' && t.txType !== 'FEE',
        ),
        sellerCredit: txs.find((t) => t.direction === 'IN'),
        feeTx: txs.find((t) => t.txType === 'FEE'),
        unitTransfer: { units: row.units.toString(), releaseId: row.releaseId },
        settlementStatus: row.settlementStatus.toLowerCase(),
      };
    }

    if (parts.has('ledger')) {
      const refId = listingId ?? id;
      const txs = await this.prisma.walletTransaction.findMany({
        where: {
          OR: [
            { referenceType: 'secondary_trade', referenceId: refId },
            { referenceType: 'secondary_fee', referenceId: refId },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
      result.ledger = txs.map((tx) => ({
        id: tx.id,
        txType: tx.txType,
        direction: tx.direction,
        amountUsdt: formatMoneyRu(tx.amount.toString()),
        status: tx.status,
        createdAt: tx.createdAt.toISOString(),
      }));
    }

    if (parts.has('risk')) {
      const flags = await this.prisma.riskFlag.findMany({
        where: {
          OR: [{ userId: row.buyerUserId }, { userId: row.sellerUserId }],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      result.risk = {
        suspicious: suspiciousIds.has(row.id),
        flags: flags.map((f) => ({
          code: f.flagCode,
          severity: f.severity,
          note: f.note,
          createdAt: f.createdAt.toISOString(),
        })),
        highValue: Number(row.grossAmount) >= 1000,
      };
    }

    if (parts.has('audit')) {
      result.audit = await this.loadAudit('trade', id);
    }

    return result;
  }

  async markTradeSuspicious(
    actorId: string,
    actorRoles: string[],
    id: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertAccess(actorRoles, 'mutate');
    if (!note?.trim()) {
      throwAdminError(
        'NOTE_REQUIRED',
        'Причина обязательна',
        HttpStatus.BAD_REQUEST,
      );
    }
    const trade = await this.prisma.trade.findUnique({ where: { id } });
    if (!trade) {
      throwAdminError(
        'TRADE_NOT_FOUND',
        'Trade not found',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.prisma.riskFlag.create({
      data: {
        userId: trade.buyerUserId,
        flagCode: 'SUSPICIOUS_TRADE',
        severity: 'high',
        note: note ?? `Trade ${id}`,
      },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles,
      entityType: 'trade',
      entityId: id,
      action: 'trade.mark_suspicious',
      after: { note },
      ...meta,
    });
    return { ok: true as const, id };
  }

  private buildListingWhere(
    query: AdminSecondaryMarketQueryDto,
  ): Prisma.MarketListingWhereInput {
    const where: Prisma.MarketListingWhereInput = { deletedAt: null };

    if (query.marketFilter === 'frozen') {
      where.status = ListingStatus.PAUSED;
    } else if (query.marketFilter === 'frozen_cancelled') {
      where.status = {
        in: [
          ListingStatus.PAUSED,
          ListingStatus.CANCELLED,
          ListingStatus.EXPIRED,
        ],
      };
    } else if (query.marketFilter === 'cancelled') {
      where.status = { in: [ListingStatus.CANCELLED, ListingStatus.EXPIRED] };
    } else if (query.marketFilter === 'active') {
      where.status = ListingStatus.ACTIVE;
    } else if (query.status && query.status !== 'all') {
      const db = apiListingStatusToDb(query.status);
      if (db) where.status = db;
    }

    if (query.releaseId) where.releaseId = query.releaseId;
    if (query.sellerId) where.sellerUserId = query.sellerId;

    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { id: q },
        { seller: { email: { contains: q, mode: 'insensitive' } } },
        { release: { title: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (query.minUnits || query.maxUnits) {
      where.unitsAvailable = {};
      if (query.minUnits)
        where.unitsAvailable.gte = new Prisma.Decimal(query.minUnits);
      if (query.maxUnits)
        where.unitsAvailable.lte = new Prisma.Decimal(query.maxUnits);
    }

    return where;
  }

  private async buildTradeWhere(
    query: AdminSecondaryMarketQueryDto,
  ): Promise<Prisma.TradeWhereInput> {
    const where: Prisma.TradeWhereInput = {};

    if (query.period || query.dateFrom) {
      const { from, to } = resolveAnalyticsPeriod(
        query.period,
        query.dateFrom,
        query.dateTo,
      );
      where.executedAt = { gte: from, lte: to };
    }

    if (query.releaseId) where.releaseId = query.releaseId;
    if (query.sellerId) where.sellerUserId = query.sellerId;
    if (query.buyerId) where.buyerUserId = query.buyerId;

    if (query.status && query.status !== 'all') {
      if (query.status === 'suspicious') {
        const ids = [...(await this.loadSuspiciousTradeIds())];
        where.id = {
          in: ids.length ? ids : ['00000000-0000-0000-0000-000000000000'],
        };
      } else if (query.status === 'completed') {
        where.settlementStatus = TradeSettlementStatus.SETTLED;
      } else if (query.status === 'pending') {
        where.settlementStatus = TradeSettlementStatus.PENDING;
      } else if (query.status === 'failed') {
        where.settlementStatus = TradeSettlementStatus.FAILED;
      }
    }

    if (query.marketFilter === 'suspicious') {
      const ids = [...(await this.loadSuspiciousTradeIds())];
      where.id = {
        in: ids.length ? ids : ['00000000-0000-0000-0000-000000000000'],
      };
    }

    if (query.marketFilter === 'high_value') {
      where.grossAmount = { gte: new Prisma.Decimal(500) };
    }

    if (query.minAmount || query.maxAmount) {
      where.grossAmount = where.grossAmount ?? {};
      if (query.minAmount)
        (where.grossAmount as Prisma.DecimalFilter).gte = new Prisma.Decimal(
          query.minAmount,
        );
      if (query.maxAmount)
        (where.grossAmount as Prisma.DecimalFilter).lte = new Prisma.Decimal(
          query.maxAmount,
        );
    }

    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { id: q },
        { buyer: { email: { contains: q, mode: 'insensitive' } } },
        { seller: { email: { contains: q, mode: 'insensitive' } } },
        { release: { title: { contains: q, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  private async loadSuspiciousTradeIds(): Promise<Set<string>> {
    const logs = await this.prisma.auditLog.findMany({
      where: { action: 'trade.mark_suspicious', entityType: 'trade' },
      select: { entityId: true },
    });
    return new Set(
      logs.map((l) => l.entityId).filter((id): id is string => Boolean(id)),
    );
  }

  private async loadAudit(entityType: string, entityId: string) {
    const rows = await this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { actorUser: { select: { email: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      actorEmail: r.actorUser?.email ?? null,
      actorRole: r.actorRole,
      before: r.beforeJsonb,
      after: r.afterJsonb,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  private assertAccess(roles: string[], mode: 'view' | 'mutate') {
    const view = [
      'SUPER_ADMIN',
      'ADMIN',
      'COMPLIANCE',
      'ACCOUNTANT',
      'SUPPORT_MANAGER',
      'BUSINESS_ANALYST',
    ];
    const mutate = ['SUPER_ADMIN', 'ADMIN', 'COMPLIANCE'];
    const set = mode === 'view' ? view : mutate;
    if (!roles.some((r) => set.includes(r))) {
      throwAdminError(
        'ADMIN_FORBIDDEN',
        'Insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
