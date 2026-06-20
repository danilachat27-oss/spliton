export type WatchlistLiquidity = "high" | "med" | "low";

export type WatchlistItem = {
  id: string;
  bookMarketId: string | null;
  symbol: string;
  track: string;
  artist: string;
  releaseId: string;
  /** UUID для live API add — опционально в демо. */
  releaseUuid?: string;
  pricePerUnit: number;
  change24hPct: number;
  listingsCount: number;
  unitsInBook: number;
  deals24h: number;
  liquidity: WatchlistLiquidity;
  spark: number[];
};

export type WatchlistFiltersState = {
  query: string;
  segment: "all" | "liquid" | "active";
  sort: "name" | "change" | "activity" | "price";
  sortDir: "asc" | "desc";
  liquidity: "all" | WatchlistLiquidity;
};

export const DEFAULT_WATCHLIST_FILTERS: WatchlistFiltersState = {
  query: "",
  segment: "all",
  sort: "activity",
  sortDir: "desc",
  liquidity: "all",
};

export type WatchlistAddCandidate = {
  releaseId: string;
  releaseUuid?: string;
  symbol: string;
  track: string;
  artist: string;
  pricePerUnit: number;
  liquidity: WatchlistLiquidity;
};
