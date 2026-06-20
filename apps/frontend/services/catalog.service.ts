import { parseApiClientError } from "@/lib/api/api-client-error";
import type { CatalogItem } from "@/lib/catalog-mock";
import { adaptCatalogCardToItem } from "@/lib/catalog/catalog-adapter";
import type { AppLocale } from "@/lib/i18n/types";
import {
  buildCatalogListQuery,
  type CatalogListQueryParams,
} from "@/lib/catalog/catalog-api-query";
import type {
  CatalogPagination,
  CatalogSearchSuggestionItem,
  CatalogStats,
} from "@/types/catalog/page";
import { getPublicApiBaseUrl, isLiveCatalogEnabled } from "@/lib/public-env";

export { isLiveCatalogEnabled };

export type CatalogReleaseCardApi = {
  id: string;
  slug: string;
  symbol: string;
  title: string;
  artist: string;
  artists: { id: string; name: string; role: string }[];
  genre: string;
  segment: string;
  coverUrl: string | null;
  shortDescription: string | null;
  releaseStatus: string;
  catalogStatus: string;
  statusLabel: string;
  riskLabel: string;
  roundStatus: string;
  purchaseState: "available" | "sold_out" | "paused" | "unavailable";
  payoutFreq: "monthly" | "biweekly";
  totalUnits: string;
  availableUnits: string;
  primaryUnitPriceUsdt: string;
  unitPriceUsdt?: string;
  raiseTargetUsdt: string | null;
  hardCapUsdt: string | null;
  raisedUsdt: string;
  goalUsdt: string | null;
  progressPct: number;
  expectedYieldPct: string | null;
  primaryPurchaseFeePct: string;
  secondaryMarketEnabled: boolean;
  activeSecondaryListingsCount: number;
  bestSecondaryAskPrice: string | null;
  lastTradePrice: string | null;
  volume24hUsdt: string;
  volume7dUsdt: string;
  liquidityScore: number | null;
  nextPayoutDate: string | null;
  cardKind: "funding" | "market" | "payouts" | "coming_soon";
};

export type CatalogPrimaryRoundPublic = {
  roundId: string | null;
  status: "live" | "paused" | "completed" | "draft" | "none";
  availableUnits: string;
  pricePerUnit: string;
  raiseTargetUsdt: string | null;
  hardCapUsdt: string | null;
  soldUnits: string;
  totalUnits: string;
  progressPct: number;
  primaryPurchaseFeePct: string;
};

export type CatalogReleaseDetailApi = CatalogReleaseCardApi & {
  description: string | null;
  audioPreviewUrl: string | null;
  releaseDate: string | null;
  primaryRound: CatalogPrimaryRoundPublic;
};

const CATALOG_API = {
  releases: "/api/v1/catalog/releases",
  release: (id: string) => `/api/v1/catalog/releases/${encodeURIComponent(id)}`,
  suggestions: "/api/v1/catalog/search/suggestions",
  filters: "/api/v1/catalog/filters",
  genres: "/api/v1/catalog/genres",
  stats: "/api/v1/catalog/stats",
} as const;

export type CatalogListResponse = {
  items: CatalogReleaseCardApi[];
  pagination?: CatalogPagination;
  total?: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
  updatedAt?: string;
};

export type CatalogFiltersApi = {
  genres: { name: string; count: number }[];
  roundStatuses?: { key: string; label: string; count: number }[];
  roundStatus?: { status: string; count: number }[];
  kinds?: { key: string; label: string; count: number }[];
  priceRange?: { min: number; max: number };
  yieldRange?: { min: number; max: number };
  progressRange?: { min: number; max: number };
  updatedAt?: string;
};

function apiUrl(path: string): string {
  return `${getPublicApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw await parseApiClientError(res);
  return res.json() as Promise<T>;
}

export async function fetchCatalogReleases(
  query?: CatalogListQueryParams,
): Promise<CatalogListResponse> {
  const params = query ? buildCatalogListQuery(query) : { page: "1", pageSize: "24" };
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(apiUrl(`${CATALOG_API.releases}?${qs}`), {
    credentials: "omit",
    cache: "no-store",
  });
  return parseJson<CatalogListResponse>(res);
}

export async function fetchCatalogSearchSuggestions(
  q: string,
  limit = 8,
): Promise<{ items: CatalogSearchSuggestionItem[] }> {
  const term = q.trim();
  if (term.length < 2) return { items: [] };
  const qs = new URLSearchParams({ q: term, limit: String(limit) }).toString();
  const res = await fetch(apiUrl(`${CATALOG_API.suggestions}?${qs}`), {
    credentials: "omit",
    cache: "no-store",
  });
  return parseJson(res);
}

export async function fetchCatalogFilters(kind?: string): Promise<CatalogFiltersApi> {
  const qs = kind ? `?kind=${encodeURIComponent(kind)}` : "";
  const res = await fetch(apiUrl(`${CATALOG_API.filters}${qs}`), {
    credentials: "omit",
    cache: "no-store",
  });
  return parseJson(res);
}

export async function fetchCatalogGenres(): Promise<{ items: string[] }> {
  const res = await fetch(apiUrl(CATALOG_API.genres), {
    credentials: "omit",
    cache: "no-store",
  });
  return parseJson(res);
}

export type CatalogStatsApi = CatalogStats;

export async function fetchCatalogStats(): Promise<CatalogStatsApi> {
  const res = await fetch(apiUrl(CATALOG_API.stats), {
    credentials: "omit",
    cache: "no-store",
  });
  return parseJson(res);
}

export async function fetchCatalogReleaseById(
  id: string,
): Promise<CatalogReleaseDetailApi | null> {
  try {
    const res = await fetch(apiUrl(CATALOG_API.release(id)), {
      credentials: "omit",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as CatalogReleaseDetailApi;
  } catch {
    return null;
  }
}

export async function loadLiveCatalogItems(
  query?: CatalogListQueryParams,
  locale: AppLocale = "ru",
): Promise<{ items: CatalogItem[]; pagination: CatalogPagination | null }> {
  const body = await fetchCatalogReleases(query);
  const pagination =
    body.pagination ??
    (body.total != null
      ? {
          page: body.page ?? 1,
          pageSize: body.pageSize ?? body.items.length,
          total: body.total,
          totalPages: Math.ceil(body.total / ((body.pageSize ?? body.items.length) || 1)),
          hasNextPage: body.hasMore ?? false,
        }
      : null);

  return {
    items: body.items.map((card) => adaptCatalogCardToItem(card, locale)),
    pagination,
  };
}

export async function resolveCatalogReleaseForPage(
  id: string,
): Promise<CatalogReleaseDetailApi | null> {
  if (!isLiveCatalogEnabled()) return null;
  return fetchCatalogReleaseById(id);
}
