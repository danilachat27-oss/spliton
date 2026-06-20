import { HttpStatus, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { CACHE_TTL_MS, resolveMarketOverviewCacheTtl } from '../../common/cache/cache-ttl.constants';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';
import { resolvePagination } from '../../common/pagination/pagination.util';
import {
  ListingStatus,
  PriceBucket,
  Prisma,
  ReleaseStatus,
  TradeSettlementStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import type { MarketOverviewQueryDto } from './dto/market-overview-query.dto';
import type {
  MarketOverviewFeedQueryDto,
  MarketOverviewTopReleasesQueryDto,
} from './dto/market-overview-feed-query.dto';
import {
  artistName,
  decToMoney,
  deriveCategories,
  isPublicReleaseStatus,
  liquidityLabel,
  mapPayoutFreq,
  mapStatusRu,
  PUBLIC_RELEASE_STATUSES,
  secondaryLabel,
  segmentSlug,
  trendFromChange,
} from './market-overview.util';
import { SecondaryMarketEnrichmentService } from './secondary-market-enrichment.service';
import type { ReleaseMarketContext } from './secondary-market-rich.types';
import { normalizeGenre } from './secondary-market-rich.mapper';

type ReleaseWithArtists = Prisma.ReleaseGetPayload<{
  include: { releaseArtists: { include: { artist: true } } };
}>;

type MarketOverviewSearchRow = {
  id: string;
  slug: string;
  symbol: string;
  title: string;
  artist: string;
  genre: string;
  segment: string;
  last_price_usdt: Prisma.Decimal;
  volume_24h_usdt: Prisma.Decimal;
  volume_7d_usdt: Prisma.Decimal;
  volume_30d_usdt: Prisma.Decimal;
  change_24h_pct: Prisma.Decimal;
  change_7d_pct: Prisma.Decimal;
  liquidity_tag: string;
  liquidity_label_ru: string;
  spread: Prisma.Decimal;
  active_listings: number;
  yield_pct: Prisma.Decimal;
  payouts_usdt: Prisma.Decimal;
  activity_score: Prisma.Decimal;
  available_units: Prisma.Decimal;
  primary_unit_price_usdt: Prisma.Decimal;
  secondary_label: string;
  trend: string;
  sparkline: number[] | null;
  status_label: string;
  status_key: string;
  payout_freq: string;
  categories: string[];
  risk_status: string;
  total_count: bigint;
};

@Injectable()
export class MarketOverviewService {
  private readonly logger = new Logger(MarketOverviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly enrichment: SecondaryMarketEnrichmentService,
    private readonly cache: TtlCacheService,
  ) {}

  async getOverview(query: MarketOverviewQueryDto) {
    const cacheKey = `market:overview:${createHash('sha256')
      .update(JSON.stringify(query))
      .digest('hex')
      .slice(0, 16)}`;
    const { ttlMs, staleTtlMs } = resolveMarketOverviewCacheTtl(
      CACHE_TTL_MS.marketOverview,
    );
    return this.cache.getOrSet(
      cacheKey,
      ttlMs,
      () => this.buildOverview(query),
      { staleTtlMs },
    );
  }

  async getStats(period = '7d') {
    const cacheKey = `market:overview:stats:${period}`;
    const { ttlMs, staleTtlMs } = resolveMarketOverviewCacheTtl(
      CACHE_TTL_MS.marketOverviewStats,
    );
    return this.cache.getOrSet(
      cacheKey,
      ttlMs,
      async () => {
      try {
        const rows = await this.prisma.$queryRawUnsafe<{ stats: unknown }[]>(
          `SELECT market_overview_stats($1::text) AS stats`,
          period,
        );
        const stats = rows[0]?.stats;
        if (!stats || typeof stats !== 'object') {
          throw new ServiceUnavailableException(
            'Market overview stats temporarily unavailable',
          );
        }
        return stats;
      } catch (e) {
        if (e instanceof ServiceUnavailableException) throw e;
        this.logger.error(
          `Market overview SQL failed: market_overview_stats — ${e instanceof Error ? e.message : e}`,
        );
        throw new ServiceUnavailableException(
          'Market overview stats temporarily unavailable',
        );
      }
    },
      { staleTtlMs },
    );
  }

  async getCharts(period = '30d') {
    const cacheKey = `market:overview:charts:${period}`;
    const { ttlMs, staleTtlMs } = resolveMarketOverviewCacheTtl(
      CACHE_TTL_MS.marketOverviewCharts,
    );
    return this.cache.getOrSet(
      cacheKey,
      ttlMs,
      async () => {
      try {
        const rows = await this.prisma.$queryRawUnsafe<{ charts: unknown }[]>(
          `SELECT market_overview_charts($1::text) AS charts`,
          period,
        );
        const charts = rows[0]?.charts;
        if (!charts || typeof charts !== 'object') {
          throw new ServiceUnavailableException(
            'Market overview charts temporarily unavailable',
          );
        }
        return charts;
      } catch (e) {
        if (e instanceof ServiceUnavailableException) throw e;
        this.logger.error(
          `Market overview SQL failed: market_overview_charts — ${e instanceof Error ? e.message : e}`,
        );
        throw new ServiceUnavailableException(
          'Market overview charts temporarily unavailable',
        );
      }
    },
      { staleTtlMs },
    );
  }

  /** Alias for stats — stable summary DTO for market overview page. */
  getSummary(period = '7d') {
    return this.getStats(period);
  }

  /** Alias for charts — timeseries DTO. */
  getTimeseries(period = '30d') {
    return this.getCharts(period);
  }

  async getTopReleases(query: MarketOverviewTopReleasesQueryDto) {
    const stats = (await this.getStats(query.period ?? '7d')) as {
      topReleases?: {
        byVolume?: { id: string; symbol: string; title: string; artist: string; value: string }[];
        byYield?: { id: string; symbol: string; title: string; artist: string; value: string }[];
        byLiquidity?: { id: string; symbol: string; title: string; artist: string; value: string }[];
        byProgress?: { id: string; symbol: string; title: string; artist: string; value: string }[];
      };
    };

    const sort = query.sort ?? 'volume';
    const limit = query.limit ?? 8;
    const key =
      sort === 'liquidity'
        ? 'byLiquidity'
        : sort === 'listings'
          ? 'byVolume'
          : sort === 'trades'
            ? 'byVolume'
            : 'byVolume';

    const items = (stats.topReleases?.[key] ?? []).slice(0, limit).map((row) => ({
      id: row.id,
      symbol: row.symbol,
      title: row.title,
      artist: row.artist,
      value: row.value,
      metric: sort,
    }));

    return {
      period: query.period ?? '7d',
      sort,
      items,
      updatedAt: new Date().toISOString(),
    };
  }

  async getListings(query: MarketOverviewFeedQueryDto) {
    const pageSize = Math.min(100, query.pageSize ?? query.limit ?? 20);
    const { page, pageSize: size, skip } = resolvePagination(query.page, pageSize);

    const search = query.search?.trim();
    const where: Prisma.MarketListingWhereInput = {
      deletedAt: null,
      status: ListingStatus.ACTIVE,
      unitsAvailable: { gt: 0 },
      release: {
        deletedAt: null,
        secondaryEnabled: true,
        status: { in: PUBLIC_RELEASE_STATUSES },
        ...(query.releaseId ? { id: query.releaseId } : {}),
        ...(query.genre && query.genre !== 'all'
          ? {
              OR: [
                { genre: { contains: query.genre, mode: 'insensitive' } },
                { segment: { contains: query.genre, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { symbol: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
    };

    const [total, rows] = await Promise.all([
      this.prisma.marketListing.count({ where }),
      this.prisma.marketListing.findMany({
        where,
        include: {
          release: {
            include: { releaseArtists: { include: { artist: true } } },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: size,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / size));

    return {
      items: rows.map((l) => {
        const totalUsdt = l.pricePerUnit.mul(l.unitsAvailable);
        return {
          id: l.id,
          releaseId: l.releaseId,
          releaseSlug: l.release.slug,
          releaseTitle: l.release.title,
          releaseSymbol: l.release.symbol,
          artist: artistName(l.release),
          genre: normalizeGenre(l.release.genre),
          units: l.unitsAvailable.toString(),
          pricePerUnitUsdt: l.pricePerUnit.toString(),
          totalUsdt: totalUsdt.toString(),
          status: l.status,
          availableUnits: l.unitsAvailable.toString(),
          buyable: l.status === ListingStatus.ACTIVE && l.unitsAvailable.gt(0),
          createdAt: l.createdAt.toISOString(),
          updatedAt: l.updatedAt.toISOString(),
        };
      }),
      pagination: {
        page,
        pageSize: size,
        total,
        totalPages,
        hasNextPage: page < totalPages,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  async getTrades(query: MarketOverviewFeedQueryDto) {
    const pageSize = Math.min(100, query.pageSize ?? query.limit ?? 20);
    const { page, pageSize: size, skip } = resolvePagination(query.page, pageSize);
    const since = this.periodSince(query.period ?? '7d');

    const search = query.search?.trim();
    const where: Prisma.TradeWhereInput = {
      settlementStatus: TradeSettlementStatus.SETTLED,
      ...(query.releaseId ? { releaseId: query.releaseId } : {}),
      ...(since ? { executedAt: { gte: since } } : {}),
      release: {
        deletedAt: null,
        status: { in: PUBLIC_RELEASE_STATUSES },
        ...(query.genre && query.genre !== 'all'
          ? {
              OR: [
                { genre: { contains: query.genre, mode: 'insensitive' } },
                { segment: { contains: query.genre, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { symbol: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
    };

    const [total, rows] = await Promise.all([
      this.prisma.trade.count({ where }),
      this.prisma.trade.findMany({
        where,
        include: {
          release: {
            include: { releaseArtists: { include: { artist: true } } },
          },
        },
        orderBy: { executedAt: 'desc' },
        skip,
        take: size,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / size));

    return {
      items: rows.map((t) => ({
        id: t.id,
        releaseId: t.releaseId,
        releaseSlug: t.release.slug,
        releaseTitle: t.release.title,
        releaseSymbol: t.release.symbol,
        artist: artistName(t.release),
        units: t.units.toString(),
        pricePerUnitUsdt: t.price.toString(),
        totalUsdt: t.grossAmount.toString(),
        settlementStatus: t.settlementStatus,
        executedAt: t.executedAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize: size,
        total,
        totalPages,
        hasNextPage: page < totalPages,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  async getDepth(period = '7d') {
    const stats = (await this.getStats(period)) as {
      secondaryMarket?: {
        activeListings?: number;
        averageSpreadPct?: string | null;
        bestAskMin?: string | null;
      };
      totals?: {
        totalVolume24hUsdt?: string;
        tradesCount?: number;
      };
    };

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [listingAgg, trades24h, trades7d, releasesWithMarket] =
      await Promise.all([
        this.prisma.marketListing.aggregate({
          where: {
            deletedAt: null,
            status: ListingStatus.ACTIVE,
            unitsAvailable: { gt: 0 },
            release: {
              deletedAt: null,
              secondaryEnabled: true,
              status: { in: PUBLIC_RELEASE_STATUSES },
            },
          },
          _sum: { unitsAvailable: true },
          _count: { _all: true },
          _min: { pricePerUnit: true },
        }),
        this.prisma.trade.count({
          where: {
            settlementStatus: TradeSettlementStatus.SETTLED,
            executedAt: { gte: since24h },
          },
        }),
        this.prisma.trade.count({
          where: {
            settlementStatus: TradeSettlementStatus.SETTLED,
            executedAt: { gte: since7d },
          },
        }),
        this.prisma.release.count({
          where: {
            deletedAt: null,
            secondaryEnabled: true,
            status: { in: PUBLIC_RELEASE_STATUSES },
            marketListings: {
              some: {
                deletedAt: null,
                status: ListingStatus.ACTIVE,
                unitsAvailable: { gt: 0 },
              },
            },
          },
        }),
      ]);

    const snapshot = await this.prisma.orderBookSnapshot.findFirst({
      orderBy: { capturedAt: 'desc' },
    });

    return {
      period,
      updatedAt: new Date().toISOString(),
      activeListings: listingAgg._count._all,
      askDepthUnits: listingAgg._sum.unitsAvailable?.toString() ?? '0',
      bidDepthUnits: snapshot?.bidDepthUnits?.toString() ?? '0',
      bestAskTotal: listingAgg._min.pricePerUnit?.toString() ?? stats.secondaryMarket?.bestAskMin ?? null,
      bestBidTotal: snapshot?.topBidPrice?.toString() ?? null,
      averageSpreadPct: stats.secondaryMarket?.averageSpreadPct ?? null,
      tradesCount24h: trades24h,
      tradesCount7d: trades7d,
      volume24hUsdt: stats.totals?.totalVolume24hUsdt ?? null,
      releasesWithActiveMarket: releasesWithMarket,
    };
  }

  async getPriceHistory(period = '30d') {
    const charts = (await this.getCharts(period)) as {
      period?: string;
      series?: {
        volume?: { ts: string; value: string | number }[];
        secondaryVolume?: { ts: string; value: string | number }[];
      };
    };

    return {
      period: charts.period ?? period,
      updatedAt: new Date().toISOString(),
      secondaryVolume: charts.series?.secondaryVolume ?? charts.series?.volume ?? [],
    };
  }

  private async buildOverview(query: MarketOverviewQueryDto) {
    const { page, pageSize, skip: _skip } = resolvePagination(
      query.page,
      query.pageSize ?? 24,
    );

    const rows = await this.prisma.$queryRawUnsafe<MarketOverviewSearchRow[]>(
      `SELECT * FROM market_overview_search(
        $1::text, $2::text, $3::text, $4::text, $5::text, $6::text,
        $7::text, $8::text, $9::text, $10::text, $11::text, $12::integer, $13::integer
      )`,
      query.period ?? '7d',
      query.search?.trim() ?? null,
      query.category ?? 'all',
      query.genre && query.genre !== 'all' ? query.genre : null,
      query.status && query.status !== 'all' ? query.status : null,
      query.payoutFreq && query.payoutFreq !== 'all' ? query.payoutFreq : null,
      query.liquidity && query.liquidity !== 'all' ? query.liquidity : null,
      query.yield && query.yield !== 'all' ? query.yield : null,
      query.availability && query.availability !== 'all'
        ? query.availability
        : null,
      query.sort ?? 'activity',
      query.sortDir ?? 'desc',
      page,
      pageSize,
    );

    const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const items = rows.map((row) => this.mapSearchRow(row));
    const stats = await this.getStats(query.period ?? '7d');

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
      },
      stats,
      updatedAt: new Date().toISOString(),
      aggregate: {
        activeReleases: items.filter((i) => i.statusKey === 'active').length,
        avgYieldPct:
          items.length > 0
            ? (
                items.reduce((a, i) => a + i.yieldPct, 0) / items.length
              ).toFixed(1)
            : '0',
        totalVolume24hUsdt: decToMoney(
          items.reduce(
            (acc, i) => acc.plus(i.volume24hUsdt),
            new Prisma.Decimal(0),
          ),
        ),
      },
    };
  }

  private mapSearchRow(row: MarketOverviewSearchRow) {
    const volume24h = new Prisma.Decimal(row.volume_24h_usdt);
    const yieldPct = Number(row.yield_pct);
    const activityScore = Number(row.activity_score);
    const change7d = Number(row.change_7d_pct);
    const liquidityTag = row.liquidity_tag as 'high' | 'med' | 'low';
    const sparkline = Array.isArray(row.sparkline)
      ? row.sparkline.map((v) => Number(v))
      : [];

    return {
      id: row.id,
      slug: row.slug,
      symbol: row.symbol,
      title: row.title,
      artist: row.artist,
      genre: normalizeGenre(row.genre),
      segment: segmentSlug(row.segment, row.genre),
      lastPriceUsdt: row.last_price_usdt.toString(),
      volume24hUsdt: volume24h,
      volume7dUsdt: row.volume_7d_usdt.toString(),
      change24hPct: Number(row.change_24h_pct).toFixed(2),
      change7dPct: change7d.toFixed(2),
      liquidity: liquidityTag === 'high' ? 'high' : liquidityTag === 'med' ? 'med' : 'low',
      liquidityLabel: row.liquidity_label_ru,
      spread: row.spread.toString(),
      activeListings: row.active_listings,
      yieldPct,
      payoutsUsdt: Number(row.payouts_usdt),
      activityScore,
      availableUnits: row.available_units.toString(),
      primaryUnitPriceUsdt: row.primary_unit_price_usdt.toString(),
      secondaryLabel: row.secondary_label,
      trend: (row.trend as 'up' | 'down' | 'flat') ?? trendFromChange(change7d),
      sparkline,
      status: row.status_label,
      statusKey: row.status_key,
      payoutFreq: row.payout_freq as 'monthly' | 'biweekly',
      categories: row.categories ?? [],
      riskStatus: row.risk_status,
    };
  }

  /** @deprecated legacy in-memory path — kept for reference; use buildOverview */
  private async buildOverviewLegacy(query: MarketOverviewQueryDto) {
    const releases = await this.prisma.release.findMany({
      where: {
        deletedAt: null,
        status: { in: PUBLIC_RELEASE_STATUSES },
      },
      include: { releaseArtists: { include: { artist: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const releaseIds = releases.map((r) => r.id);
    const [
      ctxMap,
      metricsMap,
      volume7dMap,
      change24hMap,
      listingCounts,
      lastPrices,
    ] = await Promise.all([
      this.enrichment.loadByReleaseIds(releaseIds),
      this.loadLatestMetrics(releaseIds),
      this.loadVolume7d(releaseIds),
      this.loadChange24h(releaseIds),
      this.loadActiveListingCounts(releaseIds),
      this.loadLastPrices(releaseIds, releases),
    ]);

    let items = releases.map((release) =>
      this.mapOverviewRow(
        release,
        ctxMap.get(release.id)!,
        metricsMap.get(release.id),
        volume7dMap.get(release.id) ?? new Prisma.Decimal(0),
        change24hMap.get(release.id) ?? 0,
        listingCounts.get(release.id) ?? 0,
        lastPrices.get(release.id) ?? release.primaryUnitPrice,
      ),
    );

    items = this.applyFilters(items, query);
    items = this.applySort(items, query);

    const totalVolume24h = items.reduce(
      (acc, i) => acc.plus(i.volume24hUsdt),
      new Prisma.Decimal(0),
    );
    const yieldValues = items.map((i) => i.yieldPct).filter((y) => y > 0);
    const avgYield =
      yieldValues.length > 0
        ? yieldValues.reduce((a, b) => a + b, 0) / yieldValues.length
        : 0;

    return {
      items,
      updatedAt: new Date().toISOString(),
      aggregate: {
        activeReleases: items.filter((i) => i.statusKey === 'active').length,
        avgYieldPct: avgYield.toFixed(1),
        totalVolume24hUsdt: decToMoney(totalVolume24h),
      },
    };
  }

  async getDetail(releaseKey: string, query: MarketOverviewQueryDto) {
    const releaseId = await this.resolvePublicReleaseKey(releaseKey);

    const release = await this.prisma.release.findFirst({
      where: { id: releaseId, deletedAt: null },
      include: { releaseArtists: { include: { artist: true } } },
    });

    if (!release || !isPublicReleaseStatus(release.status)) {
      throwAdminError(
        'RELEASE_NOT_FOUND',
        'Release not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const period = query.period ?? '30d';
    const bucket = period === '24h' ? PriceBucket.H1 : PriceBucket.D1;

    const [
      ctxMap,
      metrics,
      volume7d,
      change24h,
      listingCount,
      priceHistory,
      recentTrades,
      snapshot,
      activeListings,
    ] = await Promise.all([
      this.enrichment.loadByReleaseIds([releaseId]),
      this.loadLatestMetrics([releaseId]).then((m) => m.get(releaseId)),
      this.loadVolume7d([releaseId]).then(
        (m) => m.get(releaseId) ?? new Prisma.Decimal(0),
      ),
      this.loadChange24h([releaseId]).then((m) => m.get(releaseId) ?? 0),
      this.loadActiveListingCounts([releaseId]).then(
        (m) => m.get(releaseId) ?? 0,
      ),
      this.loadPriceHistory(releaseId, bucket, period),
      this.loadRecentTrades(releaseId),
      this.prisma.orderBookSnapshot.findFirst({
        where: { releaseId },
        orderBy: { capturedAt: 'desc' },
      }),
      this.prisma.marketListing.findMany({
        where: {
          releaseId,
          deletedAt: null,
          status: ListingStatus.ACTIVE,
          unitsAvailable: { gt: 0 },
        },
        orderBy: { pricePerUnit: 'asc' },
        take: 12,
      }),
    ]);

    const ctx = ctxMap.get(releaseId)!;
    const lastPrice =
      (await this.loadLastPrices([releaseId], [release])).get(releaseId) ??
      release.primaryUnitPrice;

    const bestAsk =
      activeListings[0]?.pricePerUnit.toString() ??
      snapshot?.topAskPrice?.toString() ??
      ctx.bestAsk;
    const bestBid = snapshot?.topBidPrice?.toString() ?? ctx.bestBid;

    let spread = '0';
    if (bestAsk && bestBid) {
      spread = new Prisma.Decimal(bestAsk).minus(bestBid).toString();
    }

    const askDepth = activeListings.reduce(
      (sum, l) => sum.plus(l.unitsAvailable),
      new Prisma.Decimal(0),
    );

    const overviewRow = this.mapOverviewRow(
      release,
      ctx,
      metrics,
      volume7d,
      change24h,
      listingCount,
      lastPrice,
    );

    const volumeHistory = await this.loadVolumeHistory(releaseId, period);

    return {
      release: {
        id: release.id,
        slug: release.slug,
        symbol: release.symbol,
        title: release.title,
        artist: artistName(release),
        genre: normalizeGenre(release.genre),
        segment: release.segment,
        status: release.status,
        statusLabel: mapStatusRu(release.status),
        payoutFrequency: mapPayoutFreq(release.payoutFrequency),
        primaryUnitPrice: release.primaryUnitPrice.toString(),
        totalUnits: release.totalUnits.toString(),
        unitsAvailablePrimary: release.unitsAvailablePrimary.toString(),
        coverUrl: release.coverUrl,
        description: release.description,
        raiseTargetUsdt: release.raiseTargetUsdt?.toString() ?? null,
        hardCapUsdt: release.hardCapUsdt?.toString() ?? null,
        holderSharePct: release.holderSharePct?.toString() ?? null,
        artistSharePct: release.artistSharePct?.toString() ?? null,
        platformSharePct: release.platformSharePct?.toString() ?? null,
      },
      overview: overviewRow,
      market: {
        lastPrice: lastPrice.toString(),
        volume24hUsdt: ctx.volume24hUsdt,
        volume7dUsdt: volume7d.toString(),
        change24hPct: change24h.toFixed(2),
        change7dPct: ctx.change7dPct,
        liquidity: ctx.liquidity,
        liquidityLabel: liquidityLabel(ctx.liquidity),
        spread,
        bestBid,
        bestAsk,
        activeListings: listingCount,
        deals7d: ctx.deals7d,
      },
      priceHistory,
      volumeHistory,
      recentTrades,
      depthSummary: {
        bestBid,
        bestAsk,
        spread,
        bidDepthUnits: snapshot?.bidDepthUnits?.toString() ?? '0',
        askDepthUnits: askDepth.toString(),
        topAsks: activeListings.slice(0, 5).map((l) => ({
          price: l.pricePerUnit.toString(),
          units: l.unitsAvailable.toString(),
        })),
      },
      riskNotes: this.buildRiskNotes(release, ctx, listingCount),
    };
  }

  private async resolvePublicReleaseKey(key: string): Promise<string> {
    const byId = await this.prisma.release.findFirst({
      where: {
        id: key,
        deletedAt: null,
        status: { in: PUBLIC_RELEASE_STATUSES },
      },
      select: { id: true },
    });
    if (byId) return byId.id;

    const bySlug = await this.prisma.release.findFirst({
      where: {
        slug: key,
        deletedAt: null,
        status: { in: PUBLIC_RELEASE_STATUSES },
      },
      select: { id: true },
    });
    if (bySlug) return bySlug.id;

    const bySymbol = await this.prisma.release.findFirst({
      where: {
        symbol: key.toUpperCase(),
        deletedAt: null,
        status: { in: PUBLIC_RELEASE_STATUSES },
      },
      select: { id: true },
    });
    if (bySymbol) return bySymbol.id;

    throwAdminError(
      'RELEASE_NOT_FOUND',
      'Release not found',
      HttpStatus.NOT_FOUND,
    );
  }

  private mapOverviewRow(
    release: ReleaseWithArtists,
    ctx: ReleaseMarketContext,
    metrics:
      | {
          yieldPct: Prisma.Decimal | null;
          payoutsTotal: Prisma.Decimal | null;
          activityScore: Prisma.Decimal | null;
        }
      | undefined,
    volume7d: Prisma.Decimal,
    change24h: number,
    activeListings: number,
    lastPrice: Prisma.Decimal,
  ) {
    const yieldPct = Number(metrics?.yieldPct ?? 0);
    const payoutsUsdt = Number(metrics?.payoutsTotal ?? 0);
    const activityScore = Number(metrics?.activityScore ?? ctx.deals7d * 10);
    const volume24h = new Prisma.Decimal(ctx.volume24hUsdt);
    const change7d = Number(ctx.change7dPct);
    const segment = segmentSlug(release.segment, release.genre);
    const statusRu = mapStatusRu(release.status);
    const categories = deriveCategories({
      status: release.status,
      yieldPct,
      activityScore,
      deals7d: ctx.deals7d,
      volume24h: Number(volume24h),
      createdAt: release.createdAt,
    });

    let spread = '0';
    if (ctx.bestAsk && ctx.bestBid) {
      spread = new Prisma.Decimal(ctx.bestAsk).minus(ctx.bestBid).toString();
    }

    return {
      id: release.id,
      slug: release.slug,
      symbol: release.symbol,
      title: release.title,
      artist: artistName(release),
      genre: normalizeGenre(release.genre),
      segment,
      lastPriceUsdt: lastPrice.toString(),
      volume24hUsdt: volume24h,
      volume7dUsdt: volume7d.toString(),
      change24hPct: change24h.toFixed(2),
      change7dPct: ctx.change7dPct,
      liquidity: ctx.liquidity,
      liquidityLabel: liquidityLabel(ctx.liquidity),
      spread,
      activeListings,
      yieldPct,
      payoutsUsdt,
      activityScore,
      availableUnits: release.unitsAvailablePrimary.toString(),
      primaryUnitPriceUsdt: release.primaryUnitPrice.toString(),
      secondaryLabel: secondaryLabel(ctx.deals7d, volume24h),
      trend: trendFromChange(change7d),
      sparkline: ctx.payoutSparkline.map((p) => Number(p)),
      status: statusRu,
      statusKey: this.statusKey(release.status),
      payoutFreq: mapPayoutFreq(release.payoutFrequency),
      categories,
      riskStatus: this.riskStatus(
        release.status,
        ctx.liquidity,
        activeListings,
      ),
    };
  }

  private statusKey(status: ReleaseStatus): string {
    if (status === ReleaseStatus.ACTIVE) return 'active';
    if (status === ReleaseStatus.PAUSED) return 'paused';
    if (status === ReleaseStatus.SOLD_OUT) return 'closed';
    return 'new';
  }

  private riskStatus(
    status: ReleaseStatus,
    liquidity: string,
    activeListings: number,
  ): string {
    if (status === ReleaseStatus.PAUSED) return 'paused';
    if (status === ReleaseStatus.SOLD_OUT) return 'closed';
    if (liquidity === 'low' && activeListings === 0) return 'thin';
    return 'active';
  }

  private buildRiskNotes(
    release: ReleaseWithArtists,
    ctx: { liquidity: string; deals7d: number },
    activeListings: number,
  ): string[] {
    const notes: string[] = [];
    if (release.status === ReleaseStatus.PAUSED) {
      notes.push('Выплаты или торги по релизу приостановлены.');
    }
    if (ctx.liquidity === 'low' && activeListings === 0) {
      notes.push('Низкая ликвидность: нет активных лотов на secondary.');
    }
    if (ctx.deals7d === 0) {
      notes.push('За 7 дней не зафиксировано исполненных сделок.');
    }
    if (notes.length === 0) {
      notes.push('Рынок активен; данные обновляются из стакана и сделок.');
    }
    return notes;
  }

  private async loadLatestMetrics(releaseIds: string[]) {
    const map = new Map<
      string,
      {
        yieldPct: Prisma.Decimal | null;
        payoutsTotal: Prisma.Decimal | null;
        activityScore: Prisma.Decimal | null;
      }
    >();
    if (releaseIds.length === 0) return map;

    const rows = await this.prisma.releaseMetricsDaily.findMany({
      where: { releaseId: { in: releaseIds } },
      orderBy: { asOfDate: 'desc' },
      distinct: ['releaseId'],
    });
    for (const row of rows) {
      map.set(row.releaseId, {
        yieldPct: row.yieldPct,
        payoutsTotal: row.payoutsTotal,
        activityScore: row.activityScore,
      });
    }
    return map;
  }

  private async loadVolume7d(releaseIds: string[]) {
    const map = new Map<string, Prisma.Decimal>();
    if (releaseIds.length === 0) return map;

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.trade.groupBy({
      by: ['releaseId'],
      where: {
        releaseId: { in: releaseIds },
        executedAt: { gte: since },
        settlementStatus: TradeSettlementStatus.SETTLED,
      },
      _sum: { grossAmount: true },
    });
    for (const row of rows) {
      map.set(row.releaseId, row._sum.grossAmount ?? new Prisma.Decimal(0));
    }
    return map;
  }

  private async loadChange24h(releaseIds: string[]) {
    const map = new Map<string, number>();
    if (releaseIds.length === 0) return map;

    const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.priceHistory.findMany({
      where: {
        releaseId: { in: releaseIds },
        bucket: PriceBucket.D1,
        ts: { gte: since },
      },
      orderBy: { ts: 'asc' },
    });

    const byRelease = new Map<string, Prisma.Decimal[]>();
    for (const row of rows) {
      const list = byRelease.get(row.releaseId) ?? [];
      list.push(row.closePrice);
      byRelease.set(row.releaseId, list);
    }

    for (const [releaseId, closes] of byRelease) {
      if (closes.length < 2) {
        map.set(releaseId, 0);
        continue;
      }
      const prev = closes[closes.length - 2];
      const last = closes[closes.length - 1];
      if (prev.greaterThan(0)) {
        map.set(
          releaseId,
          Number(last.minus(prev).div(prev).mul(100).toFixed(2)),
        );
      } else {
        map.set(releaseId, 0);
      }
    }
    return map;
  }

  private async loadActiveListingCounts(releaseIds: string[]) {
    const map = new Map<string, number>();
    if (releaseIds.length === 0) return map;

    const rows = await this.prisma.marketListing.groupBy({
      by: ['releaseId'],
      where: {
        releaseId: { in: releaseIds },
        deletedAt: null,
        status: ListingStatus.ACTIVE,
        unitsAvailable: { gt: 0 },
      },
      _count: { _all: true },
    });
    for (const row of rows) {
      map.set(row.releaseId, row._count._all);
    }
    return map;
  }

  private async loadLastPrices(
    releaseIds: string[],
    releases: { id: string; primaryUnitPrice: Prisma.Decimal }[],
  ) {
    const map = new Map<string, Prisma.Decimal>();
    if (releaseIds.length === 0) return map;

    const rows = await this.prisma.priceHistory.findMany({
      where: { releaseId: { in: releaseIds }, bucket: PriceBucket.D1 },
      orderBy: { ts: 'desc' },
      distinct: ['releaseId'],
    });
    for (const row of rows) {
      map.set(row.releaseId, row.closePrice);
    }
    for (const release of releases) {
      if (!map.has(release.id)) {
        map.set(release.id, release.primaryUnitPrice);
      }
    }
    return map;
  }

  private async loadPriceHistory(
    releaseId: string,
    bucket: PriceBucket,
    period: string,
  ) {
    const since = this.periodSince(period);
    const rows = await this.prisma.priceHistory.findMany({
      where: {
        releaseId,
        bucket,
        ...(since ? { ts: { gte: since } } : {}),
      },
      orderBy: { ts: 'asc' },
      take: 500,
    });
    return {
      bucket,
      period,
      points: rows.map((r) => ({
        ts: r.ts.toISOString(),
        open: r.openPrice.toString(),
        high: r.highPrice.toString(),
        low: r.lowPrice.toString(),
        close: r.closePrice.toString(),
        volumeUnits: r.volumeUnits.toString(),
        volumeNotional: r.volumeNotional.toString(),
      })),
    };
  }

  private async loadVolumeHistory(releaseId: string, period: string) {
    const since = this.periodSince(period);
    const rows = await this.prisma.trade.findMany({
      where: {
        releaseId,
        settlementStatus: TradeSettlementStatus.SETTLED,
        ...(since ? { executedAt: { gte: since } } : {}),
      },
      orderBy: { executedAt: 'asc' },
      take: 500,
    });

    const buckets = new Map<string, Prisma.Decimal>();
    for (const trade of rows) {
      const day = trade.executedAt.toISOString().slice(0, 10);
      const current = buckets.get(day) ?? new Prisma.Decimal(0);
      buckets.set(day, current.plus(trade.grossAmount));
    }

    return {
      period,
      points: [...buckets.entries()].map(([day, notional]) => ({
        ts: `${day}T00:00:00.000Z`,
        volumeUsdt: notional.toString(),
      })),
    };
  }

  private async loadRecentTrades(releaseId: string) {
    const rows = await this.prisma.trade.findMany({
      where: {
        releaseId,
        settlementStatus: TradeSettlementStatus.SETTLED,
      },
      orderBy: { executedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        price: true,
        units: true,
        grossAmount: true,
        executedAt: true,
      },
    });
    return rows.map((t) => ({
      id: t.id,
      price: t.price.toString(),
      units: t.units.toString(),
      grossAmount: t.grossAmount.toString(),
      executedAt: t.executedAt.toISOString(),
    }));
  }

  private periodSince(period: string): Date | null {
    const days: Record<string, number> = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
    };
    const d = days[period];
    if (!d) return null;
    return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
  }

  private applyFilters(
    items: ReturnType<MarketOverviewService['mapOverviewRow']>[],
    query: MarketOverviewQueryDto,
  ) {
    let out = items;

    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      out = out.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.artist.toLowerCase().includes(q) ||
          r.symbol.toLowerCase().includes(q),
      );
    }

    if (query.genre && query.genre !== 'all') {
      out = out.filter((r) => {
        const slug = segmentSlug(r.segment, r.genre).toLowerCase();
        return (
          slug === query.genre || r.genre.toLowerCase().includes(query.genre!)
        );
      });
    }

    if (query.status && query.status !== 'all') {
      out = out.filter((r) => r.statusKey === query.status);
    }

    if (query.liquidity) {
      const label =
        query.liquidity === 'deep'
          ? 'Deep'
          : query.liquidity === 'mid'
            ? 'Mid'
            : 'Thin';
      out = out.filter((r) => r.liquidityLabel === label);
    }

    if (query.payoutFreq && query.payoutFreq !== 'all') {
      out = out.filter((r) => r.payoutFreq === query.payoutFreq);
    }

    if (query.yield === 'high') {
      out = out.filter((r) => r.yieldPct >= 12);
    } else if (query.yield === 'mid') {
      out = out.filter((r) => r.yieldPct >= 8 && r.yieldPct < 12);
    } else if (query.yield === 'low') {
      out = out.filter((r) => r.yieldPct < 8);
    }

    if (query.availability === 'tight') {
      out = out.filter((r) => {
        const u = Number(r.availableUnits);
        return u > 0 && u < 100_000;
      });
    } else if (query.availability === 'wide') {
      out = out.filter((r) => Number(r.availableUnits) > 200_000);
    }

    if (query.category && query.category !== 'all') {
      out = out.filter((r) => r.categories.includes(query.category!));
    }

    return out;
  }

  private applySort(
    items: ReturnType<MarketOverviewService['mapOverviewRow']>[],
    query: MarketOverviewQueryDto,
  ) {
    const key = query.sort ?? 'activity';
    const dir = query.sortDir === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
      if (key === 'yield') return (a.yieldPct - b.yieldPct) * dir;
      if (key === 'payouts') return (a.payoutsUsdt - b.payoutsUsdt) * dir;
      if (key === 'units') {
        return (Number(a.availableUnits) - Number(b.availableUnits)) * dir;
      }
      return (a.activityScore - b.activityScore) * dir;
    });
  }
}
