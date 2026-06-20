"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  buildMarketOverviewUrlSearchParams,
  parseMarketOverviewSearchParams,
  type MarketOverviewListQueryParams,
} from "@/lib/market-overview/market-overview-api-query";
import {
  adaptMarketOverviewRow,
  marketOverviewQueryFromState,
} from "@/lib/market-overview/market-overview-adapter";
import { MARKET_OVERVIEW_ROWS } from "@/mocks/market-overview-rows";
import {
  fetchMarketOverviewCharts,
  fetchMarketOverviewDepth,
  fetchMarketOverviewList,
  fetchMarketOverviewListings,
  fetchMarketOverviewStats,
  fetchMarketOverviewTrades,
  isLiveMarketOverviewEnabled,
  type MarketOverviewChartsApi,
  type MarketOverviewDepthApi,
  type MarketOverviewListingApi,
  type MarketOverviewPagination,
  type MarketOverviewStatsApi,
  type MarketOverviewTradeApi,
} from "@/services/market-overview.service";
import type {
  MarketOverviewCategory,
  MarketOverviewPeriod,
  MarketOverviewRow,
  MarketTableSortKey,
} from "@/types/market-overview";

export type MarketOverviewFilters = Record<
  "genre" | "status" | "payoutFreq" | "liquidity" | "yield" | "availability",
  string
>;

const defaultFilters: MarketOverviewFilters = {
  genre: "all",
  status: "all",
  payoutFreq: "all",
  liquidity: "all",
  yield: "all",
  availability: "all",
};

const LIVE_DEBOUNCE_MS = 300;
const DEFAULT_PAGE_SIZE = 24;
const FEED_PAGE_SIZE = 12;

function segmentSlug(segment: string): string {
  const s = segment.toLowerCase();
  if (s.includes("hip")) return "hiphop";
  if (s.includes("lo-fi") || s === "lofi") return "lofi";
  if (s === "pop") return "pop";
  if (s.includes("electronic")) return "electronic";
  if (s.includes("indie")) return "indie";
  return "all";
}

function statusSlug(status: MarketOverviewRow["status"]): string {
  if (status === "Активен") return "active";
  if (status === "Новый") return "new";
  if (status === "Пауза") return "paused";
  if (status === "Закрыт") return "closed";
  return "all";
}

function liquiditySlug(label: MarketOverviewRow["liquidityLabel"]): string {
  if (label === "Высокая" || label === "Deep") return "deep";
  if (label === "Средняя" || label === "Mid") return "mid";
  if (label === "Низкая" || label === "Thin") return "thin";
  return "all";
}

function passesFilters(row: MarketOverviewRow, f: MarketOverviewFilters): boolean {
  if (f.genre !== "all" && segmentSlug(row.segment) !== f.genre) return false;
  if (f.status !== "all" && statusSlug(row.status) !== f.status) return false;
  if (f.payoutFreq !== "all" && row.payoutFreq !== f.payoutFreq) return false;
  if (f.liquidity !== "all" && liquiditySlug(row.liquidityLabel) !== f.liquidity) return false;
  if (f.yield === "high" && row.yieldPct < 12) return false;
  if (f.yield === "mid" && (row.yieldPct < 8 || row.yieldPct >= 12)) return false;
  if (f.yield === "low" && row.yieldPct >= 8) return false;
  if (f.availability === "tight" && !(row.availableUnits > 0 && row.availableUnits < 100_000)) return false;
  if (f.availability === "wide" && row.availableUnits <= 200_000) return false;
  return true;
}

function passesCategory(row: MarketOverviewRow, tab: MarketOverviewCategory): boolean {
  if (tab === "all") return true;
  return row.categories.includes(tab);
}

function sortRows(rows: MarketOverviewRow[], key: MarketTableSortKey, dir: "asc" | "desc"): MarketOverviewRow[] {
  const mul = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (key === "yield") return (a.yieldPct - b.yieldPct) * mul;
    if (key === "payouts") return (a.payoutsUsdt - b.payoutsUsdt) * mul;
    if (key === "activity") return (a.activityScore - b.activityScore) * mul;
    return (a.availableUnits - b.availableUnits) * mul;
  });
}

function filtersFromUrl(
  parsed: Partial<MarketOverviewListQueryParams>,
): MarketOverviewFilters {
  return {
    genre: parsed.genre ?? "all",
    status: parsed.status ?? "all",
    payoutFreq: parsed.payoutFreq ?? "all",
    liquidity: parsed.liquidity ?? "all",
    yield: parsed.yield ?? "all",
    availability: parsed.availability ?? "all",
  };
}

export function useMarketOverviewState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlState = React.useMemo(
    () => parseMarketOverviewSearchParams(searchParams),
    [searchParams],
  );

  const live = isLiveMarketOverviewEnabled();

  const [period, setPeriodState] = React.useState<MarketOverviewPeriod>(urlState.period ?? "7d");
  const [search, setSearchState] = React.useState(urlState.search ?? "");
  const [categoryTab, setCategoryTabState] = React.useState<MarketOverviewCategory>(
    urlState.category ?? "all",
  );
  const [filters, setFilters] = React.useState<MarketOverviewFilters>(() => filtersFromUrl(urlState));
  const [sort, setSort] = React.useState<MarketTableSortKey>(urlState.sort ?? "activity");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">(urlState.sortDir ?? "desc");
  const [page, setPageState] = React.useState(urlState.page ?? 1);

  const [liveRows, setLiveRows] = React.useState<MarketOverviewRow[] | null>(null);
  const [pagination, setPagination] = React.useState<MarketOverviewPagination | null>(null);
  const [stats, setStats] = React.useState<MarketOverviewStatsApi | null>(null);
  const [charts, setCharts] = React.useState<MarketOverviewChartsApi | null>(null);
  const [depth, setDepth] = React.useState<MarketOverviewDepthApi | null>(null);
  const [listings, setListings] = React.useState<MarketOverviewListingApi[]>([]);
  const [trades, setTrades] = React.useState<MarketOverviewTradeApi[]>([]);
  const [liveUpdatedAt, setLiveUpdatedAt] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [feedError, setFeedError] = React.useState(false);
  const [loading, setLoading] = React.useState(live);
  const [feedLoading, setFeedLoading] = React.useState(live);

  const listQuery = React.useMemo((): MarketOverviewListQueryParams => {
    return {
      period,
      search,
      category: categoryTab,
      genre: filters.genre,
      status: filters.status,
      payoutFreq: filters.payoutFreq,
      liquidity: filters.liquidity,
      yield: filters.yield,
      availability: filters.availability,
      sort,
      sortDir,
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      release: urlState.release,
    };
  }, [period, search, categoryTab, filters, sort, sortDir, page, urlState.release]);

  const syncUrl = React.useCallback(
    (next: MarketOverviewListQueryParams) => {
      const sp = buildMarketOverviewUrlSearchParams(next);
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  React.useEffect(() => {
    syncUrl(listQuery);
  }, [listQuery, syncUrl]);

  const setFilter = React.useCallback((id: keyof MarketOverviewFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [id]: value }));
    setPageState(1);
  }, []);

  const setPeriod = React.useCallback((p: MarketOverviewPeriod) => {
    setPeriodState(p);
    setPageState(1);
  }, []);

  const setCategoryTab = React.useCallback((tab: MarketOverviewCategory) => {
    setCategoryTabState(tab);
    setPageState(1);
  }, []);

  const setSearch = React.useCallback((value: string) => {
    setSearchState(value);
    setPageState(1);
  }, []);

  const setPage = React.useCallback((next: number) => {
    setPageState(next);
  }, []);

  const handleSort = React.useCallback(
    (key: MarketTableSortKey) => {
      if (sort === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else {
        setSort(key);
        setSortDir("desc");
      }
      setPageState(1);
    },
    [sort],
  );

  const resetFilters = React.useCallback(() => {
    setFilters(defaultFilters);
    setCategoryTabState("all");
    setSearchState("");
    setPageState(1);
  }, []);

  const feedParams = React.useMemo(
    () => ({
      period,
      page: "1",
      limit: String(FEED_PAGE_SIZE),
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(filters.genre !== "all" ? { genre: filters.genre } : {}),
    }),
    [period, search, filters.genre],
  );

  const loadLive = React.useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setFeedLoading(true);
    setLoadError(null);
    setFeedError(false);
    const query = marketOverviewQueryFromState({
      period: listQuery.period,
      search: listQuery.search,
      categoryTab: listQuery.category,
      filters,
      sort: listQuery.sort,
      sortDir: listQuery.sortDir,
      page: listQuery.page,
      pageSize: listQuery.pageSize,
    });

    try {
      const [listRes, statsRes, chartsRes, depthRes, listingsRes, tradesRes] = await Promise.all([
        fetchMarketOverviewList(query),
        fetchMarketOverviewStats(listQuery.period ?? "7d"),
        fetchMarketOverviewCharts(listQuery.period ?? "7d"),
        fetchMarketOverviewDepth(listQuery.period ?? "7d"),
        fetchMarketOverviewListings(feedParams),
        fetchMarketOverviewTrades(feedParams),
      ]);
      setLiveRows(listRes.items.map(adaptMarketOverviewRow));
      setPagination(listRes.pagination);
      setStats(statsRes ?? listRes.stats ?? null);
      setCharts(chartsRes);
      setDepth(depthRes);
      setListings(listingsRes.items);
      setTrades(tradesRes.items);
      const updated = listRes.updatedAt ?? statsRes?.updatedAt;
      setLiveUpdatedAt(
        updated
          ? new Date(updated).toLocaleString("ru-RU", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
      );
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Не удалось загрузить обзор рынка");
      setLiveRows([]);
      setPagination(null);
      setStats(null);
      setCharts(null);
      setDepth(null);
      setListings([]);
      setTrades([]);
      setFeedError(true);
    } finally {
      setLoading(false);
      setFeedLoading(false);
    }
  }, [live, listQuery, filters, feedParams]);

  React.useEffect(() => {
    if (!live) {
      setLiveRows(null);
      setPagination(null);
      setStats(null);
      setCharts(null);
      setDepth(null);
      setListings([]);
      setTrades([]);
      setLoading(false);
      setFeedLoading(false);
      return;
    }
    const timer = window.setTimeout(() => {
      void loadLive();
    }, LIVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [live, loadLive]);

  const filteredRows = React.useMemo(() => {
    if (live) {
      return liveRows ?? [];
    }
    const base = MARKET_OVERVIEW_ROWS.filter(
      (r) => passesCategory(r, categoryTab) && passesFilters(r, filters),
    );
    const q = search.trim().toLowerCase();
    const searched = q
      ? base.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.artist.toLowerCase().includes(q) ||
            r.symbol.toLowerCase().includes(q),
        )
      : base;
    return sortRows(searched, sort, sortDir);
  }, [live, liveRows, categoryTab, filters, sort, sortDir, search]);

  const lastUpdated =
    live && liveUpdatedAt
      ? liveUpdatedAt
      : new Date().toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });

  const totalCount = live ? (pagination?.total ?? filteredRows.length) : MARKET_OVERVIEW_ROWS.length;
  const totalPages = live ? (pagination?.totalPages ?? 1) : 1;

  return {
    period,
    setPeriod,
    search,
    setSearch,
    categoryTab,
    setCategoryTab,
    filters,
    setFilter,
    sort,
    sortDir,
    handleSort,
    filteredRows,
    lastUpdated,
    resetFilters,
    live,
    loading,
    feedLoading,
    loadError,
    feedError,
    stats,
    charts,
    depth,
    listings,
    trades,
    pagination,
    page,
    setPage,
    totalCount,
    totalPages,
    reload: loadLive,
  };
}
