import type { TtlCacheGetOrSetOptions } from './ttl-cache.service';

/** In-memory TTL cache durations (milliseconds). */
export const CACHE_TTL_MS = {
  publicCatalog: 60_000,
  marketOverview: 60_000,
  marketOverviewStats: 60_000,
  marketOverviewCharts: 60_000,
  analyticsReleasesOverview: 45_000,
  publicNewsList: 60_000,
  publicHelpCenter: 60_000,
  publicSystemStatus: 30_000,
  publicPlatformFees: 60_000,
  servicesCalculatorConfig: 60_000,
  adminAnalyticsSnapshot: 45_000,
  adminReferenceDictionary: 60_000,
  secondaryMarketContext: 45_000,
} as const;

const DEFAULT_MARKET_OVERVIEW_STALE_TTL_MS = 300_000;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** Fresh + stale TTL for public market overview snapshots (env-overridable). */
export function resolveMarketOverviewCacheTtl(
  freshDefaultMs: number = CACHE_TTL_MS.marketOverviewStats,
): { ttlMs: number; staleTtlMs: number } & TtlCacheGetOrSetOptions {
  const ttlMs = parsePositiveInt(
    process.env.MARKET_OVERVIEW_CACHE_TTL_MS,
    freshDefaultMs,
  );
  const staleTtlMs = parsePositiveInt(
    process.env.MARKET_OVERVIEW_STALE_TTL_MS,
    DEFAULT_MARKET_OVERVIEW_STALE_TTL_MS,
  );
  return { ttlMs, staleTtlMs };
}
