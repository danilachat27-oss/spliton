export const MARKET_LISTING_STATUS_FILTERS = [
  "all",
  "active",
  "purchasable",
  "paused",
  "sold_out",
  "cancelled",
  "expired",
] as const;

export const MARKET_LISTING_SORT_KEYS = [
  "newest",
  "price_asc",
  "price_desc",
  "units_desc",
  "change_desc",
  "availability",
] as const;

export type MarketListingStatusFilter = (typeof MARKET_LISTING_STATUS_FILTERS)[number];
export type MarketListingSortKey = (typeof MARKET_LISTING_SORT_KEYS)[number];

export type MarketListingsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: MarketListingStatusFilter;
  genre?: "all" | "electronic" | "pop" | "hiphop" | "rock";
  liquidity?: "high" | "med" | "low";
  releaseId?: string;
  priceMin?: number;
  priceMax?: number;
  yieldMin?: number;
  yieldMax?: number;
  unitsMin?: number;
  unitsMax?: number;
  sort?: MarketListingSortKey;
};

export type MarketListingsResponse = {
  items: unknown[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export const DEFAULT_MARKET_LISTINGS_QUERY: MarketListingsQuery = {
  page: 1,
  limit: 100,
  status: "purchasable",
  sort: "availability",
};

export function buildMarketListingsQueryParams(
  query: MarketListingsQuery,
): URLSearchParams {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.limit != null) params.set("limit", String(query.limit));
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.status) params.set("status", query.status);
  if (query.genre && query.genre !== "all") params.set("genre", query.genre);
  if (query.liquidity) params.set("liquidity", query.liquidity);
  if (query.releaseId) params.set("releaseId", query.releaseId);
  if (query.priceMin != null) params.set("priceMin", String(query.priceMin));
  if (query.priceMax != null) params.set("priceMax", String(query.priceMax));
  if (query.yieldMin != null) params.set("yieldMin", String(query.yieldMin));
  if (query.yieldMax != null) params.set("yieldMax", String(query.yieldMax));
  if (query.unitsMin != null) params.set("unitsMin", String(query.unitsMin));
  if (query.unitsMax != null) params.set("unitsMax", String(query.unitsMax));
  if (query.sort) params.set("sort", query.sort);
  return params;
}

export function marketListingsQueryKey(query: MarketListingsQuery): string {
  return JSON.stringify(query);
}
