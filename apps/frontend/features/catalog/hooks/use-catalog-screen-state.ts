"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useI18n } from "@/components/providers/i18n-provider";
import { useCatalogPriceLabel } from "@/hooks/use-catalog-i18n";
import { catalogItems } from "@/lib/catalog-mock";
import { formatApiError } from "@/lib/i18n/format-api-error";
import {
  buildCatalogUrlSearchParams,
  parseCatalogSearchParams,
  type CatalogListQueryParams,
} from "@/lib/catalog/catalog-api-query";
import { catalogMatchesFilters, sortCatalogItems } from "@/lib/catalog/catalog-filter";
import type { CatalogItem } from "@/lib/catalog-mock";
import {
  fetchCatalogFilters,
  fetchCatalogStats,
  isLiveCatalogEnabled,
  loadLiveCatalogItems,
} from "@/services/catalog.service";
import type {
  CatalogFundingPhase,
  CatalogGenreFilter,
  CatalogGridView,
  CatalogKindFilter,
  CatalogPagination,
  CatalogSortKey,
  CatalogStats,
} from "@/types/catalog/page";

const LIVE_DEBOUNCE_MS = 320;
const DEFAULT_PAGE_SIZE = 24;

function applyClientPhaseFilter(items: CatalogItem[], phase: CatalogFundingPhase): CatalogItem[] {
  if (phase === "all") return items;
  if (phase === "open") return items.filter((it) => it.kind !== "funding" || it.status === "open");
  return items.filter((it) => it.kind !== "funding" || it.status === "payouts");
}

function applyClientKindFilter(items: CatalogItem[], kind: CatalogKindFilter): CatalogItem[] {
  if (kind === "funding") return items.filter((it) => it.kind === "funding");
  if (kind === "market") return items.filter((it) => it.kind === "market");
  return items;
}

export function useCatalogScreenState() {
  const { locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlState = useMemo(
    () => parseCatalogSearchParams(searchParams),
    [searchParams],
  );

  const [catalogView, setCatalogView] = useState<CatalogGridView>("list");
  const [query, setQuery] = useState(urlState.search ?? "");
  const [kind, setKind] = useState<CatalogKindFilter>(urlState.kind ?? "all");
  const [phase, setPhase] = useState<CatalogFundingPhase>(urlState.phase ?? "all");
  const [genre, setGenre] = useState(urlState.genre ?? "");
  const [sort, setSort] = useState<CatalogSortKey>(urlState.sort ?? "catalog_order");
  const [minPrice, setMinPrice] = useState(urlState.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(urlState.maxPrice ?? "");
  const [minProgress, setMinProgress] = useState(urlState.minProgress ?? "");
  const [minYield, setMinYield] = useState(urlState.minYield ?? "");
  const [minLiquidity, setMinLiquidity] = useState(urlState.minLiquidity ?? "");
  const [page, setPage] = useState(urlState.page ?? 1);

  const liveMode = isLiveCatalogEnabled();
  const [liveItems, setLiveItems] = useState<CatalogItem[] | null>(null);
  const [liveGenres, setLiveGenres] = useState<CatalogGenreFilter[] | null>(null);
  const [pagination, setPagination] = useState<CatalogPagination | null>(null);
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [statsUnavailable, setStatsUnavailable] = useState(false);
  const [filtersDegraded, setFiltersDegraded] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(liveMode);
  const [catalogError, setCatalogError] = useState<unknown>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const listQuery = useMemo((): CatalogListQueryParams => {
    return {
      search: query,
      genre,
      kind,
      phase,
      sort,
      minPrice,
      maxPrice,
      minProgress,
      minYield,
      minLiquidity,
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    };
  }, [
    query,
    genre,
    kind,
    phase,
    sort,
    minPrice,
    maxPrice,
    minProgress,
    minYield,
    minLiquidity,
    page,
  ]);

  const syncUrl = useCallback(
    (next: CatalogListQueryParams) => {
      const sp = buildCatalogUrlSearchParams(next);
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  useEffect(() => {
    syncUrl(listQuery);
  }, [listQuery, syncUrl]);

  const loadLive = useCallback(async () => {
    if (!liveMode) return;
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const { items, pagination: pg } = await loadLiveCatalogItems(listQuery, locale);
      setLiveItems(items);
      setPagination(pg);
    } catch (e) {
      setCatalogError(e);
      setLiveItems([]);
      setPagination(null);
    } finally {
      setCatalogLoading(false);
    }
  }, [liveMode, listQuery, locale]);

  useEffect(() => {
    if (!liveMode) return;
    void fetchCatalogStats()
      .then((next) => {
        setStats(next);
        setStatsUnavailable(false);
      })
      .catch(() => {
        setStats(null);
        setStatsUnavailable(true);
      });
  }, [liveMode]);

  useEffect(() => {
    if (!liveMode) return;
    const mappedKind =
      kind === "funding" ? "funding" : kind === "market" ? "secondary" : "all";
    void fetchCatalogFilters(mappedKind)
      .then((f) => {
        setLiveGenres(f.genres ?? []);
        setFiltersDegraded(false);
      })
      .catch(() => {
        setLiveGenres(null);
        setFiltersDegraded(true);
      });
  }, [liveMode, kind]);

  useEffect(() => {
    if (!liveMode) {
      setLiveItems(null);
      setCatalogLoading(false);
      return;
    }
    const timer = window.setTimeout(() => {
      void loadLive();
    }, LIVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [liveMode, loadLive]);

  const sourceItems = liveMode ? (liveItems ?? []) : catalogItems;
  const catalogOrder = useMemo(
    () => new Map(sourceItems.map((it, i) => [it.id, i])),
    [sourceItems],
  );

  const genres = useMemo(() => {
    if (liveMode && liveGenres && !filtersDegraded) return liveGenres.map((g) => g.name);
    const g = new Set<string>();
    for (const it of sourceItems) g.add(it.genre);
    return Array.from(g).sort((a, b) => a.localeCompare(b, locale));
  }, [liveMode, liveGenres, filtersDegraded, sourceItems, locale]);

  const genreCounts = useMemo(() => {
    const map = new Map<string, number>();
    if (liveMode && liveGenres && !filtersDegraded) {
      for (const g of liveGenres) map.set(g.name, g.count);
    }
    return map;
  }, [liveMode, liveGenres, filtersDegraded]);

  const filtered = useMemo(() => {
    if (liveMode) return sourceItems;
    const base = sourceItems.filter((item) =>
      catalogMatchesFilters(item, {
        kind,
        phase,
        genre,
        query,
        minPrice,
        maxPrice,
        minProgress,
        minYield,
      }),
    );
    let rows = applyClientKindFilter(base, kind);
    rows = applyClientPhaseFilter(rows, phase);
    return sortCatalogItems(rows, sort, catalogOrder);
  }, [
    liveMode,
    sourceItems,
    kind,
    phase,
    genre,
    query,
    sort,
    catalogOrder,
    minPrice,
    maxPrice,
    minProgress,
    minYield,
  ]);

  const matchingCount = liveMode ? (pagination?.total ?? filtered.length) : filtered.length;
  const catalogTotal = liveMode ? (stats?.publicReleases ?? matchingCount) : catalogItems.length;
  const resultCount = filtered.length;

  const resetFilters = () => {
    setQuery("");
    setKind("all");
    setPhase("all");
    setGenre("");
    setSort("catalog_order");
    setMinPrice("");
    setMaxPrice("");
    setMinProgress("");
    setMinYield("");
    setMinLiquidity("");
    setPage(1);
  };

  const priceLabel = useCatalogPriceLabel(kind);

  return {
    catalogView,
    setCatalogView,
    query,
    setQuery: (v: string) => {
      setQuery(v);
      setPage(1);
    },
    kind,
    setKind: (v: CatalogKindFilter) => {
      setKind(v);
      setPage(1);
    },
    phase,
    setPhase: (v: CatalogFundingPhase) => {
      setPhase(v);
      setPage(1);
    },
    genre,
    setGenre: (v: string) => {
      setGenre(v);
      setPage(1);
    },
    genres,
    genreCounts,
    sort,
    setSort,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    minProgress,
    setMinProgress,
    minYield,
    setMinYield,
    minLiquidity,
    setMinLiquidity,
    page,
    setPage,
    pagination,
    stats,
    statsUnavailable,
    filtersDegraded,
    filtered,
    matchingCount,
    catalogTotal,
    resultCount,
    resetFilters,
    catalogLoading,
    catalogError,
    liveMode,
    reloadCatalog: () => void loadLive(),
    mobileFiltersOpen,
    setMobileFiltersOpen,
    priceLabel,
  };
}
