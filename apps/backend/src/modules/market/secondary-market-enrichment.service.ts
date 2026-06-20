import { Injectable } from '@nestjs/common';
import { ListingStatus, PriceBucket, Prisma, TradeSettlementStatus } from '@prisma/client';
import { CACHE_TTL_MS } from '../../common/cache/cache-ttl.constants';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ReleaseMarketContext,
  SecondaryMarketLiquidityTag,
} from './secondary-market-rich.types';

const EMPTY_CONTEXT: ReleaseMarketContext = {
  volume24hUsdt: '0',
  volume24hUnits: '0',
  change7dPct: '0',
  change24hPct: '0',
  payoutSparkline: [],
  range7dLow: '0',
  range7dHigh: '0',
  range24hLow: '0',
  range24hHigh: '0',
  bestBid: null,
  bestAsk: null,
  deals7d: 0,
  liquidity: 'low',
};

/** Max daily price points per release in enrichment batch. */
const MAX_D1_HISTORY_POINTS = 35;
/** Max hourly price points per release in enrichment batch. */
const MAX_H1_HISTORY_POINTS = 24;

@Injectable()
export class SecondaryMarketEnrichmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

  async loadByReleaseIds(
    releaseIds: string[],
  ): Promise<Map<string, ReleaseMarketContext>> {
    const map = new Map<string, ReleaseMarketContext>();
    if (releaseIds.length === 0) return map;

    const unique = [...new Set(releaseIds)].sort();
    const cacheKey = `secondary-market-ctx:${unique.join(',')}`;
    return this.cache.getOrSet(
      cacheKey,
      CACHE_TTL_MS.secondaryMarketContext,
      () => this.loadByReleaseIdsUncached(unique),
    );
  }

  private async loadByReleaseIdsUncached(
    unique: string[],
  ): Promise<Map<string, ReleaseMarketContext>> {
    const map = new Map<string, ReleaseMarketContext>();
    const now = new Date();
    const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      metricsRows,
      historyRows,
      historyH1Rows,
      tradeCounts7d,
      volume24hRows,
      volume24hUnitsRows,
      bestAskListings,
      bookSnapshots,
    ] = await Promise.all([
      this.prisma.releaseMetricsDaily.findMany({
        where: { releaseId: { in: unique } },
        orderBy: { asOfDate: 'desc' },
        distinct: ['releaseId'],
      }),
      this.prisma.priceHistory.findMany({
        where: {
          releaseId: { in: unique },
          bucket: PriceBucket.D1,
          ts: { gte: since30d },
        },
        orderBy: { ts: 'desc' },
        take: unique.length * MAX_D1_HISTORY_POINTS,
        select: {
          releaseId: true,
          closePrice: true,
          ts: true,
        },
      }),
      this.prisma.priceHistory.findMany({
        where: {
          releaseId: { in: unique },
          bucket: PriceBucket.H1,
          ts: { gte: since24h },
        },
        orderBy: { ts: 'desc' },
        take: unique.length * MAX_H1_HISTORY_POINTS,
        select: {
          releaseId: true,
          closePrice: true,
          ts: true,
        },
      }),
      this.prisma.trade.groupBy({
        by: ['releaseId'],
        where: {
          releaseId: { in: unique },
          executedAt: { gte: since7d },
          settlementStatus: 'SETTLED',
        },
        _count: { _all: true },
      }),
      this.prisma.trade.groupBy({
        by: ['releaseId'],
        where: {
          releaseId: { in: unique },
          executedAt: { gte: since24h },
          settlementStatus: TradeSettlementStatus.SETTLED,
        },
        _sum: { grossAmount: true },
      }),
      this.prisma.trade.groupBy({
        by: ['releaseId'],
        where: {
          releaseId: { in: unique },
          executedAt: { gte: since24h },
          settlementStatus: TradeSettlementStatus.SETTLED,
        },
        _sum: { units: true },
      }),
      this.prisma.marketListing.findMany({
        where: {
          releaseId: { in: unique },
          deletedAt: null,
          status: ListingStatus.ACTIVE,
          unitsAvailable: { gt: 0 },
        },
        distinct: ['releaseId'],
        orderBy: { pricePerUnit: 'asc' },
        select: { releaseId: true, pricePerUnit: true },
      }),
      this.prisma.orderBookSnapshot.findMany({
        where: { releaseId: { in: unique } },
        orderBy: { capturedAt: 'desc' },
        distinct: ['releaseId'],
      }),
    ]);

    const metricsByRelease = new Map(metricsRows.map((m) => [m.releaseId, m]));
    const historyByRelease = this.groupHistoryPoints(
      historyRows,
      MAX_D1_HISTORY_POINTS,
    );
    const historyH1ByRelease = this.groupHistoryPoints(
      historyH1Rows,
      MAX_H1_HISTORY_POINTS,
    );
    const deals7dByRelease = new Map(
      tradeCounts7d.map((r) => [r.releaseId, r._count._all]),
    );
    const volume24hByRelease = new Map(
      volume24hRows.map((r) => [
        r.releaseId,
        r._sum.grossAmount ?? new Prisma.Decimal(0),
      ]),
    );
    const volume24hUnitsByRelease = new Map(
      volume24hUnitsRows.map((r) => [
        r.releaseId,
        r._sum.units ?? new Prisma.Decimal(0),
      ]),
    );

    const askByRelease = new Map(
      bestAskListings.map((l) => [l.releaseId, l.pricePerUnit]),
    );

    const bookByRelease = new Map(bookSnapshots.map((b) => [b.releaseId, b]));

    for (const releaseId of unique) {
      const metrics = metricsByRelease.get(releaseId);
      const history = historyByRelease.get(releaseId) ?? [];
      const historyH1 = historyH1ByRelease.get(releaseId) ?? [];
      const closes = history.map((h) => h.closePrice);
      const closesH1 = historyH1.map((h) => h.closePrice);
      const sparklineH1 = closesH1.slice(-24).map((c) => c.toString());
      const sparkline =
        sparklineH1.length >= 2
          ? sparklineH1
          : closes.slice(-10).map((c) => c.toString());

      let change7dPct = new Prisma.Decimal(0);
      let range7dLow = new Prisma.Decimal(0);
      let range7dHigh = new Prisma.Decimal(0);
      if (closes.length >= 2) {
        const first = closes[0];
        const last = closes[closes.length - 1];
        if (first.greaterThan(0)) {
          change7dPct = last.minus(first).div(first).mul(100);
        }
        const window = closes.slice(-7);
        range7dLow = window.reduce(
          (min, p) => (p.lessThan(min) ? p : min),
          window[0],
        );
        range7dHigh = window.reduce(
          (max, p) => (p.greaterThan(max) ? p : max),
          window[0],
        );
      }

      let change24hPct = new Prisma.Decimal(0);
      let range24hLow = new Prisma.Decimal(0);
      let range24hHigh = new Prisma.Decimal(0);
      if (closesH1.length >= 2) {
        const first24 = closesH1[0];
        const last24 = closesH1[closesH1.length - 1];
        if (first24.greaterThan(0)) {
          change24hPct = last24.minus(first24).div(first24).mul(100);
        }
        range24hLow = closesH1.reduce(
          (min, p) => (p.lessThan(min) ? p : min),
          closesH1[0],
        );
        range24hHigh = closesH1.reduce(
          (max, p) => (p.greaterThan(max) ? p : max),
          closesH1[0],
        );
      } else if (closes.length >= 2) {
        const lastTwo = closes.slice(-2);
        const first = lastTwo[0];
        const last = lastTwo[1];
        if (first.greaterThan(0)) {
          change24hPct = last.minus(first).div(first).mul(100);
        }
        range24hLow = lastTwo[0];
        range24hHigh = lastTwo[1];
      }

      const volumeFromMetrics = metrics?.volume24hNotional;
      const volumeFromTrades = volume24hByRelease.get(releaseId);
      const volume24h =
        volumeFromMetrics && volumeFromMetrics.greaterThan(0)
          ? volumeFromMetrics
          : (volumeFromTrades ?? new Prisma.Decimal(0));

      const book = bookByRelease.get(releaseId);
      const bestAsk =
        askByRelease.get(releaseId)?.toString() ??
        book?.topAskPrice?.toString() ??
        null;
      const bestBid = book?.topBidPrice?.toString() ?? null;

      const volume24hUnits =
        volume24hUnitsByRelease.get(releaseId) ?? new Prisma.Decimal(0);

      map.set(releaseId, {
        volume24hUsdt: volume24h.toString(),
        volume24hUnits: volume24hUnits.toString(),
        change7dPct: change7dPct.toFixed(2),
        change24hPct: change24hPct.toFixed(2),
        payoutSparkline: sparkline,
        range7dLow: range7dLow.toString(),
        range7dHigh: range7dHigh.toString(),
        range24hLow: range24hLow.toString(),
        range24hHigh: range24hHigh.toString(),
        bestBid,
        bestAsk,
        deals7d: deals7dByRelease.get(releaseId) ?? 0,
        liquidity: this.liquidityTag(
          metrics?.liquidityScore,
          volume24h,
          deals7dByRelease.get(releaseId) ?? 0,
        ),
      });
    }

    for (const id of unique) {
      if (!map.has(id)) map.set(id, { ...EMPTY_CONTEXT });
    }

    return map;
  }

  private groupHistoryPoints<
    T extends { releaseId: string; closePrice: Prisma.Decimal; ts: Date },
  >(rows: T[], maxPerRelease: number): Map<string, T[]> {
    const grouped = new Map<string, T[]>();
    for (const row of rows) {
      const list = grouped.get(row.releaseId) ?? [];
      if (list.length < maxPerRelease) {
        list.push(row);
      }
      grouped.set(row.releaseId, list);
    }
    for (const [releaseId, list] of grouped) {
      grouped.set(
        releaseId,
        [...list].sort((a, b) => a.ts.getTime() - b.ts.getTime()),
      );
    }
    return grouped;
  }

  private liquidityTag(
    score: Prisma.Decimal | null | undefined,
    volume24h: Prisma.Decimal,
    deals7d: number,
  ): SecondaryMarketLiquidityTag {
    if (score) {
      const n = Number(score);
      if (n >= 0.65) return 'high';
      if (n >= 0.35) return 'med';
      return 'low';
    }
    if (Number(volume24h) >= 5000 || deals7d >= 8) return 'high';
    if (Number(volume24h) >= 500 || deals7d >= 2) return 'med';
    return 'low';
  }
}
