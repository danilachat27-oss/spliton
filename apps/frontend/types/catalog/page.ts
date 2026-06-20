/** Вид сетки: крупные карточки или список. */
export type CatalogGridView = "grid" | "list";

/** Первичный раунд / вторичка / всё. */
export type CatalogKindFilter = "all" | "funding" | "market";

/** Фаза раунда (только для funding; при «Вторичка» не используется). */
export type CatalogFundingPhase = "all" | "open" | "payouts";

export type CatalogSortKey =
  | "catalog_order"
  | "title_asc"
  | "progress_desc"
  | "yield_desc"
  | "liquidity_desc"
  | "volume24h_desc"
  | "price_asc"
  | "price_desc"
  | "newest";

export type CatalogPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
};

export type CatalogStats = {
  publicReleases: number;
  livePrimaryRounds: number;
  activeSecondaryListings: number;
  totalRaisedUsdt?: number | string;
  totalVolume24hUsdt?: number | string;
  totalVolume7dUsdt?: number | string;
  avgExpectedYieldPct?: number | string;
  updatedAt: string;
};

export type CatalogSearchSuggestionItem = {
  type: "release" | "artist" | "genre" | "symbol";
  label: string;
  value: string;
  subtitle?: string | null;
  releaseId?: string | null;
  slug?: string | null;
  score?: number;
  purchaseState?: "available" | "sold_out" | "paused" | "unavailable";
  canPurchase?: boolean;
};

export type CatalogGenreFilter = {
  name: string;
  count: number;
};
