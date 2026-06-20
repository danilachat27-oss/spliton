import { buildReleaseAnalyticsListQuery } from "@/lib/analytics/release-analytics-api-query";
import { parseApiClientError } from "@/lib/api/api-client-error";
import { getPublicApiBaseUrl, isLiveReleaseAnalyticsEnabled } from "@/lib/public-env";
import type { ReleaseAnalyticsPeriod } from "@/types/analytics/releases";
import type {
  ReleaseDetailFullApi,
  ReleaseMyHistoryApi,
  ReleasePriceChartApi,
} from "@/types/analytics/release-detail-api";
import type { ReleaseAnalyticsListQueryParams } from "@/lib/analytics/release-analytics-api-query";

export { isLiveReleaseAnalyticsEnabled };

export const RELEASE_ANALYTICS_API = {
  list: "/api/v1/analytics/releases",
  table: "/api/v1/analytics/releases/table",
  overview: "/api/v1/analytics/releases/overview",
  timeseries: "/api/v1/analytics/releases/timeseries",
  compare: "/api/v1/analytics/releases/compare",
  genres: "/api/v1/analytics/releases/genres",
  funnel: "/api/v1/analytics/releases/funnel",
  release: (id: string) => `/api/v1/analytics/releases/${id}`,
  performance: (id: string) => `/api/v1/analytics/releases/${id}/performance`,
  payouts: (id: string) => `/api/v1/analytics/releases/${id}/payouts`,
  market: (id: string) => `/api/v1/analytics/releases/${id}/market`,
  ledger: (id: string) => `/api/v1/analytics/releases/${id}/ledger`,
  /** Unified release detail (preferred in live mode). */
  fullDetail: (id: string) => `/api/v1/releases/${id}/detail`,
  priceChart: (id: string, period = "30d") =>
    `/api/v1/releases/${id}/charts/price?period=${period}`,
  myHistory: (id: string) => `/api/v1/releases/${id}/my-history`,
} as const;

type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>;

function url(path: string): string {
  return `${getPublicApiBaseUrl()}${path}`;
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw await parseApiClientError(res);
  return res.json() as Promise<T>;
}

export type ReleaseAnalyticsPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
};

export type ReleaseAnalyticsYieldDynamicsPoint = {
  date: string;
  averageYieldPct: number;
  topYieldPct?: number;
  medianYieldPct?: number;
};

export type ReleaseAnalyticsOverviewApi = {
  period: ReleaseAnalyticsPeriod;
  updatedAt: string;
  kpis: {
    totalReleases?: number;
    averageYieldPct: number | null;
    activeReleases: number;
    payoutsReleases?: number;
    primaryVolumeUsdt?: string;
    totalPayoutsUsdt: string;
    payoutLagDaysMin: number | null;
    payoutLagDaysMax: number | null;
    totalUnits?: string;
    totalHolders?: number;
    secondaryVolumeUsdt?: string;
    activeSecondaryListings?: number;
    avgProgressPct?: number | null;
    avgLiquidityScore?: number | null;
    topReleaseByVolume?: { id: string; title: string; symbol: string; volumeUsdt: string } | null;
    topReleaseByPayouts?: { id: string; title: string; symbol: string; payoutsUsdt: string } | null;
  };
  yieldDynamics: ReleaseAnalyticsYieldDynamicsPoint[];
  payoutDynamics?: { date: string; payoutsUsdt: string; distributionsCount: number }[];
  genreDistribution?: {
    genre: string;
    count: number;
    averageYieldPct: number | null;
    volumeUsdt?: string;
    avgProgressPct?: number | null;
  }[];
};

export type ReleaseAnalyticsTimeseriesApi = {
  period: ReleaseAnalyticsPeriod;
  updatedAt: string;
  primaryVolume: { date: string; volumeUsdt: string; ordersCount: number }[];
  secondaryVolume: {
    date: string;
    volumeUsdt: string;
    tradesCount: number;
    avgPriceUsdt: string | null;
  }[];
  payouts: { date: string; payoutsUsdt: string; distributionsCount: number }[];
};

export type ReleaseAnalyticsCompareApi = {
  period: ReleaseAnalyticsPeriod;
  updatedAt: string;
  items: {
    id: string;
    symbol: string;
    title: string;
    artist: string;
    raisedUsdt: string;
    soldUnits: string;
    holdersCount: number;
    secondaryVolumeUsdt: string;
    payoutsUsdt: string;
    liquidityScore: number;
    progressPct: number;
  }[];
};

export type ReleaseAnalyticsGenresApi = {
  period: ReleaseAnalyticsPeriod;
  updatedAt: string;
  items: {
    genre: string;
    count: number;
    volumeUsdt: string;
    averageYieldPct: number | null;
    avgProgressPct: number | null;
  }[];
};

export type ReleaseAnalyticsFunnelApi = {
  period: ReleaseAnalyticsPeriod;
  updatedAt: string;
  steps: {
    createdReleases: number;
    activeRounds: number;
    soldUnits: string;
    holders: number;
    payoutsReleases: number;
    secondaryListings: number;
    secondaryTrades: number;
  };
};

export type ReleaseAnalyticsListApi = {
  items: {
    id: string;
    slug: string;
    symbol: string;
    release: string;
    artist: string;
    genre: string;
    yieldPct: string;
    changePct: string;
    payouts: string;
    units: string;
    status: "Active" | "Paused" | "Closed";
    trend: "up" | "down" | "flat";
    sparkline: number[];
    payoutBand: { lo: string; hi: string; t: number };
    userUnits?: string;
    userValueUsdt?: string;
    userPnlUsdt?: string;
    userPnlPct?: string;
    soldUnits?: string;
    availableUnits?: string;
    pricePerUnitUsdt?: string;
    raisedUsdt?: string;
    targetUsdt?: string;
    progressPercent?: number;
    holdersCount?: number;
    secondaryListingsCount?: number;
    secondaryVolumeUsdt?: string;
    liquidityPercent?: number;
    lastTradePrice?: string | null;
    updatedAt?: string;
  }[];
  pagination: ReleaseAnalyticsPagination;
  stats: { avgYieldPct: string | null; activeCount: number | null; payoutsTotalUsdt: string | null };
  filters?: {
    genres: { name: string; count: number }[];
    statuses: { key: string; label: string; count: number }[];
  };
  updatedAt?: string;
};

export async function fetchReleaseAnalyticsTimeseries(
  period: ReleaseAnalyticsPeriod = "30d",
): Promise<ReleaseAnalyticsTimeseriesApi> {
  const qs = new URLSearchParams({ period }).toString();
  const res = await fetch(url(`${RELEASE_ANALYTICS_API.timeseries}?${qs}`), {
    credentials: "include",
    cache: "no-store",
  });
  return parseJson(res);
}

export async function fetchReleaseAnalyticsCompare(
  period: ReleaseAnalyticsPeriod = "30d",
  limit = 8,
): Promise<ReleaseAnalyticsCompareApi> {
  const qs = new URLSearchParams({ period, limit: String(limit) }).toString();
  const res = await fetch(url(`${RELEASE_ANALYTICS_API.compare}?${qs}`), {
    credentials: "include",
    cache: "no-store",
  });
  return parseJson(res);
}

export async function fetchReleaseAnalyticsGenres(
  period: ReleaseAnalyticsPeriod = "30d",
): Promise<ReleaseAnalyticsGenresApi> {
  const qs = new URLSearchParams({ period }).toString();
  const res = await fetch(url(`${RELEASE_ANALYTICS_API.genres}?${qs}`), {
    credentials: "include",
    cache: "no-store",
  });
  return parseJson(res);
}

export async function fetchReleaseAnalyticsFunnel(
  period: ReleaseAnalyticsPeriod = "30d",
): Promise<ReleaseAnalyticsFunnelApi> {
  const qs = new URLSearchParams({ period }).toString();
  const res = await fetch(url(`${RELEASE_ANALYTICS_API.funnel}?${qs}`), {
    credentials: "include",
    cache: "no-store",
  });
  return parseJson(res);
}

export async function fetchReleaseAnalyticsOverview(
  period: ReleaseAnalyticsPeriod = "30d",
): Promise<ReleaseAnalyticsOverviewApi> {
  const qs = new URLSearchParams({ period }).toString();
  const res = await fetch(url(`${RELEASE_ANALYTICS_API.overview}?${qs}`), {
    credentials: "include",
    cache: "no-store",
  });
  return parseJson(res);
}

export async function fetchReleaseAnalyticsList(
  query?: ReleaseAnalyticsListQueryParams,
  authorizedFetch?: AuthorizedFetch,
): Promise<ReleaseAnalyticsListApi> {
  const params = buildReleaseAnalyticsListQuery(query ?? {});
  const qs = new URLSearchParams(params).toString();
  const path = `${RELEASE_ANALYTICS_API.list}?${qs}`;
  const res = authorizedFetch
    ? await authorizedFetch(url(path))
    : await fetch(url(path), { credentials: "include", cache: "no-store" });
  return parseJson(res);
}

export async function fetchReleaseFullDetail(
  id: string,
  authorizedFetch?: AuthorizedFetch,
  locale = "ru",
): Promise<ReleaseDetailFullApi> {
  const path = `${RELEASE_ANALYTICS_API.fullDetail(id)}?locale=${locale}`;
  const res = authorizedFetch
    ? await authorizedFetch(url(path))
    : await fetch(url(path), { credentials: "include" });
  return parseJson(res);
}

export async function fetchReleasePriceChart(
  id: string,
  period = "30d",
  authorizedFetch?: AuthorizedFetch,
): Promise<ReleasePriceChartApi> {
  const path = RELEASE_ANALYTICS_API.priceChart(id, period);
  const res = authorizedFetch
    ? await authorizedFetch(url(path))
    : await fetch(url(path), { credentials: "include" });
  return parseJson(res);
}

export async function fetchReleaseMyHistory(
  id: string,
  authorizedFetch: AuthorizedFetch,
): Promise<ReleaseMyHistoryApi> {
  const res = await authorizedFetch(url(RELEASE_ANALYTICS_API.myHistory(id)));
  return parseJson(res);
}

export async function fetchReleaseAnalyticsDetail(
  id: string,
  authorizedFetch?: AuthorizedFetch,
): Promise<unknown> {
  const res = authorizedFetch
    ? await authorizedFetch(url(RELEASE_ANALYTICS_API.release(id)))
    : await fetch(url(RELEASE_ANALYTICS_API.release(id)), { credentials: "include" });
  return parseJson(res);
}

export async function fetchReleaseAnalyticsPerformance(
  id: string,
  period = "30d",
  authorizedFetch?: AuthorizedFetch,
): Promise<unknown> {
  const path = `${RELEASE_ANALYTICS_API.performance(id)}?period=${period}`;
  const res = authorizedFetch
    ? await authorizedFetch(url(path))
    : await fetch(url(path), { credentials: "include" });
  return parseJson(res);
}

export async function fetchReleaseAnalyticsPayouts(
  id: string,
  authorizedFetch?: AuthorizedFetch,
): Promise<unknown> {
  const res = authorizedFetch
    ? await authorizedFetch(url(RELEASE_ANALYTICS_API.payouts(id)))
    : await fetch(url(RELEASE_ANALYTICS_API.payouts(id)), { credentials: "include" });
  return parseJson(res);
}

export async function fetchReleaseAnalyticsMarket(id: string): Promise<unknown> {
  const res = await fetch(url(RELEASE_ANALYTICS_API.market(id)), {
    credentials: "include",
  });
  return parseJson(res);
}

export type ReleaseAnalyticsLedgerApi = {
  items: {
    id: string;
    eventType: string;
    title: string;
    detail: string;
    happenedAt: string;
    unitsDelta: string;
    pricePerUnit: string | null;
    tone: "buy" | "sell" | "order" | "fill" | "cancel" | "payout" | "other";
  }[];
};

export async function fetchReleaseAnalyticsLedger(
  id: string,
  authorizedFetch: AuthorizedFetch,
): Promise<ReleaseAnalyticsLedgerApi> {
  const res = await authorizedFetch(url(RELEASE_ANALYTICS_API.ledger(id)));
  return parseJson(res);
}
