import type { MarketListingSortKey, MarketListingStatusFilter } from "@/lib/secondary-market/market-listings-query";

export type MarketTabSegment = "all" | "electronic" | "pop" | "hiphop" | "rock" | "liquid";

export type MarketTabFiltersState = {
  search: string;
  segment: MarketTabSegment;
  status: MarketListingStatusFilter;
  sort: MarketListingSortKey;
  priceMin: string;
  priceMax: string;
  yieldMin: string;
  yieldMax: string;
  unitsMin: string;
  unitsMax: string;
};

export const DEFAULT_MARKET_TAB_FILTERS: MarketTabFiltersState = {
  search: "",
  segment: "all",
  status: "purchasable",
  sort: "availability",
  priceMin: "",
  priceMax: "",
  yieldMin: "",
  yieldMax: "",
  unitsMin: "",
  unitsMax: "",
};

function parseOptionalNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

export function marketTabFiltersToApiQuery(
  filters: MarketTabFiltersState,
  debouncedSearch: string,
) {
  const genre =
    filters.segment === "liquid" || filters.segment === "all"
      ? undefined
      : filters.segment;
  const liquidity = filters.segment === "liquid" ? ("high" as const) : undefined;

  return {
    page: 1,
    limit: 100,
    search: debouncedSearch.trim() || undefined,
    status: filters.status,
    genre,
    liquidity,
    sort: filters.sort,
    priceMin: parseOptionalNumber(filters.priceMin),
    priceMax: parseOptionalNumber(filters.priceMax),
    yieldMin: parseOptionalNumber(filters.yieldMin),
    yieldMax: parseOptionalNumber(filters.yieldMax),
    unitsMin: parseOptionalNumber(filters.unitsMin),
    unitsMax: parseOptionalNumber(filters.unitsMax),
  };
}

export function countActiveMarketTabFilters(filters: MarketTabFiltersState): number {
  let count = 0;
  if (filters.status !== DEFAULT_MARKET_TAB_FILTERS.status) count += 1;
  if (filters.sort !== DEFAULT_MARKET_TAB_FILTERS.sort) count += 1;
  if (filters.segment !== "all") count += 1;
  if (filters.priceMin.trim()) count += 1;
  if (filters.priceMax.trim()) count += 1;
  if (filters.yieldMin.trim()) count += 1;
  if (filters.yieldMax.trim()) count += 1;
  if (filters.unitsMin.trim()) count += 1;
  if (filters.unitsMax.trim()) count += 1;
  return count;
}
