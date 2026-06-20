import { HttpStatus, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { CACHE_TTL_MS } from '../../common/cache/cache-ttl.constants';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';
import {
  CATALOG_CACHE_KEYS,
  catalogFiltersCacheKey,
} from './catalog-cache.constants';
import {
  ListingStatus,
  PrimaryRaiseRoundStatus,
  Prisma,
  ReleaseStatus,
  TradeSettlementStatus,
} from '@prisma/client';
import { MAX_PAGE_SIZE } from '../../common/pagination/pagination.constants';
import { resolvePagination } from '../../common/pagination/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { normalizeGenre } from '../market/secondary-market-rich.mapper';
import type { CatalogFiltersQueryDto, CatalogListQueryDto } from './dto/catalog-list-query.dto';
import {
  artistDisplayName,
  CATALOG_PUBLIC_STATUSES,
  isCatalogPublicStatus,
  mapPayoutFreq,
  mapRiskLabel,
  resolvePurchaseState,
  roundStatusToApi,
  shortDescription,
} from './public-catalog.util';

const releaseInclude = {
  releaseArtists: {
    include: { artist: true },
    orderBy: { createdAt: 'asc' as const },
    take: 3,
  },
  primaryRaiseRounds: {
    orderBy: { createdAt: 'desc' as const },
    take: 3,
  },
} satisfies Prisma.ReleaseInclude;

type CatalogSearchRow = {
  id: string;
  slug: string;
  symbol: string;
  title: string;
  artist: string;
  artists: string;
  genre: string;
  segment: string;
  tags: string[] | null;
  cover_url: string | null;
  short_description: string | null;
  release_date: Date | null;
  release_status: string;
  catalog_status: string;
  status_label: string;
  risk_label: string;
  round_status: string;
  purchase_state: string;
  payout_freq: string;
  total_units: Prisma.Decimal;
  units_sold: Prisma.Decimal;
  available_units: Prisma.Decimal;
  primary_unit_price_usdt: Prisma.Decimal;
  raise_target_usdt: Prisma.Decimal | null;
  hard_cap_usdt: Prisma.Decimal | null;
  raised_usdt: Prisma.Decimal;
  goal_usdt: Prisma.Decimal | null;
  progress_pct: Prisma.Decimal;
  expected_yield_pct: Prisma.Decimal | null;
  secondary_market_enabled: boolean;
  active_secondary_listings_count: number;
  best_secondary_ask_price: Prisma.Decimal | null;
  last_trade_price: Prisma.Decimal | null;
  volume_24h_usdt: Prisma.Decimal;
  volume_7d_usdt: Prisma.Decimal;
  liquidity_score: Prisma.Decimal | null;
  next_payout_date: Date | null;
  card_kind: string;
  relevance_score: Prisma.Decimal;
  total_count: bigint;
};

type CatalogSuggestionRow = {
  type: string;
  label: string;
  value: string;
  subtitle: string | null;
  release_id: string | null;
  slug: string | null;
  score: Prisma.Decimal;
};

@Injectable()
export class PublicCatalogService {
  private readonly logger = new Logger(PublicCatalogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

  private logSqlFunctionError(functionName: string, err: unknown): void {
    const detail = err instanceof Error ? err.message : String(err);
    this.logger.error(`Catalog SQL function failed: ${functionName} — ${detail}`);
  }

  private throwCatalogUnavailable(functionName: string, err: unknown): never {
    this.logSqlFunctionError(functionName, err);
    throw new ServiceUnavailableException({
      code: 'CATALOG_UNAVAILABLE',
      message: `Catalog data temporarily unavailable (${functionName})`,
      degraded: true,
    });
  }

  async listReleases(query?: CatalogListQueryDto) {
    const normalized = this.normalizeListQuery(query);
    if (this.isDefaultListQuery(normalized)) {
      return this.cache.getOrSet(
        CATALOG_CACHE_KEYS.releasesDefault,
        CACHE_TTL_MS.publicCatalog,
        () => this.searchReleases(normalized),
      );
    }
    return this.searchReleases(normalized);
  }

  private normalizeListQuery(query?: CatalogListQueryDto): CatalogListQueryDto {
    const q = { ...(query ?? {}) };
    if (q.search) q.search = q.search.trim().slice(0, 120);
    if (q.secondaryEnabled && !q.kind) q.kind = 'secondary';
    if (q.availableOnly && !q.status) q.status = 'open';
    // Resolve contradictory kind/status pairs from legacy clients.
    if (q.kind === 'primary' && q.status === 'payouts') {
      q.kind = 'payouts';
      q.status = undefined;
    }
    if (q.kind === 'funding' && q.status === 'payouts') {
      q.kind = 'payouts';
      q.status = undefined;
    }
    return q;
  }

  private isDefaultListQuery(query: CatalogListQueryDto): boolean {
    return (
      !query.search?.trim() &&
      !query.genre?.trim() &&
      !query.artistId?.trim() &&
      !query.roundStatus?.trim() &&
      !query.status?.trim() &&
      !query.kind &&
      query.availableOnly !== true &&
      query.secondaryEnabled !== true &&
      query.priceMin == null &&
      query.priceMax == null &&
      query.minYield == null &&
      query.minProgress == null &&
      query.minLiquidity == null &&
      (!query.sort || query.sort === 'catalog_order' || query.sort === 'newest') &&
      (query.page ?? 1) === 1 &&
      (query.pageSize ?? 24) <= 24
    );
  }

  private resolveKind(query: CatalogListQueryDto): string {
    if (query.kind && query.kind !== 'all') return query.kind;
    if (query.secondaryEnabled) return 'secondary';
    return 'all';
  }

  private resolveCatalogStatuses(query: CatalogListQueryDto): string[] | null {
    if (query.status && query.status !== 'all') {
      return query.status === 'payouts' ? ['payouts', 'sold_out'] : [query.status];
    }
    if (query.roundStatus === 'live') return ['open'];
    if (query.roundStatus === 'paused') return ['coming_soon'];
    if (query.roundStatus === 'completed') return ['sold_out', 'payouts'];
    return null;
  }

  private resolveRoundStatuses(query: CatalogListQueryDto): string[] | null {
    if (!query.roundStatus || query.roundStatus === 'all') return null;
    if (['open', 'coming_soon', 'sold_out', 'payouts'].includes(query.roundStatus)) {
      return null;
    }
    if (query.roundStatus === 'none') return ['none'];
    return [query.roundStatus];
  }

  private async searchReleases(query: CatalogListQueryDto) {
    const { page, pageSize: ps, skip } = resolvePagination(
      query.page,
      query.pageSize ?? 24,
    );

    const genres = query.genre?.trim() ? [query.genre.trim()] : null;
    const kind = this.resolveKind(query);
    const catalogStatuses = this.resolveCatalogStatuses(query);
    const roundStatuses = this.resolveRoundStatuses(query);
    const sort =
      query.search?.trim() && (!query.sort || query.sort === 'catalog_order')
        ? 'relevance'
        : (query.sort ?? 'newest');

    const rows = await this.prisma.$queryRawUnsafe<CatalogSearchRow[]>(
      `SELECT * FROM catalog_search_releases(
        $1::text,
        $2::text,
        $3::text[],
        $4::text[],
        $5::text[],
        $6::numeric,
        $7::numeric,
        $8::numeric,
        $9::numeric,
        $10::numeric,
        $11::boolean,
        $12::boolean,
        $13::uuid,
        $14::text,
        $15::integer,
        $16::integer
      )`,
      query.search?.trim() ?? null,
      kind,
      genres,
      roundStatuses,
      catalogStatuses,
      query.priceMin ?? null,
      query.priceMax ?? null,
      query.minYield ?? null,
      query.minProgress ?? null,
      query.minLiquidity ?? null,
      query.secondaryEnabled === true || kind === 'secondary',
      query.availableOnly === true,
      query.artistId ?? null,
      sort,
      page,
      ps,
    ).catch((err) => this.throwCatalogUnavailable('catalog_search_releases', err));

    const feePct = await this.defaultPrimaryFeePct();
    const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
    const totalPages = total > 0 ? Math.ceil(total / ps) : 0;

    const items = rows.map((row) => this.mapSearchRow(row, feePct));

    return {
      items,
      pagination: {
        page,
        pageSize: ps,
        total,
        totalPages,
        hasNextPage: skip + items.length < total,
      },
      appliedFilters: {
        search: query.search?.trim() || null,
        kind,
        genre: query.genre?.trim() || null,
        status: query.status || null,
        sort,
        priceMin: query.priceMin ?? null,
        priceMax: query.priceMax ?? null,
        minYield: query.minYield ?? null,
        minProgress: query.minProgress ?? null,
        minLiquidity: query.minLiquidity ?? null,
      },
      updatedAt: new Date().toISOString(),
      total,
      page,
      pageSize: ps,
      hasMore: skip + items.length < total,
    };
  }

  private mapSearchRow(row: CatalogSearchRow, feePct: Prisma.Decimal) {
    const yieldPct = row.expected_yield_pct
      ? Number(row.expected_yield_pct)
      : null;
    const progressPct = Number(row.progress_pct);

    return {
      id: row.id,
      slug: row.slug,
      symbol: row.symbol,
      title: row.title,
      artist: row.artist,
      artistId: null,
      artists: row.artists
        ? row.artists.split(', ').map((name) => ({ id: '', name, role: 'MAIN' }))
        : [],
      genre: normalizeGenre(row.genre),
      segment: row.segment ?? normalizeGenre(row.genre),
      tags: row.tags ?? [normalizeGenre(row.genre), row.segment].filter(Boolean),
      coverUrl: row.cover_url,
      shortDescription: row.short_description,
      releaseDate: row.release_date?.toISOString().slice(0, 10) ?? null,
      releaseStatus: row.release_status,
      catalogStatus: row.catalog_status,
      statusLabel: row.status_label,
      riskLabel: row.risk_label,
      roundStatus: row.round_status,
      purchaseState: row.purchase_state,
      payoutFreq: row.payout_freq as 'monthly' | 'biweekly',
      totalUnits: row.total_units.toString(),
      unitsSold: row.units_sold.toString(),
      availableUnits: row.available_units.toString(),
      primaryUnitPriceUsdt: row.primary_unit_price_usdt.toString(),
      unitPriceUsdt: row.primary_unit_price_usdt.toString(),
      raiseTargetUsdt: row.raise_target_usdt?.toString() ?? null,
      hardCapUsdt: row.hard_cap_usdt?.toString() ?? null,
      raisedUsdt: row.raised_usdt.toString(),
      goalUsdt: row.goal_usdt?.toString() ?? null,
      progressPct,
      soldPercent: progressPct,
      expectedYieldPct:
        yieldPct !== null ? `${yieldPct.toFixed(1).replace('.', ',')}%` : null,
      primaryPurchaseFeePct: feePct.toString(),
      secondaryMarketEnabled:
        row.secondary_market_enabled || row.active_secondary_listings_count > 0,
      activeSecondaryListingsCount: row.active_secondary_listings_count,
      bestSecondaryAskPrice: row.best_secondary_ask_price?.toString() ?? null,
      lastTradePrice: row.last_trade_price?.toString() ?? null,
      volume24hUsdt: row.volume_24h_usdt.toString(),
      volume7dUsdt: row.volume_7d_usdt.toString(),
      liquidityScore: row.liquidity_score ? Number(row.liquidity_score) : null,
      nextPayoutDate: row.next_payout_date?.toISOString().slice(0, 10) ?? null,
      cardKind: row.card_kind,
      relevanceScore: Number(row.relevance_score),
    };
  }

  async searchSuggestions(q: string, limit = 8) {
    const term = q.trim().slice(0, 120);
    if (term.length < 2) return { items: [] as const };

    try {
      const rows = await this.prisma.$queryRaw<CatalogSuggestionRow[]>`
        SELECT * FROM catalog_search_suggestions(${term}, ${Number(limit)}::int)
      `;
      const items = rows.map((row) => ({
        type: row.type,
        label: row.label,
        value: row.value,
        subtitle: row.subtitle,
        releaseId: row.release_id,
        slug: row.slug,
        score: Number(row.score),
      }));
      return { items: await this.enrichSearchSuggestionPurchaseState(items) };
    } catch (err) {
      this.logSqlFunctionError('catalog_search_suggestions', err);
      return { items: [] as const, degraded: true as const };
    }
  }

  private async enrichSearchSuggestionPurchaseState<
    T extends {
      type: string;
      releaseId: string | null;
    },
  >(items: T[]): Promise<
    Array<
      T & {
        purchaseState?: 'available' | 'sold_out' | 'paused' | 'unavailable';
        canPurchase?: boolean;
      }
    >
  > {
    const releaseIds = [
      ...new Set(
        items
          .filter(
            (item) =>
              item.releaseId &&
              (item.type === 'release' || item.type === 'symbol'),
          )
          .map((item) => item.releaseId as string),
      ),
    ];
    if (releaseIds.length === 0) return items;

    const releases = await this.prisma.release.findMany({
      where: { id: { in: releaseIds } },
      include: {
        primaryRaiseRounds: releaseInclude.primaryRaiseRounds,
      },
    });
    const byId = new Map(releases.map((release) => [release.id, release]));

    return items.map((item) => {
      if (
        !item.releaseId ||
        (item.type !== 'release' && item.type !== 'symbol')
      ) {
        return item;
      }
      const release = byId.get(item.releaseId);
      if (!release) return item;
      const round = this.pickPrimaryRound(release.primaryRaiseRounds);
      const available = round
        ? round.totalUnits.minus(round.soldUnits)
        : release.unitsAvailablePrimary;
      const purchaseState = resolvePurchaseState({
        releaseStatus: release.status,
        roundStatus: round?.status ?? null,
        availableUnits: available,
      });
      return {
        ...item,
        purchaseState,
        canPurchase: purchaseState === 'available',
      };
    });
  }

  async getFilters(query?: CatalogFiltersQueryDto) {
    const kind = query?.kind ?? 'all';
    return this.cache.getOrSet(
      catalogFiltersCacheKey(kind),
      CACHE_TTL_MS.publicCatalog,
      () => this.loadFilters(kind),
    );
  }

  private async loadFilters(kind: string) {
    try {
      const rows = await this.prisma.$queryRaw<Array<{ catalog_get_filters: Prisma.JsonValue }>>`
        SELECT catalog_get_filters(${kind}) AS catalog_get_filters
      `;
      const payload = rows[0]?.catalog_get_filters as Record<string, unknown> | undefined;
      if (payload) {
        return {
          ...payload,
          roundStatus: payload.roundStatuses,
        };
      }
      this.logger.error('Catalog SQL function catalog_get_filters returned empty payload');
    } catch (err) {
      this.throwCatalogUnavailable('catalog_get_filters', err);
    }

    throw new ServiceUnavailableException({
      code: 'CATALOG_FILTERS_UNAVAILABLE',
      message: 'Catalog filters temporarily unavailable',
      degraded: true,
    });
  }

  async getGenres() {
    const filters = await this.getFilters();
    const genres =
      'genres' in filters
        ? ((filters.genres as { name: string; count: number }[] | undefined) ?? [])
        : [];
    return {
      items: genres.map((g) => g.name),
    };
  }

  async getStats() {
    return this.cache.getOrSet(
      CATALOG_CACHE_KEYS.stats,
      CACHE_TTL_MS.publicCatalog,
      () => this.loadStats(),
    );
  }

  private async loadStats() {
    try {
      const rows = await this.prisma.$queryRaw<Array<{ catalog_get_stats: Prisma.JsonValue }>>`
        SELECT catalog_get_stats() AS catalog_get_stats
      `;
      const payload = rows[0]?.catalog_get_stats;
      if (payload && typeof payload === 'object') {
        return payload;
      }
      this.logger.error('Catalog SQL function catalog_get_stats returned empty payload');
    } catch (err) {
      this.throwCatalogUnavailable('catalog_get_stats', err);
    }

    throw new ServiceUnavailableException({
      code: 'CATALOG_STATS_UNAVAILABLE',
      message: 'Catalog stats temporarily unavailable',
      degraded: true,
    });
  }

  async getRelease(releaseKey: string) {
    const release = await this.findPublicRelease(releaseKey);
    const metrics = (await this.loadLatestMetrics([release.id])).get(release.id);
    const marketCtx = (await this.loadMarketContext([release.id])).get(release.id);
    const feePct = await this.defaultPrimaryFeePct();
    const card = this.mapCatalogCard(release, metrics, feePct, marketCtx);
    const primaryRound = this.mapPrimaryRoundPublic(release, feePct);

    return {
      ...card,
      description: release.description,
      audioPreviewUrl: release.audioPreviewUrl,
      releaseDate: release.releaseDate?.toISOString().slice(0, 10) ?? null,
      primaryRound,
      purchaseState: card.purchaseState,
    };
  }

  async listLegacyReleases() {
    const { items } = await this.listReleases({ page: 1, pageSize: MAX_PAGE_SIZE });
    return items.map((item) => ({
      id: item.id,
      slug: item.slug,
      symbol: item.symbol,
      title: item.title,
      segment: item.segment,
      status: item.releaseStatus,
      genre: item.genre,
      totalUnits: item.totalUnits,
      unitsAvailablePrimary: item.availableUnits,
      primaryUnitPrice: item.primaryUnitPriceUsdt,
      raiseTargetUsdt: item.raiseTargetUsdt,
      coverUrl: item.coverUrl,
      artist: item.artist,
      shortDescription: item.shortDescription,
    }));
  }

  async listArtists(search?: string) {
    const q = search?.trim();
    const rows = await this.prisma.artist.findMany({
      where: q
        ? { name: { contains: q, mode: 'insensitive' } }
        : {
            releaseArtists: {
              some: {
                release: {
                  deletedAt: null,
                  status: { in: CATALOG_PUBLIC_STATUSES },
                },
              },
            },
          },
      orderBy: { name: 'asc' },
      take: 100,
      select: { id: true, slug: true, name: true },
    });
    return { items: rows };
  }

  private async loadMarketContext(releaseIds: string[]) {
    const map = new Map<
      string,
      {
        secondaryEnabled: boolean;
        activeListingsCount: number;
        bestAskPrice: string | null;
        volume24hUsdt: string;
        volume7dUsdt: string;
        lastTradePrice: string | null;
        liquidityScore: number | null;
      }
    >();
    if (releaseIds.length === 0) return map;

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [listings, trades24h, trades7d, metrics] = await Promise.all([
      this.prisma.marketListing.groupBy({
        by: ['releaseId'],
        where: {
          releaseId: { in: releaseIds },
          deletedAt: null,
          status: ListingStatus.ACTIVE,
          unitsAvailable: { gt: 0 },
        },
        _count: { id: true },
        _min: { pricePerUnit: true },
      }),
      this.prisma.trade.findMany({
        where: {
          releaseId: { in: releaseIds },
          settlementStatus: TradeSettlementStatus.SETTLED,
          executedAt: { gte: since24h },
        },
        select: { releaseId: true, grossAmount: true, price: true, executedAt: true },
        orderBy: { executedAt: 'desc' },
      }),
      this.prisma.trade.groupBy({
        by: ['releaseId'],
        where: {
          releaseId: { in: releaseIds },
          settlementStatus: TradeSettlementStatus.SETTLED,
          executedAt: { gte: since7d },
        },
        _sum: { grossAmount: true },
      }),
      this.loadLatestMetrics(releaseIds),
    ]);

    const listingMap = new Map(
      listings.map((l) => [
        l.releaseId,
        { count: l._count.id, bestAsk: l._min.pricePerUnit?.toString() ?? null },
      ]),
    );
    const volume24h = new Map<string, Prisma.Decimal>();
    const lastPrice = new Map<string, string>();
    for (const t of trades24h) {
      volume24h.set(
        t.releaseId,
        (volume24h.get(t.releaseId) ?? new Prisma.Decimal(0)).plus(t.grossAmount),
      );
      if (!lastPrice.has(t.releaseId)) {
        lastPrice.set(t.releaseId, t.price.toString());
      }
    }
    const volume7d = new Map(
      trades7d.map((t) => [t.releaseId, t._sum.grossAmount ?? new Prisma.Decimal(0)]),
    );

    for (const id of releaseIds) {
      const listing = listingMap.get(id);
      map.set(id, {
        secondaryEnabled: (listing?.count ?? 0) > 0,
        activeListingsCount: listing?.count ?? 0,
        bestAskPrice: listing?.bestAsk ?? null,
        volume24hUsdt: (volume24h.get(id) ?? new Prisma.Decimal(0)).toString(),
        volume7dUsdt: (volume7d.get(id) ?? new Prisma.Decimal(0)).toString(),
        lastTradePrice: lastPrice.get(id) ?? null,
        liquidityScore: metrics.get(id)?.liquidityScore
          ? Number(metrics.get(id)!.liquidityScore)
          : null,
      });
    }
    return map;
  }

  private isReleaseUuid(key: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      key,
    );
  }

  private async findPublicRelease(key: string) {
    const trimmed = key.trim();
    let row = null;

    if (this.isReleaseUuid(trimmed)) {
      row = await this.prisma.release.findFirst({
        where: { id: trimmed, deletedAt: null },
        include: releaseInclude,
      });
    }

    row ??= await this.prisma.release.findFirst({
      where: { slug: trimmed.toLowerCase(), deletedAt: null },
      include: releaseInclude,
    });

    row ??= await this.prisma.release.findFirst({
      where: { symbol: trimmed.toUpperCase(), deletedAt: null },
      include: releaseInclude,
    });

    if (!row || !isCatalogPublicStatus(row.status)) {
      throwAdminError(
        'RELEASE_NOT_FOUND',
        'Release not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return row;
  }

  private pickPrimaryRound<T extends { status: PrimaryRaiseRoundStatus }>(
    rounds: T[],
  ): T | undefined {
    const live = rounds.find((r) => r.status === PrimaryRaiseRoundStatus.LIVE);
    if (live) return live;
    const paused = rounds.find((r) => r.status === PrimaryRaiseRoundStatus.PAUSED);
    if (paused) return paused;
    return rounds[0];
  }

  private mapCatalogCard(
    release: Prisma.ReleaseGetPayload<{ include: typeof releaseInclude }>,
    metrics:
      | { yieldPct: Prisma.Decimal | null; liquidityScore: Prisma.Decimal | null }
      | undefined,
    feePct: Prisma.Decimal,
    marketCtx?: {
      secondaryEnabled: boolean;
      activeListingsCount: number;
      bestAskPrice: string | null;
      volume24hUsdt: string;
      volume7dUsdt: string;
      lastTradePrice: string | null;
      liquidityScore: number | null;
    },
  ) {
    const fullRound = this.pickPrimaryRound(release.primaryRaiseRounds);
    const available = fullRound
      ? fullRound.totalUnits.minus(fullRound.soldUnits)
      : release.unitsAvailablePrimary;

    const purchaseState = resolvePurchaseState({
      releaseStatus: release.status,
      roundStatus: fullRound?.status ?? null,
      availableUnits: available,
    });

    const soldPrimary = release.totalUnits.minus(release.unitsAvailablePrimary);
    const goal = fullRound?.raiseTargetUsdt ?? release.raiseTargetUsdt;
    const raised = soldPrimary.mul(release.primaryUnitPrice);
    const progressPct = release.totalUnits.greaterThan(0)
      ? Math.min(100, Math.round(Number(soldPrimary.div(release.totalUnits).mul(100))))
      : 0;

    const yieldPct = metrics?.yieldPct ? Number(metrics.yieldPct) : null;
    const primaryArtist = release.releaseArtists[0];
    const catalogStatus =
      purchaseState === 'available'
        ? 'open'
        : purchaseState === 'paused'
          ? 'coming_soon'
          : purchaseState === 'sold_out'
            ? 'sold_out'
            : 'payouts';

    const cardKind =
      marketCtx?.secondaryEnabled &&
      (purchaseState === 'sold_out' || purchaseState === 'unavailable')
        ? 'market'
        : purchaseState === 'available'
          ? 'funding'
          : catalogStatus === 'coming_soon'
            ? 'coming_soon'
            : 'payouts';

    return {
      id: release.id,
      slug: release.slug,
      symbol: release.symbol,
      title: release.title,
      artist: artistDisplayName(release),
      artistId: primaryArtist?.artistId ?? null,
      artists: release.releaseArtists.map((ra) => ({
        id: ra.artistId,
        name: ra.artist.name,
        role: ra.role,
      })),
      genre: normalizeGenre(release.genre),
      segment: release.segment ?? normalizeGenre(release.genre),
      tags: [normalizeGenre(release.genre), release.segment].filter(
        (t): t is string => Boolean(t),
      ),
      coverUrl: release.coverUrl,
      shortDescription: shortDescription(release.description),
      releaseDate: release.releaseDate?.toISOString().slice(0, 10) ?? null,
      releaseStatus: release.status,
      catalogStatus,
      statusLabel:
        release.status === ReleaseStatus.SOLD_OUT
          ? 'Закрыт'
          : purchaseState === 'available'
            ? 'Активен'
            : purchaseState === 'paused'
              ? 'Пауза'
              : 'Недоступен',
      riskLabel: mapRiskLabel({
        purchaseState,
        liquidityScore: metrics?.liquidityScore,
        hasLiveRound: fullRound?.status === 'LIVE',
      }),
      roundStatus: roundStatusToApi(fullRound?.status ?? null),
      purchaseState,
      payoutFreq: mapPayoutFreq(release.payoutFrequency),
      totalUnits: release.totalUnits.toString(),
      unitsSold: soldPrimary.toString(),
      availableUnits: available.toString(),
      primaryUnitPriceUsdt: release.primaryUnitPrice.toString(),
      unitPriceUsdt: release.primaryUnitPrice.toString(),
      raiseTargetUsdt: goal?.toString() ?? null,
      hardCapUsdt:
        fullRound?.hardCapUsdt?.toString() ?? release.hardCapUsdt?.toString() ?? null,
      raisedUsdt: raised.toString(),
      goalUsdt: goal?.toString() ?? null,
      progressPct,
      soldPercent: progressPct,
      expectedYieldPct:
        yieldPct !== null ? `${yieldPct.toFixed(1).replace('.', ',')}%` : null,
      primaryPurchaseFeePct: feePct.toString(),
      secondaryMarketEnabled: marketCtx?.secondaryEnabled ?? release.secondaryEnabled,
      activeSecondaryListingsCount: marketCtx?.activeListingsCount ?? 0,
      bestSecondaryAskPrice: marketCtx?.bestAskPrice ?? null,
      lastTradePrice: marketCtx?.lastTradePrice ?? null,
      volume24hUsdt: marketCtx?.volume24hUsdt ?? '0',
      volume7dUsdt: marketCtx?.volume7dUsdt ?? '0',
      liquidityScore:
        marketCtx?.liquidityScore ??
        (metrics?.liquidityScore ? Number(metrics.liquidityScore) : null),
      nextPayoutDate: null,
      cardKind,
    };
  }

  private mapPrimaryRoundPublic(
    release: Prisma.ReleaseGetPayload<{ include: typeof releaseInclude }>,
    feePct: Prisma.Decimal,
  ) {
    const live = release.primaryRaiseRounds.find((r) => r.status === 'LIVE');
    const round = live ?? release.primaryRaiseRounds[0];
    if (!round) {
      return {
        roundId: null,
        status: 'none' as const,
        availableUnits: '0',
        pricePerUnit: release.primaryUnitPrice.toString(),
        raiseTargetUsdt: release.raiseTargetUsdt?.toString() ?? null,
        hardCapUsdt: release.hardCapUsdt?.toString() ?? null,
        soldUnits: '0',
        totalUnits: release.totalUnits.toString(),
        progressPct: 0,
        primaryPurchaseFeePct: feePct.toString(),
      };
    }

    const available = round.totalUnits.minus(round.soldUnits);
    const progressPct = round.totalUnits.greaterThan(0)
      ? Math.min(100, Math.round(Number(round.soldUnits.div(round.totalUnits).mul(100))))
      : 0;

    return {
      roundId: round.id,
      status: roundStatusToApi(round.status),
      availableUnits: available.toString(),
      pricePerUnit: release.primaryUnitPrice.toString(),
      raiseTargetUsdt: round.raiseTargetUsdt.toString(),
      hardCapUsdt: round.hardCapUsdt.toString(),
      soldUnits: round.soldUnits.toString(),
      totalUnits: round.totalUnits.toString(),
      progressPct,
      primaryPurchaseFeePct: feePct.toString(),
    };
  }

  private async loadLatestMetrics(releaseIds: string[]) {
    const map = new Map<
      string,
      { yieldPct: Prisma.Decimal | null; liquidityScore: Prisma.Decimal | null }
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
        liquidityScore: row.liquidityScore,
      });
    }
    return map;
  }

  private async defaultPrimaryFeePct(): Promise<Prisma.Decimal> {
    const row = await this.prisma.platformFeeSetting.findFirst({
      where: { isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });
    return row?.primaryPurchaseFeePct ?? new Prisma.Decimal(2);
  }
}
