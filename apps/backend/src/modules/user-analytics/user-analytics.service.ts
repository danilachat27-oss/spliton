import { HttpStatus, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { CACHE_TTL_MS } from '../../common/cache/cache-ttl.constants';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';
import { resolvePagination } from '../../common/pagination/pagination.util';
import {
  AppLocale,
  EarningPeriodStatus,
  OwnershipEventType,
  PayoutStatus,
  Prisma,
  ReleaseDocumentStatus,
  ReleaseDocumentVisibility,
  ReleaseStatus,
  TradeSettlementStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { decToMoney } from '../portfolio/portfolio-decimal.util';
import { PortfolioPositionsService } from '../portfolio/portfolio-positions.service';
import { SecondaryMarketEnrichmentService } from '../market/secondary-market-enrichment.service';
import type { AnalyticsReleasesListQueryDto } from './dto/analytics-releases-list-query.dto';
import type { UserAnalyticsPeriod } from './dto/user-analytics-period-query.dto';
import type {
  ReleaseDetailFullDto,
  ReleaseMyHistoryDto,
} from './types/release-detail-api.types';
import type {
  UserAnalyticsDetailDto,
  UserAnalyticsLedgerDto,
  UserAnalyticsListDto,
  UserAnalyticsListItemDto,
  UserAnalyticsMarketDto,
  UserAnalyticsPayoutsDto,
  UserAnalyticsPerformanceDto,
  UserAnalyticsReleaseMetaDto,
} from './types/user-analytics-api.types';
import { UserAnalyticsResolveService } from './user-analytics-resolve.service';
import {
  computeFillProgressDisplay,
  resolveReleaseLifecycleStatus,
} from './release-lifecycle.util';
import {
  artistNames,
  expandSeries,
  formatPct,
  formatUnits,
  formatUsdt,
  mapGenre,
  mapReleaseStatus,
  normalizeSparkline,
  trendFromChange,
} from './user-analytics.util';

@Injectable()
export class UserAnalyticsService {
  private readonly logger = new Logger(UserAnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly resolve: UserAnalyticsResolveService,
    private readonly positions: PortfolioPositionsService,
    private readonly enrichment: SecondaryMarketEnrichmentService,
    private readonly cache: TtlCacheService,
  ) {}

  private logSqlFunctionError(functionName: string, err: unknown): void {
    const detail = err instanceof Error ? err.message : String(err);
    this.logger.error(`Release analytics SQL failed: ${functionName} — ${detail}`);
  }

  private throwAnalyticsUnavailable(functionName: string, err: unknown): never {
    this.logSqlFunctionError(functionName, err);
    throw new ServiceUnavailableException({
      code: 'RELEASE_ANALYTICS_UNAVAILABLE',
      message: `Release analytics temporarily unavailable (${functionName})`,
      degraded: true,
    });
  }

  private async callAnalyticsJsonFunction(
    functionName: string,
    sql: string,
    ...params: unknown[]
  ): Promise<unknown> {
    try {
      const rows = await this.prisma.$queryRawUnsafe<{ payload: unknown }[]>(
        sql,
        ...params,
      );
      const payload = rows[0]?.payload;
      if (payload == null || (typeof payload === 'object' && Object.keys(payload as object).length === 0)) {
        this.logger.error(`Release analytics SQL returned empty payload: ${functionName}`);
        throw new ServiceUnavailableException({
          code: 'RELEASE_ANALYTICS_UNAVAILABLE',
          message: `Release analytics temporarily unavailable (${functionName})`,
          degraded: true,
        });
      }
      return payload;
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      this.throwAnalyticsUnavailable(functionName, err);
    }
  }

  async getReleasesOverview(period: string) {
    const cacheKey = `analytics:releases:overview:${period}`;
    return this.cache.getOrSet(
      cacheKey,
      CACHE_TTL_MS.analyticsReleasesOverview,
      () =>
        this.callAnalyticsJsonFunction(
          'analytics_releases_overview',
          `SELECT analytics_releases_overview($1::text) AS payload`,
          period,
        ),
    );
  }

  async getReleasesTimeseries(period: string) {
    const cacheKey = `analytics:releases:timeseries:${period}`;
    return this.cache.getOrSet(cacheKey, CACHE_TTL_MS.analyticsReleasesOverview, () =>
      this.callAnalyticsJsonFunction(
        'analytics_releases_timeseries',
        `SELECT analytics_releases_timeseries($1::text) AS payload`,
        period,
      ),
    );
  }

  async getReleasesCompare(period: string, limit: number) {
    const cacheKey = `analytics:releases:compare:${period}:${limit}`;
    return this.cache.getOrSet(cacheKey, CACHE_TTL_MS.analyticsReleasesOverview, () =>
      this.callAnalyticsJsonFunction(
        'analytics_releases_compare',
        `SELECT analytics_releases_compare($1::text, $2::int) AS payload`,
        period,
        limit,
      ),
    );
  }

  async getReleasesGenres(period: string) {
    const cacheKey = `analytics:releases:genres:${period}`;
    return this.cache.getOrSet(cacheKey, CACHE_TTL_MS.analyticsReleasesOverview, () =>
      this.callAnalyticsJsonFunction(
        'analytics_releases_genres',
        `SELECT analytics_releases_genres($1::text) AS payload`,
        period,
      ),
    );
  }

  async getReleasesFunnel(period: string) {
    const cacheKey = `analytics:releases:funnel:${period}`;
    return this.cache.getOrSet(cacheKey, CACHE_TTL_MS.analyticsReleasesOverview, () =>
      this.callAnalyticsJsonFunction(
        'analytics_releases_funnel',
        `SELECT analytics_releases_funnel($1::text) AS payload`,
        period,
      ),
    );
  }

  async searchReleases(
    query: AnalyticsReleasesListQueryDto,
    userId: string | null,
  ) {
    const { page, pageSize } = resolvePagination(query.page, query.pageSize ?? 24);
    const period = query.period ?? '30d';

    type SearchRow = {
      id: string;
      slug: string;
      symbol: string;
      title: string;
      artist: string;
      genre: string;
      status: string;
      status_label: string;
      risk_label: string;
      yield_pct: Prisma.Decimal;
      change_pct: Prisma.Decimal;
      payouts_usdt: Prisma.Decimal;
      units: Prisma.Decimal;
      payout_band_lo: Prisma.Decimal;
      payout_band_hi: Prisma.Decimal;
      sparkline: number[] | null;
      secondary_volume_usdt: Prisma.Decimal;
      liquidity_score: Prisma.Decimal;
      my_units: Prisma.Decimal | null;
      my_pnl: Prisma.Decimal | null;
      sold_units: Prisma.Decimal;
      available_units: Prisma.Decimal;
      price_per_unit_usdt: Prisma.Decimal;
      raised_usdt: Prisma.Decimal;
      target_usdt: Prisma.Decimal;
      progress_pct: Prisma.Decimal;
      holders_count: number;
      secondary_listings_count: number;
      last_trade_price: Prisma.Decimal | null;
      updated_at: Date;
      total_count: bigint;
    };

    let rows: SearchRow[];
    try {
      rows = await this.prisma.$queryRawUnsafe<SearchRow[]>(
        `SELECT * FROM analytics_releases_search(
          $1::text, $2::text, $3::text, $4::text, $5::text, $6::text, $7::integer, $8::integer, $9::uuid
        )`,
        period,
        query.search?.trim() ?? null,
        query.status && query.status !== 'all' ? query.status : null,
        query.genre && query.genre !== 'all' ? query.genre : null,
        query.preset ?? 'all',
        query.sort ?? 'yield_desc',
        page,
        pageSize,
        userId,
      );
    } catch (err) {
      this.throwAnalyticsUnavailable('analytics_releases_search', err);
    }

    const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const overview = (await this.getReleasesOverview(period)) as {
      kpis?: {
        averageYieldPct?: number | null;
        activeReleases?: number;
        totalPayoutsUsdt?: string;
      };
    };

    const kpis = overview.kpis ?? {};
    const avgYield =
      kpis.averageYieldPct != null
        ? `${Number(kpis.averageYieldPct).toFixed(1).replace('.', ',')}%`
        : null;
    const payoutsTotal = kpis.totalPayoutsUsdt ?? null;

    const items = rows.map((row) => {
      const sparkline = Array.isArray(row.sparkline)
        ? row.sparkline.map((v) => Number(v))
        : normalizeSparkline([]);
      const item: UserAnalyticsListItemDto = {
        id: row.id,
        slug: row.slug,
        symbol: row.symbol,
        release: row.title,
        artist: row.artist,
        genre: mapGenre(null, row.genre),
        yieldPct: `${Number(row.yield_pct).toFixed(1).replace('.', ',')}%`,
        changePct: formatPct(row.change_pct),
        payouts: formatUsdt(row.payouts_usdt),
        units: formatUnits(row.units),
        status: row.status as UserAnalyticsListItemDto['status'],
        trend: trendFromChange(row.change_pct),
        sparkline,
        payoutBand: {
          lo: formatUsdt(row.payout_band_lo),
          hi: formatUsdt(row.payout_band_hi),
          t: 0.5,
        },
        soldUnits: formatUnits(row.sold_units),
        availableUnits: formatUnits(row.available_units),
        pricePerUnitUsdt: formatUsdt(row.price_per_unit_usdt),
        raisedUsdt: formatUsdt(row.raised_usdt),
        targetUsdt: formatUsdt(row.target_usdt),
        progressPercent: Number(row.progress_pct),
        holdersCount: row.holders_count,
        secondaryListingsCount: row.secondary_listings_count,
        secondaryVolumeUsdt: formatUsdt(row.secondary_volume_usdt),
        liquidityPercent: Number(row.liquidity_score),
        lastTradePrice: row.last_trade_price
          ? formatUsdt(row.last_trade_price)
          : null,
        updatedAt: row.updated_at?.toISOString?.() ?? new Date().toISOString(),
      };
      if (userId && row.my_units != null) {
        item.userUnits = formatUnits(row.my_units);
        if (row.my_pnl != null) {
          item.userPnlUsdt = formatUsdt(row.my_pnl);
        }
      }
      return item;
    });

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
      },
      stats: {
        avgYieldPct: avgYield,
        activeCount: kpis.activeReleases ?? null,
        payoutsTotalUsdt:
          payoutsTotal == null
            ? null
            : payoutsTotal.includes('USDT')
              ? payoutsTotal
              : `${payoutsTotal} USDT`,
      },
      filters: {
        genres: await this.loadGenreFilters(),
        statuses: [
          { key: 'Active', label: 'Активен', count: 0 },
          { key: 'Paused', label: 'Пауза', count: 0 },
          { key: 'Closed', label: 'Закрыт', count: 0 },
        ],
      },
      updatedAt: new Date().toISOString(),
    };
  }

  private async loadGenreFilters(): Promise<{ name: string; count: number }[]> {
    const rows = await this.prisma.$queryRawUnsafe<
      { genre: string; cnt: number }[]
    >(
      `SELECT genre AS genre, COUNT(*)::int AS cnt
       FROM market_overview_releases_v
       GROUP BY genre
       ORDER BY cnt DESC
       LIMIT 20`,
    );
    return rows.map((r) => ({ name: r.genre, count: r.cnt }));
  }

  async listReleases(userId: string): Promise<UserAnalyticsListDto> {
    const positions = await this.positions.loadPositions(userId);
    if (positions.length === 0) {
      return {
        items: [],
        stats: {
          avgYieldPct: '0,0%',
          activeCount: 0,
          payoutsTotalUsdt: '0 USDT',
        },
      };
    }

    const releaseIds = positions.map((p) => p.releaseId);
    const [releaseMeta, metrics, distributions, priceHist] = await Promise.all([
      this.prisma.release.findMany({
        where: { id: { in: releaseIds } },
        select: { id: true, symbol: true },
      }),
      this.prisma.releaseMetricsDaily.findMany({
        where: { releaseId: { in: releaseIds } },
        orderBy: { asOfDate: 'desc' },
        distinct: ['releaseId'],
      }),
      this.prisma.earningDistribution.findMany({
        where: { releaseId: { in: releaseIds } },
        select: { releaseId: true, totalDistributable: true },
      }),
      this.prisma.priceHistory.findMany({
        where: {
          releaseId: { in: releaseIds },
          bucket: 'D1',
          ts: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { ts: 'asc' },
      }),
    ]);

    const symbolById = new Map(releaseMeta.map((r) => [r.id, r.symbol]));
    const metricsByRelease = new Map(metrics.map((m) => [m.releaseId, m]));
    const payoutSumByRelease = new Map<string, Prisma.Decimal>();
    for (const d of distributions) {
      payoutSumByRelease.set(
        d.releaseId,
        (payoutSumByRelease.get(d.releaseId) ?? new Prisma.Decimal(0)).plus(
          d.totalDistributable,
        ),
      );
    }
    const historyByRelease = new Map<string, Prisma.Decimal[]>();
    for (const h of priceHist) {
      const list = historyByRelease.get(h.releaseId) ?? [];
      list.push(h.closePrice);
      historyByRelease.set(h.releaseId, list);
    }

    let totalPayouts = new Prisma.Decimal(0);
    let yieldSum = 0;
    let yieldCount = 0;
    let activeCount = 0;

    const items: UserAnalyticsListItemDto[] = positions.map((pos) => {
      const m = metricsByRelease.get(pos.releaseId);
      const yieldPct = m?.yieldPct ?? new Prisma.Decimal(0);
      if (yieldPct.greaterThan(0)) {
        yieldSum += Number(yieldPct);
        yieldCount += 1;
      }
      const change7d = new Prisma.Decimal(pos.pnlPct);
      const payouts =
        payoutSumByRelease.get(pos.releaseId) ?? new Prisma.Decimal(0);
      totalPayouts = totalPayouts.plus(payouts);
      if (pos.status === 'Active' || pos.status === 'Secondary')
        activeCount += 1;

      const sparkline = normalizeSparkline(
        historyByRelease.get(pos.releaseId) ?? [],
      );
      const payoutNum = Number(payouts);
      const lo = payoutNum * 0.85;
      const hi = payoutNum * 1.15 || 1;

      return {
        id: pos.releaseId,
        slug: pos.slug,
        symbol: symbolById.get(pos.releaseId) ?? pos.slug,
        release: pos.release,
        artist: pos.artist,
        genre: mapGenre(null, pos.genre),
        yieldPct: `${Number(yieldPct).toFixed(1).replace('.', ',')}%`,
        changePct: formatPct(change7d),
        payouts: formatUsdt(payouts),
        units: formatUnits(pos._unitsTotal),
        status: pos.status === 'Closed' ? 'Closed' : 'Active',
        trend: trendFromChange(change7d),
        sparkline,
        payoutBand: {
          lo: formatUsdt(lo),
          hi: formatUsdt(hi || payoutNum || 1),
          t: 0.5,
        },
        userUnits: pos.unitsTotal,
        userValueUsdt: pos.marketValue,
        userPnlUsdt: pos.pnlUnrealized,
        userPnlPct: pos.pnlPct,
      };
    });

    const avgYield =
      yieldCount > 0
        ? `${(yieldSum / yieldCount).toFixed(1).replace('.', ',')}%`
        : '0,0%';

    return {
      items,
      stats: {
        avgYieldPct: avgYield,
        activeCount,
        payoutsTotalUsdt: formatUsdt(totalPayouts),
      },
    };
  }

  async getDetail(
    releaseKey: string,
    userId: string | null,
    locale: AppLocale = AppLocale.ru,
  ): Promise<UserAnalyticsDetailDto> {
    const releaseId = await this.resolve.resolveReleaseId(releaseKey);
    await this.resolve.assertPublicRelease(releaseId);
    const release = await this.resolve.loadRelease(releaseId);
    const meta = this.mapReleaseMeta(release);

    let holding = null;
    if (userId) {
      const pos = await this.positions.loadPositionForRelease(userId, releaseId);
      if (pos) {
        holding = {
          unitsTotal: pos.unitsTotal,
          unitsAvailable: pos.unitsAvailable,
          unitsLocked: pos.unitsLocked,
          avgEntryPrice: pos.avgEntryPrice,
          currentPrice: pos.currentPrice,
          marketValueUsdt: pos.marketValue,
          costBasisUsdt: pos.costBasis,
          pnlUnrealizedUsdt: pos.pnlUnrealized,
          pnlPct: pos.pnlPct,
          portfolioSharePct: pos.portfolioSharePct,
        };
      }
    }

    const [metrics, faq, payoutSummary] = await Promise.all([
      this.prisma.releaseMetricsDaily.findFirst({
        where: { releaseId },
        orderBy: { asOfDate: 'desc' },
      }),
      this.loadPublishedFaq(releaseId, locale),
      this.computePayoutSummary(releaseId),
    ]);

    return {
      release: meta,
      holding,
      expectedYieldPct: metrics?.yieldPct
        ? `${Number(metrics.yieldPct).toFixed(1)}%`
        : null,
      riskLabel: this.riskLabel(release.status, holding != null),
      faq,
      payoutSummary,
      walletCta: {
        available: Boolean(userId),
        href: userId ? '/assets/payouts/deposit' : '/login',
        reason: userId ? null : 'Войдите, чтобы пополнить USDT-кошелёк',
      },
    };
  }

  async getFullDetail(
    releaseKey: string,
    userId: string | null,
    locale: AppLocale = AppLocale.ru,
  ): Promise<ReleaseDetailFullDto> {
    const releaseId = await this.resolve.resolveReleaseId(releaseKey);
    await this.resolve.assertPublicRelease(releaseId);
    const [detail, market, payouts] = await Promise.all([
      this.getDetail(releaseKey, userId, locale),
      this.getMarket(releaseKey),
      this.getPayouts(releaseKey, userId),
    ]);
    const release = await this.resolve.loadRelease(releaseId);
    const round = release.primaryRaiseRounds[0];
    const soldUnits = round
      ? round.soldUnits
      : release.totalUnits.minus(release.unitsAvailablePrimary);
    const fillProgressDecimal =
      round && round.raiseTargetUsdt.gt(0)
        ? round.raisedAmountUsdt.div(round.raiseTargetUsdt).mul(100)
        : null;
    const lifecycleStatus = resolveReleaseLifecycleStatus(
      release.status,
      release.unitsAvailablePrimary,
      release.totalUnits,
      soldUnits,
      release.publicStatus,
    );
    const fillProgressLabel = computeFillProgressDisplay(
      lifecycleStatus,
      fillProgressDecimal,
      soldUnits,
      release.totalUnits,
    );

    const [trades30dVol, lastTrade, obSnap] = await Promise.all([
      this.prisma.trade.aggregate({
        where: {
          releaseId,
          executedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          settlementStatus: TradeSettlementStatus.SETTLED,
        },
        _sum: { grossAmount: true },
      }),
      this.prisma.trade.findFirst({
        where: { releaseId, settlementStatus: TradeSettlementStatus.SETTLED },
        orderBy: { executedAt: 'desc' },
      }),
      this.prisma.orderBookSnapshot.findFirst({
        where: { releaseId },
        orderBy: { capturedAt: 'desc' },
      }),
    ]);

    const docs = await this.prisma.releaseDocument.findMany({
      where: {
        releaseId,
        status: ReleaseDocumentStatus.PUBLISHED,
        visibility: { not: ReleaseDocumentVisibility.ADMIN_ONLY },
      },
      orderBy: [{ docType: 'asc' }, { version: 'desc' }],
    });
    const isHolder = Boolean(detail.holding);
    const documents = docs.map((doc) => ({
      id: doc.id,
      title: doc.title || doc.docType,
      type: doc.docType,
      visibility: doc.visibility.toLowerCase(),
      locale: doc.locale,
      downloadable: this.canAccessDocument(doc.visibility, Boolean(userId), isHolder),
      downloadUrl: this.canAccessDocument(doc.visibility, Boolean(userId), isHolder)
        ? doc.url
        : null,
      requiresAuth: doc.visibility !== ReleaseDocumentVisibility.PUBLIC,
      requiresHolding: doc.visibility === ReleaseDocumentVisibility.HOLDERS_ONLY,
      status: doc.status.toLowerCase(),
    }));

    const r = detail.release;
    const canBuyPrimary =
      lifecycleStatus === 'active_primary' &&
      release.status === ReleaseStatus.ACTIVE &&
      release.unitsAvailablePrimary.gt(0);
    const userBlock = userId
      ? {
          userUnits: detail.holding?.unitsTotal ?? null,
          userAvailableUnits: detail.holding?.unitsAvailable ?? null,
          userLockedUnits: detail.holding?.unitsLocked ?? null,
          userAvgEntryPrice: detail.holding?.avgEntryPrice ?? null,
          userCurrentValue: detail.holding?.marketValueUsdt ?? null,
          userPnl: detail.holding?.pnlUnrealizedUsdt ?? null,
          userPayoutsReceived: payouts.userPayouts.length
            ? formatUsdt(
                payouts.userPayouts
                  .filter((p) => p.status === PayoutStatus.PAID)
                  .reduce(
                    (acc, p) =>
                      acc.plus(new Prisma.Decimal(p.amountNet.replace(/\s/g, '').replace(',', '.'))),
                    new Prisma.Decimal(0),
                  ),
              )
            : null,
          canSell: Boolean(
            detail.holding &&
              Number.parseFloat(detail.holding.unitsAvailable.replace(',', '.')) > 0 &&
              release.secondaryEnabled,
          ),
          canBuyMore: canBuyPrimary || release.secondaryEnabled,
          complianceRestrictions: [] as string[],
        }
      : null;

    const artistId = release.releaseArtists[0]?.artistId ?? null;

    return {
      identity: {
        id: r.id,
        slug: r.slug,
        symbol: r.symbol,
        title: r.title,
        artistName: r.artist,
        artistId,
        genre: r.genre,
        status: r.status,
        publicStatus: release.publicStatus,
        roundStatus: lifecycleStatus,
        lifecycleStatus,
        coverUrl: r.coverUrl,
        videoUrl: r.videoUrl,
        videoType: r.videoType,
        videoStatus: r.videoStatus,
        videoPosterUrl: r.videoPosterUrl,
        shortDescription: r.shortDescription,
        fullDescription: r.description,
        releaseDate: r.releaseDate,
        createdAt: release.createdAt.toISOString(),
        updatedAt: r.updatedAt,
      },
      pulse: {
        grossYieldReference: detail.expectedYieldPct,
        grossYieldLabel: 'Ориентир gross',
        roundStatusLabel: r.statusLabel,
        payoutWindowAmount: detail.payoutSummary.payouts30d,
        payoutWindowPeriod: '30D',
        unitsInCirculation: soldUnits.toString(),
        availablePrimaryUnits: r.unitsAvailablePrimary,
        secondaryVolume30d: formatUsdt(trades30dVol._sum.grossAmount ?? new Prisma.Decimal(0)),
        minEntryAmount: r.minPurchaseUnits
          ? `${decToMoney(release.primaryUnitPrice.mul(release.minPurchaseUnits ?? new Prisma.Decimal(0)))} USDT`
          : null,
        walletCtaAvailable: detail.walletCta.available,
        walletCtaHref: detail.walletCta.href,
        lastUpdatedAt: r.updatedAt,
      },
      primaryRound: {
        unitPrice: r.primaryUnitPrice,
        totalUnits: r.totalUnits,
        soldUnits: soldUnits.toString(),
        availableUnits: r.unitsAvailablePrimary,
        fillProgress: fillProgressLabel ?? '—',
        raiseTarget: r.raiseTargetUsdt,
        raisedAmount: r.raisedAmountUsdt,
        hardCap: r.hardCapUsdt,
        minPurchaseAmount: r.minPurchaseUnits && release.primaryUnitPrice
          ? `${decToMoney(release.primaryUnitPrice.mul(r.minPurchaseUnits))} USDT`
          : null,
        maxPurchaseAmount: r.maxPurchaseUnits && release.primaryUnitPrice
          ? `${decToMoney(release.primaryUnitPrice.mul(r.maxPurchaseUnits))} USDT`
          : null,
        closeAt: round?.endDate?.toISOString() ?? null,
        canBuyPrimary,
        primaryBlockingReason: canBuyPrimary
          ? null
          : release.status !== ReleaseStatus.ACTIVE
            ? 'Раунд не активен'
            : 'Нет доступных units в первичке',
      },
      dealTerms: {
        distributionShare: r.holderSharePct,
        artistShare: r.artistSharePct,
        investorShare: r.holderSharePct,
        platformFee: r.platformSharePct,
        promoBudget: r.promoBudgetUsdt,
        artistUpfront: r.artistUpfrontUsdt,
        platformUpfront: r.platformUpfrontUsdt,
        payoutFrequency: r.payoutFrequency,
        payoutCurrency: 'USDT',
        payoutNetwork: 'TRC20',
        rightsTransferAllowed: release.secondaryEnabled,
        secondaryEnabled: release.secondaryEnabled,
        riskDisclosureText: r.riskDisclosureText,
        legalDisclaimer: r.legalDisclaimer,
        modelNotes: release.distributionNotes,
      },
      payoutSummary: {
        payouts30d: detail.payoutSummary.payouts30d,
        payoutsAllTime: detail.payoutSummary.payoutsAllTime,
        nextPayoutDate: null,
        lastPayoutDate: detail.payoutSummary.lastPayoutDate,
        averagePayoutPerUnit: payouts.periods[0]?.perUnit ?? null,
        payoutCurrency: 'USDT',
      },
      secondarySummary: {
        activeListings: market.activeListings,
        trades7d: market.deals7d,
        averageSpread: obSnap?.spreadAmount ? decToMoney(obSnap.spreadAmount) : null,
        medianFillTime: null,
        averageUnitPrice: lastTrade ? decToMoney(lastTrade.price) : null,
        liquidityLabel: market.liquidity,
        secondaryVolume24h: market.volume24hUsdt,
        secondaryVolume30d: formatUsdt(trades30dVol._sum.grossAmount ?? new Prisma.Decimal(0)),
        bestBid: market.bestBid,
        bestAsk: market.bestAsk,
        lastTradePrice: lastTrade ? decToMoney(lastTrade.price) : null,
        priceChange7d: market.change7dPct,
        priceChange30d: null,
        secondaryAvailable: release.secondaryEnabled && market.activeListings > 0,
      },
      user: userBlock,
      faq: detail.faq.map((f) => ({
        question: f.question,
        answer: f.answer,
        order: f.order,
        locale: f.locale,
        category: f.category,
        isPublished: true,
      })),
      documents,
      payoutHistory: payouts.periods,
      expectedYieldPct: detail.expectedYieldPct,
      riskLabel: detail.riskLabel,
      holding: detail.holding,
    };
  }

  async getMyHistory(
    releaseKey: string,
    userId: string,
  ): Promise<ReleaseMyHistoryDto> {
    if (!userId) {
      throwAdminError(
        'UNAUTHORIZED',
        'Authentication required',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const releaseId = await this.resolve.resolveReleaseId(releaseKey);
    await this.resolve.assertPublicRelease(releaseId);

    const [orders, trades, payouts, ledgerRows] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId, releaseId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.trade.findMany({
        where: {
          releaseId,
          OR: [{ buyerUserId: userId }, { sellerUserId: userId }],
        },
        orderBy: { executedAt: 'desc' },
        take: 50,
      }),
      this.prisma.payout.findMany({
        where: { userId, releaseId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.ownershipLedger.findMany({
        where: { userId, releaseId },
        orderBy: { happenedAt: 'desc' },
        take: 100,
      }),
    ]);

    return {
      orders: orders.map((o) => ({
        id: o.id,
        side: o.side,
        status: o.status,
        units: o.unitsTotal.toString(),
        price: o.priceLimit ? decToMoney(o.priceLimit) : null,
        createdAt: o.createdAt.toISOString(),
      })),
      trades: trades.map((t) => ({
        id: t.id,
        side: t.buyerUserId === userId ? 'buy' : 'sell',
        units: t.units.toString(),
        price: decToMoney(t.price),
        executedAt: t.executedAt.toISOString(),
      })),
      payouts: payouts.map((p) => ({
        id: p.id,
        amountNet: decToMoney(p.amountNet),
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      })),
      ledger: ledgerRows.map((r) => this.mapLedgerEntry(r)),
    };
  }

  async getPerformance(
    releaseKey: string,
    period: UserAnalyticsPeriod = '30d',
  ): Promise<UserAnalyticsPerformanceDto> {
    const releaseId = await this.resolve.resolveReleaseId(releaseKey);
    await this.resolve.assertPublicRelease(releaseId);

    const allHistory = await this.prisma.priceHistory.findMany({
      where: { releaseId, bucket: 'D1' },
      orderBy: { ts: 'asc' },
      take: 500,
    });

    const seriesFor = (p: UserAnalyticsPeriod): number[] => {
      const since = this.periodSince(p);
      const slice = since
        ? allHistory.filter((h) => h.ts.getTime() >= since.getTime())
        : allHistory;
      const closes = slice.map((h) => Number(h.closePrice));
      return closes;
    };

    const seriesByPeriod: Record<string, number[]> = {
      '7d': seriesFor('7d'),
      '30d': seriesFor('30d'),
      '90d': seriesFor('90d'),
      ytd: seriesFor('ytd'),
      all: seriesFor('all'),
    };

    const activeHistory = seriesByPeriod[period] ?? seriesFor(period);
    const closes = activeHistory;

    let changePct = '0,0%';
    if (closes.length >= 2) {
      const first = closes[0]!;
      const last = closes[closes.length - 1]!;
      if (first > 0) {
        changePct = formatPct(((last - first) / first) * 100);
      }
    }

    const metrics = await this.prisma.releaseMetricsDaily.findFirst({
      where: { releaseId },
      orderBy: { asOfDate: 'desc' },
    });

    return {
      period,
      seriesByPeriod,
      miniStats: [
        { label: 'Δ за период', value: changePct },
        {
          label: 'Ориентир yield',
          value: metrics?.yieldPct
            ? `${Number(metrics.yieldPct).toFixed(1).replace('.', ',')}%`
            : '—',
        },
        { label: 'Точек в ряде', value: String(closes.length) },
      ],
      priceHistory: allHistory
        .filter((h) => {
          const since = this.periodSince(period);
          return since ? h.ts.getTime() >= since.getTime() : true;
        })
        .map((h) => ({
          ts: h.ts.toISOString(),
          close: decToMoney(h.closePrice),
        })),
    };
  }

  async getPayouts(
    releaseKey: string,
    userId: string | null,
  ): Promise<UserAnalyticsPayoutsDto> {
    const releaseId = await this.resolve.resolveReleaseId(releaseKey);
    await this.resolve.assertPublicRelease(releaseId);

    const release = await this.resolve.loadRelease(releaseId);
    const holderPoolPct = release.holderSharePct
      ? `${Number(release.holderSharePct).toFixed(1).replace('.', ',')}%`
      : '—';

    const distributions = await this.prisma.earningDistribution.findMany({
      where: {
        releaseId,
        earningPeriod: {
          status: {
            in: [EarningPeriodStatus.DISTRIBUTED, EarningPeriodStatus.APPROVED],
          },
        },
      },
      include: {
        earningPeriod: {
          include: { reports: { take: 1, orderBy: { createdAt: 'desc' } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 24,
    });

    const periods = distributions.map((d) => {
      const periodLabel = `${d.earningPeriod.periodStart.toISOString().slice(0, 7)}`;
      const grossReport = d.earningPeriod.reports[0]?.grossRevenue;
      const gross = grossReport
        ? formatUsdt(grossReport)
        : formatUsdt(d.totalDistributable);
      const paidAt =
        d.earningPeriod.status === EarningPeriodStatus.DISTRIBUTED
          ? d.updatedAt.toISOString()
          : null;
      return {
        period: periodLabel,
        gross,
        poolShare: holderPoolPct,
        distribution: formatUsdt(d.totalDistributable),
        perUnit: `${decToMoney(d.perUnitAmount)} USDT`,
        toHolders: formatUsdt(d.holdersTotalPaid.gt(0) ? d.holdersTotalPaid : d.totalDistributable),
        status: d.earningPeriod.status,
        paidAt,
      };
    });

    const totalDistributed = distributions.reduce(
      (acc, d) => acc.plus(d.totalDistributable),
      new Prisma.Decimal(0),
    );

    let userPayouts: UserAnalyticsPayoutsDto['userPayouts'] = [];
    if (userId) {
      const rows = await this.prisma.payout.findMany({
        where: { userId, releaseId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      userPayouts = rows.map((p) => ({
        id: p.id,
        amountNet: decToMoney(p.amountNet),
        status: p.status,
        unitsEligible: p.unitsEligible.toString(),
        createdAt: p.createdAt.toISOString(),
      }));
    }

    return {
      periods,
      userPayouts,
      totalDistributedUsdt: decToMoney(totalDistributed),
    };
  }

  async getMarket(releaseKey: string): Promise<UserAnalyticsMarketDto> {
    const releaseId = await this.resolve.resolveReleaseId(releaseKey);
    await this.resolve.assertPublicRelease(releaseId);
    const release = await this.resolve.loadRelease(releaseId);
    const ctxMap = await this.enrichment.loadByReleaseIds([releaseId]);
    const ctx = ctxMap.get(releaseId) ?? {
      bestBid: null,
      bestAsk: null,
      volume24hUsdt: '0',
      change7dPct: '0,0',
      deals7d: 0,
      liquidity: 'thin',
    };

    const [activeListings, trades7d] = await Promise.all([
      this.prisma.marketListing.count({
        where: {
          releaseId,
          deletedAt: null,
          status: 'ACTIVE',
          unitsAvailable: { gt: 0 },
        },
      }),
      this.prisma.trade.count({
        where: {
          releaseId,
          executedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          settlementStatus: TradeSettlementStatus.SETTLED,
        },
      }),
    ]);

    return {
      bestBid: ctx.bestBid,
      bestAsk: ctx.bestAsk,
      volume24hUsdt: ctx.volume24hUsdt,
      change7dPct: ctx.change7dPct,
      deals7d: ctx.deals7d,
      liquidity: ctx.liquidity,
      activeListings,
      rows: release.secondaryEnabled
        ? [
            { label: 'Активные лоты', value: String(activeListings) },
            { label: 'Сделок за 7D', value: String(trades7d) },
            {
              label: 'Лучший ask',
              value: ctx.bestAsk ? `${ctx.bestAsk} USDT` : '—',
            },
            {
              label: 'Лучший bid',
              value: ctx.bestBid ? `${ctx.bestBid} USDT` : '—',
            },
            { label: 'Оборот 24ч', value: `${ctx.volume24hUsdt} USDT` },
            {
              label: 'Ликвидность',
              value:
                ctx.liquidity === 'high'
                  ? 'Deep'
                  : ctx.liquidity === 'med'
                    ? 'Mid'
                    : activeListings > 0
                      ? 'Thin'
                      : '—',
            },
          ]
        : [{ label: 'Статус', value: 'Вторичный рынок пока недоступен' }],
    };
  }

  async getLedger(
    releaseKey: string,
    userId: string,
  ): Promise<UserAnalyticsLedgerDto> {
    if (!userId) {
      throwAdminError(
        'UNAUTHORIZED',
        'Authentication required for personal ledger',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const releaseId = await this.resolve.resolveReleaseId(releaseKey);
    const position = await this.prisma.userPosition.findUnique({
      where: { userId_releaseId: { userId, releaseId } },
    });
    if (!position || !position.unitsTotal.greaterThan(0)) {
      throwAdminError(
        'FORBIDDEN',
        'No position in this release',
        HttpStatus.FORBIDDEN,
      );
    }

    const rows = await this.prisma.ownershipLedger.findMany({
      where: { userId, releaseId },
      orderBy: { happenedAt: 'desc' },
      take: 100,
    });

    return {
      items: rows.map((r) => this.mapLedgerEntry(r)),
    };
  }

  private mapLedgerEntry(row: {
    id: string;
    eventType: OwnershipEventType;
    unitsDelta: Prisma.Decimal;
    pricePerUnit: Prisma.Decimal | null;
    happenedAt: Date;
  }) {
    const tone = this.ledgerTone(row.eventType);
    const title = this.ledgerTitle(row.eventType);
    const sign = row.unitsDelta.greaterThanOrEqualTo(0) ? '+' : '';
    return {
      id: row.id,
      eventType: row.eventType,
      title,
      detail: `${sign}${row.unitsDelta.toString()} UNT`,
      happenedAt: row.happenedAt.toISOString(),
      unitsDelta: row.unitsDelta.toString(),
      pricePerUnit: row.pricePerUnit ? decToMoney(row.pricePerUnit) : null,
      tone,
    };
  }

  private ledgerTone(
    eventType: OwnershipEventType,
  ): 'buy' | 'sell' | 'order' | 'fill' | 'cancel' | 'payout' | 'other' {
    if (eventType === OwnershipEventType.PRIMARY_BUY) return 'buy';
    if (eventType === OwnershipEventType.SECONDARY_BUY) return 'buy';
    if (eventType === OwnershipEventType.SECONDARY_SELL) return 'sell';
    if (eventType === OwnershipEventType.LOCK_FOR_SELL) return 'order';
    if (eventType === OwnershipEventType.UNLOCK_AFTER_CANCEL) return 'cancel';
    if (eventType === OwnershipEventType.PAYOUT_SNAPSHOT) return 'payout';
    return 'other';
  }

  private ledgerTitle(eventType: OwnershipEventType): string {
    switch (eventType) {
      case OwnershipEventType.PRIMARY_BUY:
        return 'Покупка UNT (первичка)';
      case OwnershipEventType.SECONDARY_BUY:
        return 'Покупка UNT (secondary)';
      case OwnershipEventType.SECONDARY_SELL:
        return 'Продажа UNT';
      case OwnershipEventType.LOCK_FOR_SELL:
        return 'Резерв под продажу';
      case OwnershipEventType.UNLOCK_AFTER_CANCEL:
        return 'Снятие резерва';
      case OwnershipEventType.PAYOUT_SNAPSHOT:
        return 'Снимок для выплаты';
      default:
        return 'Операция с units';
    }
  }

  private mapReleaseMeta(release: {
    id: string;
    slug: string;
    symbol: string;
    title: string;
    genre: string | null;
    segment: string | null;
    coverUrl: string | null;
    videoUrl: string | null;
    videoPosterUrl: string | null;
    videoType: string;
    videoStatus: string;
    shortDescription: string | null;
    description: string | null;
    riskDisclosureText: string | null;
    legalDisclaimer: string | null;
    secondaryEnabled: boolean;
    releaseDate: Date | null;
    updatedAt: Date;
    status: ReleaseStatus;
    payoutFrequency: string;
    primaryUnitPrice: Prisma.Decimal;
    totalUnits: Prisma.Decimal;
    unitsAvailablePrimary: Prisma.Decimal;
    minPurchaseUnits: Prisma.Decimal | null;
    maxPurchaseUnits: Prisma.Decimal | null;
    raiseTargetUsdt: Prisma.Decimal | null;
    hardCapUsdt: Prisma.Decimal | null;
    promoBudgetUsdt: Prisma.Decimal | null;
    artistUpfrontUsdt: Prisma.Decimal | null;
    platformUpfrontUsdt: Prisma.Decimal | null;
    holderSharePct: Prisma.Decimal | null;
    artistSharePct: Prisma.Decimal | null;
    platformSharePct: Prisma.Decimal | null;
    releaseArtists: { artist: { name: string } }[];
    primaryRaiseRounds: {
      soldUnits: Prisma.Decimal;
      raisedAmountUsdt: Prisma.Decimal;
      raiseTargetUsdt: Prisma.Decimal;
    }[];
  }): UserAnalyticsReleaseMetaDto {
    const status = mapReleaseStatus(release.status);
    const round = release.primaryRaiseRounds[0];
    const soldUnits = round
      ? round.soldUnits
      : release.totalUnits.minus(release.unitsAvailablePrimary);
    const fillProgress =
      round && round.raiseTargetUsdt.gt(0)
        ? `${Number(round.raisedAmountUsdt.div(round.raiseTargetUsdt).mul(100)).toFixed(1)}%`
        : null;

    return {
      id: release.id,
      slug: release.slug,
      symbol: release.symbol,
      title: release.title,
      artist: artistNames(release.releaseArtists),
      genre: release.genre,
      coverUrl: release.coverUrl,
      description: release.description,
      shortDescription: release.shortDescription,
      status,
      statusLabel:
        status === 'Active'
          ? 'Раунд активен'
          : status === 'Paused'
            ? 'Пауза выплат'
            : 'Раунд закрыт',
      payoutFrequency: release.payoutFrequency,
      primaryUnitPrice: decToMoney(release.primaryUnitPrice),
      totalUnits: release.totalUnits.toString(),
      unitsAvailablePrimary: release.unitsAvailablePrimary.toString(),
      soldUnits: soldUnits.toString(),
      raiseTargetUsdt: release.raiseTargetUsdt
        ? decToMoney(release.raiseTargetUsdt)
        : null,
      hardCapUsdt: release.hardCapUsdt ? decToMoney(release.hardCapUsdt) : null,
      raisedAmountUsdt: round ? decToMoney(round.raisedAmountUsdt) : null,
      fillProgressPct: fillProgress,
      holderSharePct: release.holderSharePct
        ? release.holderSharePct.toString()
        : null,
      artistSharePct: release.artistSharePct
        ? release.artistSharePct.toString()
        : null,
      platformSharePct: release.platformSharePct
        ? release.platformSharePct.toString()
        : null,
      promoBudgetUsdt: release.promoBudgetUsdt
        ? decToMoney(release.promoBudgetUsdt)
        : null,
      artistUpfrontUsdt: release.artistUpfrontUsdt
        ? decToMoney(release.artistUpfrontUsdt)
        : null,
      platformUpfrontUsdt: release.platformUpfrontUsdt
        ? decToMoney(release.platformUpfrontUsdt)
        : null,
      minPurchaseUnits: release.minPurchaseUnits?.toString() ?? null,
      maxPurchaseUnits: release.maxPurchaseUnits?.toString() ?? null,
      videoUrl: release.videoUrl,
      videoPosterUrl: release.videoPosterUrl,
      videoType: release.videoType,
      videoStatus: release.videoStatus,
      riskDisclosureText: release.riskDisclosureText,
      legalDisclaimer: release.legalDisclaimer,
      secondaryEnabled: release.secondaryEnabled,
      releaseDate: release.releaseDate?.toISOString() ?? null,
      updatedAt: release.updatedAt.toISOString(),
    };
  }

  private async loadPublishedFaq(releaseId: string, locale: AppLocale) {
    const releaseItems = await this.prisma.releaseFaqItem.findMany({
      where: { releaseId, locale, isPublished: true },
      orderBy: { sortOrder: 'asc' },
    });
    const items =
      releaseItems.length > 0
        ? releaseItems
        : await this.prisma.releaseFaqItem.findMany({
            where: { releaseId: null, locale, isPublished: true },
            orderBy: { sortOrder: 'asc' },
          });

    return items.map((item) => ({
      question: item.question,
      answer: item.answer,
      order: item.sortOrder,
      locale: item.locale,
      category: item.category,
    }));
  }

  private async computePayoutSummary(releaseId: string) {
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const distributions = await this.prisma.earningDistribution.findMany({
      where: {
        releaseId,
        earningPeriod: {
          status: EarningPeriodStatus.DISTRIBUTED,
        },
      },
      include: { earningPeriod: true },
      orderBy: { createdAt: 'desc' },
    });

    let payouts30d = new Prisma.Decimal(0);
    let payoutsAllTime = new Prisma.Decimal(0);
    for (const d of distributions) {
      payoutsAllTime = payoutsAllTime.plus(d.totalDistributable);
      if (d.createdAt.getTime() >= since30d.getTime()) {
        payouts30d = payouts30d.plus(d.totalDistributable);
      }
    }

    return {
      payouts30d: formatUsdt(payouts30d),
      payoutsAllTime: formatUsdt(payoutsAllTime),
      lastPayoutDate: distributions[0]?.createdAt.toISOString() ?? null,
    };
  }

  private canAccessDocument(
    visibility: ReleaseDocumentVisibility,
    isAuthenticated: boolean,
    isHolder: boolean,
  ): boolean {
    if (visibility === ReleaseDocumentVisibility.PUBLIC) return true;
    if (visibility === ReleaseDocumentVisibility.AUTHENTICATED) return isAuthenticated;
    if (visibility === ReleaseDocumentVisibility.HOLDERS_ONLY) return isHolder;
    return false;
  }

  private riskLabel(status: ReleaseStatus, hasHolding: boolean): string {
    if (!hasHolding) return 'Нет позиции · только публичные данные';
    if (status === ReleaseStatus.PAUSED)
      return 'Пауза выплат · позиция открыта';
    if (status === ReleaseStatus.ACTIVE)
      return 'Активный релиз · позиция открыта';
    return 'Релиз закрыт · позиция на учёте';
  }

  private periodSince(period: UserAnalyticsPeriod): Date | null {
    const now = Date.now();
    switch (period) {
      case '7d':
        return new Date(now - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now - 90 * 24 * 60 * 60 * 1000);
      case 'ytd':
        return new Date(new Date().getFullYear(), 0, 1);
      case 'all':
        return null;
      default:
        return new Date(now - 30 * 24 * 60 * 60 * 1000);
    }
  }
}
