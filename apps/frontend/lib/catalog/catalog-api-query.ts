import { validateNumericRange } from "@/lib/catalog/catalog-filter";
import type { CatalogFundingPhase, CatalogKindFilter, CatalogSortKey } from "@/types/catalog/page";

export type CatalogListQueryParams = {
  search?: string;
  genre?: string;
  kind?: CatalogKindFilter;
  phase?: CatalogFundingPhase;
  sort?: CatalogSortKey;
  minPrice?: string;
  maxPrice?: string;
  minProgress?: string;
  minYield?: string;
  minLiquidity?: string;
  page?: number;
  pageSize?: number;
};

function parseOptionalNumber(raw: string): number | undefined {
  const normalized = raw.replace(/\s/g, "").replace(",", ".").trim();
  if (!normalized) return undefined;
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : undefined;
}

export function mapCatalogSortToApi(sort: CatalogSortKey): string {
  switch (sort) {
    case "yield_desc":
      return "yield_desc";
    case "progress_desc":
      return "progress_desc";
    case "title_asc":
      return "title_asc";
    case "liquidity_desc":
      return "liquidity_desc";
    case "volume24h_desc":
      return "volume24h_desc";
    case "price_asc":
      return "price_asc";
    case "price_desc":
      return "price_desc";
    case "newest":
      return "newest";
    default:
      return "catalog_order";
  }
}

export function mapCatalogKindToApi(kind: CatalogKindFilter): string | undefined {
  switch (kind) {
    case "funding":
      return "primary";
    case "market":
      return "secondary";
    default:
      return undefined;
  }
}

export function mapCatalogPhaseToApi(phase: CatalogFundingPhase): string | undefined {
  switch (phase) {
    case "open":
      return "open";
    case "payouts":
      return "payouts";
    default:
      return undefined;
  }
}

export function buildCatalogListQuery(params: CatalogListQueryParams): Record<string, string> {
  const q: Record<string, string> = {
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 24),
    sort: mapCatalogSortToApi(params.sort ?? "catalog_order"),
  };

  const search = params.search?.trim();
  if (search) q.search = search;

  if (params.genre?.trim()) q.genre = params.genre.trim();

  const kind = params.kind ? mapCatalogKindToApi(params.kind) : undefined;
  if (kind) q.kind = kind;

  const status = params.phase ? mapCatalogPhaseToApi(params.phase) : undefined;
  if (status) q.status = status;

  const priceRange = validateNumericRange(params.minPrice, params.maxPrice);
  if (!priceRange.invalid) {
    if (priceRange.min != null) q.priceMin = String(priceRange.min);
    if (priceRange.max != null) q.priceMax = String(priceRange.max);
  }

  const minYield = params.minYield ? parseOptionalNumber(params.minYield) : undefined;
  const minProgress = params.minProgress ? parseOptionalNumber(params.minProgress) : undefined;
  const minLiquidity = params.minLiquidity ? parseOptionalNumber(params.minLiquidity) : undefined;
  if (minYield != null) q.minYield = String(minYield);
  if (minProgress != null) q.minProgress = String(minProgress);
  if (minLiquidity != null) q.minLiquidity = String(minLiquidity);

  return q;
}

export const CATALOG_URL_KEYS = [
  "search",
  "kind",
  "genre",
  "phase",
  "minPrice",
  "maxPrice",
  "minYield",
  "minProgress",
  "minLiquidity",
  "sort",
  "page",
] as const;

export function parseCatalogSearchParams(
  params: URLSearchParams,
): Partial<CatalogListQueryParams> {
  const kindRaw = params.get("kind");
  const kind: CatalogKindFilter | undefined =
    kindRaw === "funding" || kindRaw === "market" || kindRaw === "all" ? kindRaw : undefined;

  const phaseRaw = params.get("phase");
  const phase: CatalogFundingPhase | undefined =
    phaseRaw === "open" || phaseRaw === "payouts" || phaseRaw === "all" ? phaseRaw : undefined;

  const sortRaw = params.get("sort");
  const sortValues: CatalogSortKey[] = [
    "catalog_order",
    "title_asc",
    "progress_desc",
    "yield_desc",
    "liquidity_desc",
    "volume24h_desc",
    "price_asc",
    "price_desc",
    "newest",
  ];
  const sort = sortValues.includes(sortRaw as CatalogSortKey)
    ? (sortRaw as CatalogSortKey)
    : undefined;

  const pageRaw = params.get("page");
  const page = pageRaw ? Number.parseInt(pageRaw, 10) : undefined;

  return {
    search: params.get("search") ?? undefined,
    kind,
    phase,
    genre: params.get("genre") ?? undefined,
    minPrice: params.get("minPrice") ?? undefined,
    maxPrice: params.get("maxPrice") ?? undefined,
    minYield: params.get("minYield") ?? undefined,
    minProgress: params.get("minProgress") ?? undefined,
    minLiquidity: params.get("minLiquidity") ?? undefined,
    sort,
    page: Number.isFinite(page) && page! > 0 ? page : undefined,
  };
}

export function buildCatalogUrlSearchParams(
  params: CatalogListQueryParams,
): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.kind && params.kind !== "all") sp.set("kind", params.kind);
  if (params.phase && params.phase !== "all") sp.set("phase", params.phase);
  if (params.genre?.trim()) sp.set("genre", params.genre.trim());
  if (params.minPrice?.trim()) sp.set("minPrice", params.minPrice.trim());
  if (params.maxPrice?.trim()) sp.set("maxPrice", params.maxPrice.trim());
  if (params.minYield?.trim()) sp.set("minYield", params.minYield.trim());
  if (params.minProgress?.trim()) sp.set("minProgress", params.minProgress.trim());
  if (params.minLiquidity?.trim()) sp.set("minLiquidity", params.minLiquidity.trim());
  if (params.sort && params.sort !== "catalog_order") sp.set("sort", params.sort);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  return sp;
}
