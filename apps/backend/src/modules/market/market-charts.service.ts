import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ListingStatus,
  PriceBucket,
  Prisma,
  TradeSettlementStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildChartResponse,
  isChartPeriod,
  maxChartPoints,
  periodSince,
  priceBucketForChart,
  resolveChartBucket,
  type ChartPeriod,
  type ChartSeriesPoint,
} from '../../common/charts/chart-period.util';
import { ChartReleaseQueryDto } from '../../common/charts/chart-release-query.dto';
import { throwAdminError } from '../admin/common/admin-http.util';
import { PUBLIC_RELEASE_STATUSES } from './market-overview.util';
import { SecondaryMarketResolveService } from './secondary-market-resolve.service';

@Injectable()
export class MarketChartsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resolve: SecondaryMarketResolveService,
  ) {}

  private normalizePeriod(period?: string): ChartPeriod {
    const p = period ?? '30d';
    if (!isChartPeriod(p)) {
      throwAdminError(
        'INVALID_CHART_PERIOD',
        'Invalid chart period',
        HttpStatus.BAD_REQUEST,
      );
    }
    return p;
  }

  async getPriceChart(query: ChartReleaseQueryDto) {
    const period = this.normalizePeriod(query.period);
    const bucket = resolveChartBucket(period, query.bucket);
    const releaseId = await this.resolve.resolveReleaseId(query);
    const priceBucket = priceBucketForChart(bucket);
    const since = periodSince(period);
    const rows = await this.prisma.priceHistory.findMany({
      where: {
        releaseId,
        bucket: priceBucket,
        ...(since ? { ts: { gte: since } } : {}),
      },
      orderBy: { ts: 'asc' },
      take: maxChartPoints(period),
    });

    const points: ChartSeriesPoint[] = rows.map((r) => ({
      timestamp: r.ts.toISOString(),
      value: Number(r.closePrice),
      values: {
        open: Number(r.openPrice),
        high: Number(r.highPrice),
        low: Number(r.lowPrice),
        close: Number(r.closePrice),
      },
      metadata: {
        volumeUnits: Number(r.volumeUnits),
        volumeNotional: Number(r.volumeNotional),
      },
    }));

    const closes = points.map((p) => p.value);
    const summary: Record<string, string | number | null> = {
      releaseId,
      minPrice: closes.length ? Math.min(...closes) : null,
      maxPrice: closes.length ? Math.max(...closes) : null,
      lastPrice: closes.length ? closes[closes.length - 1]! : null,
      pointCount: points.length,
    };

    return buildChartResponse({
      period,
      bucket,
      points,
      summary,
      source: 'price_history',
      emptyReason: points.length ? undefined : 'NO_PRICE_HISTORY',
    });
  }

  async getOhlcChart(query: ChartReleaseQueryDto) {
    return this.getPriceChart(query);
  }

  async getVolumeChart(query: ChartReleaseQueryDto) {
    const period = this.normalizePeriod(query.period);
    const bucket = resolveChartBucket(period, query.bucket);
    const releaseId = await this.resolve.resolveReleaseId(query);
    const since = periodSince(period);

    const trades = await this.prisma.trade.findMany({
      where: {
        releaseId,
        settlementStatus: TradeSettlementStatus.SETTLED,
        ...(since ? { executedAt: { gte: since } } : {}),
      },
      orderBy: { executedAt: 'asc' },
      take: 2000,
    });

    const buckets = new Map<
      string,
      { volumeUsdt: Prisma.Decimal; volumeUnits: Prisma.Decimal; count: number }
    >();

    for (const t of trades) {
      const key =
        bucket === 'hour'
          ? t.executedAt.toISOString().slice(0, 13) + ':00:00.000Z'
          : t.executedAt.toISOString().slice(0, 10) + 'T00:00:00.000Z';
      const cur = buckets.get(key) ?? {
        volumeUsdt: new Prisma.Decimal(0),
        volumeUnits: new Prisma.Decimal(0),
        count: 0,
      };
      cur.volumeUsdt = cur.volumeUsdt.plus(t.grossAmount);
      cur.volumeUnits = cur.volumeUnits.plus(t.units);
      cur.count += 1;
      buckets.set(key, cur);
    }

    const points: ChartSeriesPoint[] = [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-maxChartPoints(period))
      .map(([timestamp, v]) => ({
        timestamp,
        value: Number(v.volumeUsdt),
        values: {
          volumeUnits: Number(v.volumeUnits),
          tradeCount: v.count,
        },
      }));

    return buildChartResponse({
      period,
      bucket,
      points,
      summary: {
        releaseId,
        totalVolumeUsdt: points.reduce((s, p) => s + p.value, 0),
        tradeCount: trades.length,
      },
      source: 'trades',
      emptyReason: points.length ? undefined : 'NO_SETTLED_TRADES',
    });
  }

  async getSpreadChart(query: ChartReleaseQueryDto) {
    const period = this.normalizePeriod(query.period);
    const bucket = resolveChartBucket(period, query.bucket);
    const releaseId = await this.resolve.resolveReleaseId(query);
    const since = periodSince(period);

    const snapshots = await this.prisma.orderBookSnapshot.findMany({
      where: {
        releaseId,
        ...(since ? { capturedAt: { gte: since } } : {}),
        topBidPrice: { not: null },
        topAskPrice: { not: null },
      },
      orderBy: { capturedAt: 'asc' },
      take: maxChartPoints(period),
    });

    const points: ChartSeriesPoint[] = snapshots.map((s) => {
      const bid = Number(s.topBidPrice!);
      const ask = Number(s.topAskPrice!);
      const spread = ask - bid;
      const spreadPct = ask > 0 ? (spread / ask) * 100 : 0;
      return {
        timestamp: s.capturedAt.toISOString(),
        value: spread,
        values: { bestBid: bid, bestAsk: ask, spreadPct },
      };
    });

    if (points.length === 0) {
      const listing = await this.prisma.marketListing.findFirst({
        where: {
          releaseId,
          deletedAt: null,
          status: ListingStatus.ACTIVE,
        },
        orderBy: { pricePerUnit: 'asc' },
      });
      if (listing) {
        points.push({
          timestamp: new Date().toISOString(),
          value: 0,
          values: { bestAsk: Number(listing.pricePerUnit) },
        });
      }
    }

    return buildChartResponse({
      period,
      bucket,
      points,
      summary: { releaseId, snapshotCount: snapshots.length },
      source: 'aggregated',
      emptyReason: points.length ? undefined : 'NO_SPREAD_DATA',
    });
  }

  async getLiquidityChart(query: ChartReleaseQueryDto) {
    const period = this.normalizePeriod(query.period);
    const bucket = resolveChartBucket(period, query.bucket);
    const releaseId = await this.resolve.resolveReleaseId(query);
    const since = periodSince(period);

    const metrics = await this.prisma.releaseMetricsDaily.findMany({
      where: {
        releaseId,
        ...(since ? { asOfDate: { gte: since } } : {}),
      },
      orderBy: { asOfDate: 'asc' },
      take: maxChartPoints(period),
    });

    const points: ChartSeriesPoint[] = metrics.map((m) => ({
      timestamp: m.asOfDate.toISOString(),
      value: Number(m.liquidityScore ?? 0),
      values: {
        volume24h: Number(m.volume24hNotional ?? 0),
        yieldPct: Number(m.yieldPct ?? 0),
      },
    }));

    const activeListings = await this.prisma.marketListing.count({
      where: {
        releaseId,
        deletedAt: null,
        status: ListingStatus.ACTIVE,
        unitsAvailable: { gt: 0 },
      },
    });

    return buildChartResponse({
      period,
      bucket,
      points,
      summary: {
        releaseId,
        activeListings,
        latestLiquidityScore: points.length
          ? points[points.length - 1]!.value
          : null,
      },
      source: 'aggregated',
      emptyReason: points.length ? undefined : 'NO_LIQUIDITY_METRICS',
    });
  }

  async getOverviewCharts(periodRaw?: string) {
    const period = this.normalizePeriod(periodRaw);
    const since = periodSince(period);

    const trades = await this.prisma.trade.findMany({
      where: {
        settlementStatus: TradeSettlementStatus.SETTLED,
        ...(since ? { executedAt: { gte: since } } : {}),
        release: {
          deletedAt: null,
          status: { in: PUBLIC_RELEASE_STATUSES },
        },
      },
      select: {
        executedAt: true,
        grossAmount: true,
        releaseId: true,
      },
      orderBy: { executedAt: 'asc' },
      take: 5000,
    });

    const volumeByDay = new Map<string, Prisma.Decimal>();
    const tradesByDay = new Map<string, number>();
    for (const t of trades) {
      const day = t.executedAt.toISOString().slice(0, 10);
      volumeByDay.set(
        day,
        (volumeByDay.get(day) ?? new Prisma.Decimal(0)).plus(t.grossAmount),
      );
      tradesByDay.set(day, (tradesByDay.get(day) ?? 0) + 1);
    }

    const volumePoints: ChartSeriesPoint[] = [...volumeByDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, vol]) => ({
        timestamp: `${day}T00:00:00.000Z`,
        value: Number(vol),
        values: { tradeCount: tradesByDay.get(day) ?? 0 },
      }));

    const activeListings = await this.prisma.marketListing.count({
      where: {
        deletedAt: null,
        status: ListingStatus.ACTIVE,
        unitsAvailable: { gt: 0 },
        release: { deletedAt: null },
      },
    });

    return {
      period,
      lastUpdatedAt: new Date().toISOString(),
      volume: buildChartResponse({
        period,
        bucket: 'day',
        points: volumePoints,
        summary: {
          totalVolumeUsdt: volumePoints.reduce((s, p) => s + p.value, 0),
          tradeCount: trades.length,
        },
        source: 'trades',
      }),
      activeListings,
    };
  }
}
