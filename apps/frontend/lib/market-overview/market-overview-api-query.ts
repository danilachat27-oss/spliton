import type {
  MarketOverviewCategory,
  MarketOverviewPeriod,
  MarketTableSortKey,
} from "@/types/market-overview";

export type MarketOverviewListQueryParams = {
  period?: MarketOverviewPeriod;
  search?: string;
  category?: MarketOverviewCategory;
  genre?: string;
  status?: string;
  payoutFreq?: string;
  liquidity?: string;
  yield?: string;
  availability?: string;
  sort?: MarketTableSortKey;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  release?: string;
};

const PERIODS: MarketOverviewPeriod[] = ["24h", "7d", "30d", "90d"];
const CATEGORIES: MarketOverviewCategory[] = [
  "all",
  "new",
  "yield",
  "stable",
  "demand",
  "secondary",
  "premium",
  "archive",
];
const SORT_KEYS: MarketTableSortKey[] = ["yield", "payouts", "activity", "units"];

export function buildMarketOverviewListQuery(
  params: MarketOverviewListQueryParams,
): Record<string, string> {
  const q: Record<string, string> = {
    period: params.period ?? "7d",
    category: params.category ?? "all",
    sort: params.sort ?? "activity",
    sortDir: params.sortDir ?? "desc",
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 24),
  };

  const search = params.search?.trim();
  if (search) q.search = search;

  if (params.genre && params.genre !== "all") q.genre = params.genre;
  if (params.status && params.status !== "all") q.status = params.status;
  if (params.payoutFreq && params.payoutFreq !== "all") q.payoutFreq = params.payoutFreq;
  if (params.liquidity && params.liquidity !== "all") q.liquidity = params.liquidity;
  if (params.yield && params.yield !== "all") q.yield = params.yield;
  if (params.availability && params.availability !== "all") q.availability = params.availability;

  return q;
}

export const MARKET_OVERVIEW_URL_KEYS = [
  "period",
  "search",
  "category",
  "genre",
  "status",
  "payoutFreq",
  "liquidity",
  "yield",
  "availability",
  "sort",
  "sortDir",
  "page",
  "release",
] as const;

export function parseMarketOverviewSearchParams(
  params: URLSearchParams,
): Partial<MarketOverviewListQueryParams> {
  const periodRaw = params.get("period");
  const period = PERIODS.includes(periodRaw as MarketOverviewPeriod)
    ? (periodRaw as MarketOverviewPeriod)
    : undefined;

  const categoryRaw = params.get("category");
  const category = CATEGORIES.includes(categoryRaw as MarketOverviewCategory)
    ? (categoryRaw as MarketOverviewCategory)
    : undefined;

  const sortRaw = params.get("sort");
  const sort = SORT_KEYS.includes(sortRaw as MarketTableSortKey)
    ? (sortRaw as MarketTableSortKey)
    : undefined;

  const sortDirRaw = params.get("sortDir");
  const sortDir =
    sortDirRaw === "asc" || sortDirRaw === "desc" ? sortDirRaw : undefined;

  const pageRaw = params.get("page");
  const page = pageRaw ? Number.parseInt(pageRaw, 10) : undefined;

  return {
    period,
    search: params.get("search") ?? undefined,
    category,
    genre: params.get("genre") ?? undefined,
    status: params.get("status") ?? undefined,
    payoutFreq: params.get("payoutFreq") ?? undefined,
    liquidity: params.get("liquidity") ?? undefined,
    yield: params.get("yield") ?? undefined,
    availability: params.get("availability") ?? undefined,
    sort,
    sortDir,
    page: Number.isFinite(page) && page! > 0 ? page : undefined,
    release: params.get("release") ?? undefined,
  };
}

export function buildMarketOverviewUrlSearchParams(
  params: MarketOverviewListQueryParams,
): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.period && params.period !== "7d") sp.set("period", params.period);
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.category && params.category !== "all") sp.set("category", params.category);
  if (params.genre && params.genre !== "all") sp.set("genre", params.genre);
  if (params.status && params.status !== "all") sp.set("status", params.status);
  if (params.payoutFreq && params.payoutFreq !== "all") sp.set("payoutFreq", params.payoutFreq);
  if (params.liquidity && params.liquidity !== "all") sp.set("liquidity", params.liquidity);
  if (params.yield && params.yield !== "all") sp.set("yield", params.yield);
  if (params.availability && params.availability !== "all") sp.set("availability", params.availability);
  if (params.sort && params.sort !== "activity") sp.set("sort", params.sort);
  if (params.sortDir && params.sortDir !== "desc") sp.set("sortDir", params.sortDir);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.release?.trim()) sp.set("release", params.release.trim());
  return sp;
}
