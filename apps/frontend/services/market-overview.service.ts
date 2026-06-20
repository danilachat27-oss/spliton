import {
  buildMarketOverviewListQuery,
  type MarketOverviewListQueryParams,
} from "@/lib/market-overview/market-overview-api-query";
import { parseApiClientError } from "@/lib/api/api-client-error";
import { getPublicApiBaseUrl, isLiveMarketOverviewEnabled } from "@/lib/public-env";

export { isLiveMarketOverviewEnabled };

export const MARKET_OVERVIEW_API = {
  list: "/api/v1/market/overview",
  releases: "/api/v1/market/overview/releases",
  summary: "/api/v1/market/overview/summary",
  stats: "/api/v1/market/overview/stats",
  timeseries: "/api/v1/market/overview/timeseries",
  charts: "/api/v1/market/overview/charts",
  topReleases: "/api/v1/market/overview/top-releases",
  listings: "/api/v1/market/overview/listings",
  trades: "/api/v1/market/overview/trades",
  depth: "/api/v1/market/overview/depth",
  priceHistory: "/api/v1/market/overview/price-history",
  release: (id: string) => `/api/v1/market/overview/${encodeURIComponent(id)}`,
} as const;

export type MarketOverviewPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
};

export type MarketOverviewGenreDistribution = {
  name: string;
  count: number;
  volumeUsdt: string;
};

export type MarketOverviewLabelCount = {
  label: string;
  count: number;
};

export type MarketOverviewTopReleaseRow = {
  id: string;
  symbol: string;
  title: string;
  artist: string;
  value: string;
};

export type MarketOverviewStatsApi = {
  updatedAt: string;
  period: string;
  totals: {
    publicReleases: number;
    activePrimaryRounds: number;
    activeSecondaryListings: number;
    totalRaisedUsdt: string;
    totalVolumeUsdt: string;
    totalVolume24hUsdt: string;
    totalVolume7dUsdt: string;
    totalVolume30dUsdt: string;
    averageExpectedYieldPct: number | null;
    averageLiquidityScore: number | null;
    tradesCount: number;
    holdersCount: number;
  };
  primaryMarket: {
    activeRounds: number;
    raisedUsdt: string;
    availableUnits: string;
    averageProgressPct: number | null;
  };
  secondaryMarket: {
    activeListings: number;
    volumeUsdt: string;
    volume24hUsdt: string;
    volume7dUsdt: string;
    volume30dUsdt: string;
    tradesCount: number;
    bestAskMin: string | null;
    lastTradePriceAvg: string | null;
    averageSpreadPct: string | null;
    averageLiquidityScore: number | null;
  };
  distributions: {
    genres: MarketOverviewGenreDistribution[];
    liquidity: MarketOverviewLabelCount[];
    statuses: MarketOverviewLabelCount[];
  };
  topReleases: {
    byVolume: MarketOverviewTopReleaseRow[];
    byYield: MarketOverviewTopReleaseRow[];
    byLiquidity: MarketOverviewTopReleaseRow[];
    byProgress: MarketOverviewTopReleaseRow[];
  };
};

export type MarketOverviewChartPoint = {
  ts: string;
  value: string | number;
};

export type MarketOverviewChartsApi = {
  period: string;
  updatedAt: string;
  series: {
    volume: MarketOverviewChartPoint[];
    secondaryVolume: MarketOverviewChartPoint[];
    tradesCount: MarketOverviewChartPoint[];
    activeListings: MarketOverviewChartPoint[];
    raised: MarketOverviewChartPoint[];
    avgYield: MarketOverviewChartPoint[];
    liquidity: MarketOverviewChartPoint[];
  };
};

export type MarketOverviewListApi = {
  items: MarketOverviewListItemApi[];
  pagination: MarketOverviewPagination;
  stats: MarketOverviewStatsApi;
  updatedAt: string;
  aggregate: {
    activeReleases: number;
    avgYieldPct: string;
    totalVolume24hUsdt: string;
  };
};

export type MarketOverviewListItemApi = {
  id: string;
  slug: string;
  symbol: string;
  title: string;
  artist: string;
  genre: string;
  segment: string;
  lastPriceUsdt: string;
  volume24hUsdt: string | { toString?: () => string };
  volume7dUsdt: string;
  volume30dUsdt?: string;
  change24hPct: string;
  change7dPct: string;
  liquidity: "high" | "med" | "low";
  liquidityLabel: string;
  liquidityScore?: number | null;
  spread: string;
  spreadPercent?: string | null;
  activeListings: number;
  tradesCount?: number;
  yieldPct: number;
  payoutsUsdt: number;
  activityScore: number;
  availableUnits: string;
  primaryUnitPriceUsdt: string;
  secondaryLabel: string;
  trend: "up" | "down" | "flat";
  sparkline: number[];
  status: string;
  statusKey: string;
  payoutFreq: "monthly" | "biweekly";
  categories: string[];
  riskStatus: string;
  updatedAt?: string;
};

export type MarketOverviewListingApi = {
  id: string;
  releaseId: string;
  releaseSlug: string;
  releaseTitle: string;
  releaseSymbol: string;
  artist: string;
  genre: string;
  units: string;
  pricePerUnitUsdt: string;
  totalUsdt: string;
  status: string;
  availableUnits: string;
  buyable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MarketOverviewTradeApi = {
  id: string;
  releaseId: string;
  releaseSlug: string;
  releaseTitle: string;
  releaseSymbol: string;
  artist: string;
  units: string;
  pricePerUnitUsdt: string;
  totalUsdt: string;
  settlementStatus: string;
  executedAt: string;
};

export type MarketOverviewDepthApi = {
  period: string;
  updatedAt: string;
  activeListings: number;
  askDepthUnits: string;
  bidDepthUnits: string;
  bestAskTotal: string | null;
  bestBidTotal: string | null;
  averageSpreadPct: string | null;
  tradesCount24h: number;
  tradesCount7d: number;
  volume24hUsdt: string | null;
  releasesWithActiveMarket: number;
};

export type MarketOverviewFeedResponse<T> = {
  items: T[];
  pagination: MarketOverviewPagination;
  updatedAt: string;
};

export type MarketOverviewDetailApi = {
  release: {
    id: string;
    slug: string;
    symbol: string;
    title: string;
    artist: string;
    genre: string;
    segment: string | null;
    status: string;
    statusLabel: string;
    payoutFrequency: "monthly" | "biweekly";
    primaryUnitPrice: string;
    totalUnits: string;
    unitsAvailablePrimary: string;
    coverUrl: string | null;
    description: string | null;
    raiseTargetUsdt: string | null;
    hardCapUsdt: string | null;
    holderSharePct: string | null;
    artistSharePct: string | null;
    platformSharePct: string | null;
  };
  overview: MarketOverviewListItemApi;
  market: {
    lastPrice: string;
    volume24hUsdt: string;
    volume7dUsdt: string;
    change24hPct: string;
    change7dPct: string;
    liquidity: string;
    liquidityLabel: string;
    spread: string;
    bestBid: string | null;
    bestAsk: string | null;
    activeListings: number;
    deals7d: number;
  };
  priceHistory: {
    bucket: string;
    period: string;
    points: {
      ts: string;
      open: string;
      high: string;
      low: string;
      close: string;
      volumeUnits: string;
      volumeNotional: string;
    }[];
  };
  volumeHistory: {
    period: string;
    points: { ts: string; volumeUsdt: string }[];
  };
  recentTrades: {
    id: string;
    price: string;
    units: string;
    grossAmount: string;
    executedAt: string;
  }[];
  depthSummary: {
    bestBid: string | null;
    bestAsk: string | null;
    spread: string;
    bidDepthUnits: string;
    askDepthUnits: string;
    topAsks: { price: string; units: string }[];
  };
  riskNotes: string[];
};

export type MarketOverviewQueryParams = MarketOverviewListQueryParams;

function url(path: string, params?: Record<string, string>): string {
  const base = `${getPublicApiBaseUrl()}${path}`;
  if (!params) return base;
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && value !== "all") q.set(key, value);
  }
  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw await parseApiClientError(res);
  return res.json() as Promise<T>;
}

const fetchOpts: RequestInit = {
  credentials: "omit",
  cache: "no-store",
};

export async function fetchMarketOverviewList(
  params?: MarketOverviewQueryParams,
): Promise<MarketOverviewListApi> {
  const query = buildMarketOverviewListQuery(params ?? {});
  const res = await fetch(url(MARKET_OVERVIEW_API.list, query), fetchOpts);
  const body = await parseJson<MarketOverviewListApi & { pagination?: MarketOverviewPagination }>(res);
  const pagination =
    body.pagination ??
    ({
      page: Number(query.page) || 1,
      pageSize: Number(query.pageSize) || 24,
      total: body.items?.length ?? 0,
      totalPages: 1,
      hasNextPage: false,
    } satisfies MarketOverviewPagination);
  return { ...body, pagination };
}

export async function fetchMarketOverviewStats(
  period = "7d",
): Promise<MarketOverviewStatsApi> {
  const res = await fetch(
    url(MARKET_OVERVIEW_API.stats, { period }),
    fetchOpts,
  );
  return parseJson(res);
}

export async function fetchMarketOverviewCharts(
  period = "30d",
): Promise<MarketOverviewChartsApi> {
  const res = await fetch(
    url(MARKET_OVERVIEW_API.charts, { period }),
    fetchOpts,
  );
  return parseJson(res);
}

export async function fetchMarketOverviewDetail(
  releaseId: string,
  params?: Pick<MarketOverviewQueryParams, "period">,
): Promise<MarketOverviewDetailApi> {
  const query: Record<string, string> = {};
  if (params?.period) query.period = params.period;
  const res = await fetch(url(MARKET_OVERVIEW_API.release(releaseId), query), fetchOpts);
  return parseJson(res);
}

export async function fetchMarketOverviewListings(
  params?: Record<string, string>,
): Promise<MarketOverviewFeedResponse<MarketOverviewListingApi>> {
  const res = await fetch(url(MARKET_OVERVIEW_API.listings, params), fetchOpts);
  return parseJson(res);
}

export async function fetchMarketOverviewTopReleases(
  params?: { period?: string; sort?: string; limit?: number },
): Promise<{
  period: string;
  sort: string;
  items: MarketOverviewTopReleaseRow[];
  updatedAt?: string;
}> {
  const query: Record<string, string> = {
    period: params?.period ?? "7d",
    sort: params?.sort ?? "volume",
    limit: String(params?.limit ?? 7),
  };
  const res = await fetch(url(MARKET_OVERVIEW_API.topReleases, query), fetchOpts);
  return parseJson(res);
}

export async function fetchMarketOverviewTrades(
  params?: Record<string, string>,
): Promise<MarketOverviewFeedResponse<MarketOverviewTradeApi>> {
  const res = await fetch(url(MARKET_OVERVIEW_API.trades, params), fetchOpts);
  return parseJson(res);
}

export async function fetchMarketOverviewDepth(
  period = "7d",
): Promise<MarketOverviewDepthApi> {
  const res = await fetch(url(MARKET_OVERVIEW_API.depth, { period }), fetchOpts);
  return parseJson(res);
}
