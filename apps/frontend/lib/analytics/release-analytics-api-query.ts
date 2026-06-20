import type {
  ReleaseAnalyticsChipPreset,
  ReleaseAnalyticsPeriod,
  ReleaseAnalyticsSortKey,
  ReleaseRowGenre,
  ReleaseRowStatus,
} from "@/types/analytics/releases";

export type ReleaseAnalyticsListQueryParams = {
  period?: ReleaseAnalyticsPeriod;
  search?: string;
  status?: "all" | ReleaseRowStatus;
  genre?: "all" | ReleaseRowGenre;
  preset?: ReleaseAnalyticsChipPreset;
  sort?: ReleaseAnalyticsSortKey;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export type ReleaseAnalyticsApiSortKey =
  | "yield_desc"
  | "yield_asc"
  | "payouts_desc"
  | "payouts_asc"
  | "units_desc"
  | "units_asc"
  | "liquidity_desc";

export function mapReleaseAnalyticsSortToApi(
  sort: ReleaseAnalyticsSortKey,
  sortDir: "asc" | "desc",
): ReleaseAnalyticsApiSortKey {
  if (sort === "yield") return sortDir === "asc" ? "yield_asc" : "yield_desc";
  if (sort === "payouts") return sortDir === "asc" ? "payouts_asc" : "payouts_desc";
  return sortDir === "asc" ? "units_asc" : "units_desc";
}

export function parseReleaseAnalyticsApiSort(raw: string | null): {
  sort: ReleaseAnalyticsSortKey;
  sortDir: "asc" | "desc";
} {
  switch (raw) {
    case "yield_asc":
      return { sort: "yield", sortDir: "asc" };
    case "payouts_desc":
      return { sort: "payouts", sortDir: "desc" };
    case "payouts_asc":
      return { sort: "payouts", sortDir: "asc" };
    case "units_desc":
      return { sort: "units", sortDir: "desc" };
    case "units_asc":
      return { sort: "units", sortDir: "asc" };
    case "liquidity_desc":
      return { sort: "units", sortDir: "desc" };
    case "yield_desc":
    default:
      return { sort: "yield", sortDir: "desc" };
  }
}

export function buildReleaseAnalyticsListQuery(
  params: ReleaseAnalyticsListQueryParams,
): Record<string, string> {
  const q: Record<string, string> = {
    period: params.period ?? "30d",
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 24),
    sort: mapReleaseAnalyticsSortToApi(params.sort ?? "yield", params.sortDir ?? "desc"),
    preset: params.preset ?? "all",
  };

  const search = params.search?.trim();
  if (search) q.search = search;

  if (params.status && params.status !== "all") q.status = params.status;

  if (params.genre && params.genre !== "all") q.genre = params.genre;

  return q;
}

export const RELEASE_ANALYTICS_URL_KEYS = [
  "period",
  "search",
  "status",
  "genre",
  "preset",
  "sort",
  "page",
] as const;

const PERIOD_VALUES: ReleaseAnalyticsPeriod[] = ["7d", "30d", "90d", "all"];
const STATUS_VALUES: ReleaseRowStatus[] = ["Active", "Paused", "Closed"];
const GENRE_VALUES: ReleaseRowGenre[] = ["electronic", "hiphop", "pop"];
const PRESET_VALUES: ReleaseAnalyticsChipPreset[] = ["all", "top", "stable", "growth"];

export function parseReleaseAnalyticsSearchParams(
  params: URLSearchParams,
): Partial<ReleaseAnalyticsListQueryParams> {
  const periodRaw = params.get("period");
  const period = PERIOD_VALUES.includes(periodRaw as ReleaseAnalyticsPeriod)
    ? (periodRaw as ReleaseAnalyticsPeriod)
    : undefined;

  const statusRaw = params.get("status");
  const status: ReleaseAnalyticsListQueryParams["status"] =
    statusRaw === "all" || !statusRaw
      ? "all"
      : STATUS_VALUES.includes(statusRaw as ReleaseRowStatus)
        ? (statusRaw as ReleaseRowStatus)
        : undefined;

  const genreRaw = params.get("genre");
  const genre: ReleaseAnalyticsListQueryParams["genre"] =
    genreRaw === "all" || !genreRaw
      ? "all"
      : GENRE_VALUES.includes(genreRaw as ReleaseRowGenre)
        ? (genreRaw as ReleaseRowGenre)
        : undefined;

  const presetRaw = params.get("preset");
  const preset = PRESET_VALUES.includes(presetRaw as ReleaseAnalyticsChipPreset)
    ? (presetRaw as ReleaseAnalyticsChipPreset)
    : undefined;

  const { sort, sortDir } = parseReleaseAnalyticsApiSort(params.get("sort"));

  const pageRaw = params.get("page");
  const page = pageRaw ? Number.parseInt(pageRaw, 10) : undefined;

  return {
    period,
    search: params.get("search") ?? undefined,
    status,
    genre,
    preset,
    sort,
    sortDir,
    page: Number.isFinite(page) && page! > 0 ? page : undefined,
  };
}

export function buildReleaseAnalyticsUrlSearchParams(
  params: ReleaseAnalyticsListQueryParams,
): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.period && params.period !== "30d") sp.set("period", params.period);
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.status && params.status !== "all") sp.set("status", params.status);
  if (params.genre && params.genre !== "all") sp.set("genre", params.genre);
  if (params.preset && params.preset !== "all") sp.set("preset", params.preset);
  const apiSort = mapReleaseAnalyticsSortToApi(params.sort ?? "yield", params.sortDir ?? "desc");
  if (apiSort !== "yield_desc") sp.set("sort", apiSort);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  return sp;
}
