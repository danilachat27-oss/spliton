"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { adaptAnalyticsListItem } from "@/lib/analytics/release-analytics-adapter";
import {
  buildReleaseAnalyticsUrlSearchParams,
  parseReleaseAnalyticsSearchParams,
  type ReleaseAnalyticsListQueryParams,
} from "@/lib/analytics/release-analytics-api-query";
import { RELEASE_ANALYTICS_ROWS_MOCK } from "@/mocks/analytics/releases.mock";
import {
  fetchReleaseAnalyticsCompare,
  fetchReleaseAnalyticsFunnel,
  fetchReleaseAnalyticsGenres,
  fetchReleaseAnalyticsList,
  fetchReleaseAnalyticsOverview,
  fetchReleaseAnalyticsTimeseries,
  isLiveReleaseAnalyticsEnabled,
  type ReleaseAnalyticsCompareApi,
  type ReleaseAnalyticsFunnelApi,
  type ReleaseAnalyticsGenresApi,
  type ReleaseAnalyticsOverviewApi,
  type ReleaseAnalyticsPagination,
  type ReleaseAnalyticsTimeseriesApi,
} from "@/services/release-analytics.service";
import { readLocalReleaseNotes, writeLocalReleaseNotes } from "@/features/analytics/releases/lib/local-release-notes";
import { formatUsdtCompact } from "@/lib/market-overview/format";
import { analyticsReleaseDetailPath } from "@/constants/routes";
import type {
  ReleaseAnalyticsChipPreset,
  ReleaseAnalyticsPeriod,
  ReleaseAnalyticsRow,
  ReleaseAnalyticsSortKey,
  ReleaseRowGenre,
  ReleaseRowStatus,
} from "@/types/analytics/releases";

const LIVE_DEBOUNCE_MS = 320;
const DEFAULT_PAGE_SIZE = 24;

function parseMoney(s: string) {
  return Number(s.replace(/[^\d]/g, "")) || 0;
}

function parsePct(s: string) {
  return Number(s.replace("%", "").replace(",", ".")) || 0;
}

function parseUnits(s: string) {
  return Number(s.replace(/\s/g, "").replace(",", ".")) || 0;
}

function formatOverviewYield(pct: number | null | undefined): string {
  if (pct == null || Number.isNaN(pct)) return "—";
  return `${pct.toFixed(1).replace(".", ",")}%`;
}

function formatPayoutsTotal(value: string | null | undefined): string {
  if (!value || value === "0") return "0 USDT";
  const normalized = value.replace(/[^\d.,-]/g, "").replace(",", ".");
  const amount = Number.parseFloat(normalized);
  if (Number.isFinite(amount)) {
    return `${formatUsdtCompact(amount)} USDT`;
  }
  return value.includes("USDT") ? value : `${value} USDT`;
}

function formatPayoutLag(min: number | null | undefined, max: number | null | undefined): string {
  if (min != null && max != null) {
    if (min === max) return `${min} дн.`;
    return `${min}–${max} дн.`;
  }
  if (min != null) return `${min} дн.`;
  if (max != null) return `${max} дн.`;
  return "—";
}

const NO_DATA = "Недостаточно данных";

function overviewStatsFromApi(overview: ReleaseAnalyticsOverviewApi) {
  const { kpis } = overview;
  return {
    totalReleases: kpis.totalReleases != null ? String(kpis.totalReleases) : NO_DATA,
    avgYield: formatOverviewYield(kpis.averageYieldPct),
    active: kpis.activeReleases != null ? String(kpis.activeReleases) : NO_DATA,
    payoutsReleases: kpis.payoutsReleases != null ? String(kpis.payoutsReleases) : NO_DATA,
    primaryVolume: formatPayoutsTotal(kpis.primaryVolumeUsdt),
    payouts: formatPayoutsTotal(kpis.totalPayoutsUsdt),
    secondaryVolume: formatPayoutsTotal(kpis.secondaryVolumeUsdt),
    holders: kpis.totalHolders != null ? String(kpis.totalHolders) : NO_DATA,
    listings: kpis.activeSecondaryListings != null ? String(kpis.activeSecondaryListings) : NO_DATA,
    avgProgress:
      kpis.avgProgressPct != null
        ? `${Number(kpis.avgProgressPct).toFixed(1).replace(".", ",")}%`
        : NO_DATA,
    avgLiquidity:
      kpis.avgLiquidityScore != null
        ? `${Number(kpis.avgLiquidityScore).toFixed(0)}%`
        : NO_DATA,
    topVolume: kpis.topReleaseByVolume?.title ?? NO_DATA,
    topVolumeHref: kpis.topReleaseByVolume?.id
      ? analyticsReleaseDetailPath(kpis.topReleaseByVolume.id)
      : undefined,
    topPayouts: kpis.topReleaseByPayouts?.title ?? NO_DATA,
    topPayoutsHref: kpis.topReleaseByPayouts?.id
      ? analyticsReleaseDetailPath(kpis.topReleaseByPayouts.id)
      : undefined,
    payoutLag: formatPayoutLag(kpis.payoutLagDaysMin, kpis.payoutLagDaysMax),
  };
}

export function useReleaseAnalyticsState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { authorizedFetch } = useAuth();
  const liveMode = isLiveReleaseAnalyticsEnabled();

  const urlState = React.useMemo(
    () => parseReleaseAnalyticsSearchParams(searchParams),
    [searchParams],
  );

  const [period, setPeriodState] = React.useState<ReleaseAnalyticsPeriod>(urlState.period ?? "30d");
  const [query, setQueryState] = React.useState(urlState.search ?? "");
  const [statusTab, setStatusTabState] = React.useState<"all" | ReleaseRowStatus>(
    urlState.status ?? "all",
  );
  const [sort, setSort] = React.useState<ReleaseAnalyticsSortKey>(urlState.sort ?? "yield");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">(urlState.sortDir ?? "desc");
  const [genre, setGenreState] = React.useState<"all" | ReleaseRowGenre>(urlState.genre ?? "all");
  const [chipPreset, setChipPresetState] = React.useState<ReleaseAnalyticsChipPreset>(
    urlState.preset ?? "all",
  );
  const [page, setPageState] = React.useState(urlState.page ?? 1);
  const [watch, setWatch] = React.useState<Record<string, boolean>>(() => readLocalReleaseNotes());

  React.useEffect(() => {
    writeLocalReleaseNotes(watch);
  }, [watch]);

  const [liveRows, setLiveRows] = React.useState<ReleaseAnalyticsRow[] | null>(null);
  const [pagination, setPagination] = React.useState<ReleaseAnalyticsPagination | null>(null);
  const [overview, setOverview] = React.useState<ReleaseAnalyticsOverviewApi | null>(null);
  const [timeseries, setTimeseries] = React.useState<ReleaseAnalyticsTimeseriesApi | null>(null);
  const [compare, setCompare] = React.useState<ReleaseAnalyticsCompareApi | null>(null);
  const [genresApi, setGenresApi] = React.useState<ReleaseAnalyticsGenresApi | null>(null);
  const [funnel, setFunnel] = React.useState<ReleaseAnalyticsFunnelApi | null>(null);
  const [listLoading, setListLoading] = React.useState(liveMode);
  const [overviewLoading, setOverviewLoading] = React.useState(liveMode);
  const [chartsLoading, setChartsLoading] = React.useState(liveMode);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [overviewError, setOverviewError] = React.useState(false);
  const [chartsError, setChartsError] = React.useState(false);

  const listQuery = React.useMemo((): ReleaseAnalyticsListQueryParams => {
    return {
      period,
      search: query,
      status: statusTab,
      genre,
      preset: chipPreset,
      sort,
      sortDir,
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    };
  }, [period, query, statusTab, genre, chipPreset, sort, sortDir, page]);

  const syncUrl = React.useCallback(
    (next: ReleaseAnalyticsListQueryParams) => {
      const sp = buildReleaseAnalyticsUrlSearchParams(next);
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  React.useEffect(() => {
    syncUrl(listQuery);
  }, [listQuery, syncUrl]);

  const loadOverview = React.useCallback(async () => {
    if (!liveMode) return;
    setOverviewLoading(true);
    setOverviewError(false);
    try {
      const res = await fetchReleaseAnalyticsOverview(period);
      setOverview(res);
    } catch {
      setOverview(null);
      setOverviewError(true);
    } finally {
      setOverviewLoading(false);
    }
  }, [liveMode, period]);

  const loadCharts = React.useCallback(async () => {
    if (!liveMode) return;
    setChartsLoading(true);
    setChartsError(false);
    try {
      const [ts, cmp, genresRes, funnelRes] = await Promise.all([
        fetchReleaseAnalyticsTimeseries(period),
        fetchReleaseAnalyticsCompare(period, 8),
        fetchReleaseAnalyticsGenres(period),
        fetchReleaseAnalyticsFunnel(period),
      ]);
      setTimeseries(ts);
      setCompare(cmp);
      setGenresApi(genresRes);
      setFunnel(funnelRes);
    } catch {
      setTimeseries(null);
      setCompare(null);
      setGenresApi(null);
      setFunnel(null);
      setChartsError(true);
    } finally {
      setChartsLoading(false);
    }
  }, [liveMode, period]);

  const loadList = React.useCallback(async () => {
    if (!liveMode) return;
    setListLoading(true);
    setLoadError(null);
    try {
      const res = await fetchReleaseAnalyticsList(listQuery, authorizedFetch);
      setLiveRows(res.items.map(adaptAnalyticsListItem));
      setPagination(res.pagination);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Не удалось загрузить аналитику");
      setLiveRows([]);
      setPagination(null);
    } finally {
      setListLoading(false);
    }
  }, [authorizedFetch, listQuery, liveMode]);

  React.useEffect(() => {
    if (!liveMode) {
      setLiveRows(null);
      setPagination(null);
      setOverview(null);
      setTimeseries(null);
      setCompare(null);
      setGenresApi(null);
      setFunnel(null);
      setListLoading(false);
      setOverviewLoading(false);
      setChartsLoading(false);
      return;
    }
    void loadOverview();
    void loadCharts();
  }, [liveMode, loadOverview, loadCharts]);

  React.useEffect(() => {
    if (!liveMode) return;
    const timer = window.setTimeout(() => {
      void loadList();
    }, LIVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [liveMode, loadList]);

  const setPeriod = React.useCallback((p: ReleaseAnalyticsPeriod) => {
    setPeriodState(p);
    setPageState(1);
  }, []);

  const setQuery = React.useCallback((q: string) => {
    setQueryState(q);
    setPageState(1);
  }, []);

  const setStatusTab = React.useCallback((s: "all" | ReleaseRowStatus) => {
    setStatusTabState(s);
    setPageState(1);
  }, []);

  const setGenre = React.useCallback((g: "all" | ReleaseRowGenre) => {
    setGenreState(g);
    setPageState(1);
  }, []);

  const setChipPreset = React.useCallback((p: ReleaseAnalyticsChipPreset) => {
    setChipPresetState(p);
    setPageState(1);
  }, []);

  const setPage = React.useCallback((p: number) => {
    setPageState(Math.max(1, p));
  }, []);

  const handleSort = React.useCallback(
    (key: ReleaseAnalyticsSortKey) => {
      if (sort === key) {
        setSortDir((d) => (d === "desc" ? "asc" : "desc"));
      } else {
        setSort(key);
        setSortDir("desc");
      }
      setPageState(1);
    },
    [sort],
  );

  const mockStats = React.useMemo(() => {
    const m = period === "7d" ? 0.22 : period === "30d" ? 1 : period === "90d" ? 2.85 : 1;
    return {
      totalReleases: period === "all" ? "128" : "42",
      avgYield: `${(11.2 * m).toFixed(1).replace(".", ",")}%`,
      active: period === "all" ? "128" : period === "7d" ? "42" : period === "30d" ? "61" : "74",
      payoutsReleases: "18",
      primaryVolume: period === "30d" ? "2.4M USDT" : "890K USDT",
      payouts:
        period === "all"
          ? "42.6M USDT"
          : period === "7d"
            ? "1.1M USDT"
            : period === "30d"
              ? "6.8M USDT"
              : "18.4M USDT",
      secondaryVolume: period === "30d" ? "540K USDT" : "120K USDT",
      holders: "3 420",
      listings: "86",
      avgProgress: "54%",
      avgLiquidity: "62%",
      topVolume: "Cipher Walk",
      topVolumeHref: analyticsReleaseDetailPath("4"),
      topPayouts: "Neon Drift",
      topPayoutsHref: analyticsReleaseDetailPath("1"),
      payoutLag:
        period === "7d" ? "11 дн." : period === "30d" ? "14 дн." : period === "90d" ? "16 дн." : "15 дн.",
    };
  }, [period]);

  const emptyLiveStats = {
    totalReleases: NO_DATA,
    avgYield: NO_DATA,
    active: NO_DATA,
    payoutsReleases: NO_DATA,
    primaryVolume: NO_DATA,
    payouts: NO_DATA,
    secondaryVolume: NO_DATA,
    holders: NO_DATA,
    listings: NO_DATA,
    avgProgress: NO_DATA,
    avgLiquidity: NO_DATA,
    topVolume: NO_DATA,
    topPayouts: NO_DATA,
    payoutLag: NO_DATA,
  } as const;

  const stats = React.useMemo(() => {
    if (liveMode && overview) return overviewStatsFromApi(overview);
    if (liveMode) return emptyLiveStats;
    return mockStats;
  }, [liveMode, mockStats, overview]);

  const filteredRows = React.useMemo(() => {
    if (liveMode) return liveRows ?? [];
    let rows: ReleaseAnalyticsRow[] = [...RELEASE_ANALYTICS_ROWS_MOCK];
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.symbol.toLowerCase().includes(q) ||
          r.release.toLowerCase().includes(q) ||
          r.artist.toLowerCase().includes(q),
      );
    }
    if (statusTab !== "all") {
      rows = rows.filter((r) => r.status === statusTab);
    }
    if (genre !== "all") {
      rows = rows.filter((r) => r.genre === genre);
    }
    if (chipPreset === "top") {
      rows = rows.filter((r) => parsePct(r.yieldPct) >= 12);
    } else if (chipPreset === "stable") {
      rows = rows.filter((r) => r.trend === "flat");
    } else if (chipPreset === "growth") {
      rows = rows.filter((r) => r.trend === "up");
    }
    const mul = sortDir === "desc" ? -1 : 1;
    rows.sort((a, b) => {
      if (sort === "yield") return (parsePct(b.yieldPct) - parsePct(a.yieldPct)) * mul;
      if (sort === "payouts") return (parseMoney(b.payouts) - parseMoney(a.payouts)) * mul;
      return (parseUnits(b.units) - parseUnits(a.units)) * mul;
    });
    return rows;
  }, [chipPreset, genre, liveMode, liveRows, query, sort, sortDir, statusTab]);

  const totalCount = liveMode ? (pagination?.total ?? filteredRows.length) : filteredRows.length;
  const resultCount = filteredRows.length;
  const loading = liveMode && (listLoading || overviewLoading);

  return {
    liveMode,
    loadError,
    overviewError,
    chartsError,
    loading,
    overviewLoading,
    chartsLoading,
    period,
    setPeriod,
    query,
    setQuery,
    statusTab,
    setStatusTab,
    sort,
    sortDir,
    handleSort,
    genre,
    setGenre,
    chipPreset,
    setChipPreset,
    page,
    setPage,
    pagination,
    totalCount,
    resultCount,
    watch,
    setWatch,
    stats,
    overview,
    timeseries,
    compare,
    genresApi,
    funnel,
    filteredRows,
    reload: () => {
      void loadOverview();
      void loadCharts();
      void loadList();
    },
  };
}
