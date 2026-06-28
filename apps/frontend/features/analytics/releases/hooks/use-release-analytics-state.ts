"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { localizedApiError } from "@/lib/api/localized-error";
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
import type { AppLocale } from "@/lib/i18n/types";
import { localeMessage } from "@/lib/i18n/normalize-locale";
import { ANALYTICS_MESSAGES } from "@/lib/i18n/analytics-messages";

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

function formatPayoutLag(min: number | null | undefined, max: number | null | undefined, locale: AppLocale): string {
  const dayLabel = (count: number) =>
    localeMessage(ANALYTICS_MESSAGES, locale, "analytics.releases.payoutLag.days").replace("{count}", String(count));
  if (min != null && max != null) {
    if (min === max) return dayLabel(min);
    return localeMessage(ANALYTICS_MESSAGES, locale, "analytics.releases.payoutLag.range")
      .replace("{min}", String(min))
      .replace("{max}", String(max));
  }
  if (min != null) return dayLabel(min);
  if (max != null) return dayLabel(max);
  return "—";
}

function noDataLabel(locale: AppLocale): string {
  return localeMessage(ANALYTICS_MESSAGES, locale, "analytics.releases.charts.insufficientData", "No data");
}

function overviewStatsFromApi(overview: ReleaseAnalyticsOverviewApi, locale: AppLocale) {
  const { kpis } = overview;
  const empty = noDataLabel(locale);
  return {
    totalReleases: kpis.totalReleases != null ? String(kpis.totalReleases) : empty,
    avgYield: formatOverviewYield(kpis.averageYieldPct),
    active: kpis.activeReleases != null ? String(kpis.activeReleases) : empty,
    payoutsReleases: kpis.payoutsReleases != null ? String(kpis.payoutsReleases) : empty,
    primaryVolume: formatPayoutsTotal(kpis.primaryVolumeUsdt),
    payouts: formatPayoutsTotal(kpis.totalPayoutsUsdt),
    secondaryVolume: formatPayoutsTotal(kpis.secondaryVolumeUsdt),
    holders: kpis.totalHolders != null ? String(kpis.totalHolders) : empty,
    listings: kpis.activeSecondaryListings != null ? String(kpis.activeSecondaryListings) : empty,
    avgProgress:
      kpis.avgProgressPct != null
        ? `${Number(kpis.avgProgressPct).toFixed(1).replace(".", ",")}%`
        : empty,
    avgLiquidity:
      kpis.avgLiquidityScore != null
        ? `${Number(kpis.avgLiquidityScore).toFixed(0)}%`
        : empty,
    topVolume: kpis.topReleaseByVolume?.title ?? empty,
    topVolumeHref: kpis.topReleaseByVolume?.id
      ? analyticsReleaseDetailPath(kpis.topReleaseByVolume.id)
      : undefined,
    topPayouts: kpis.topReleaseByPayouts?.title ?? empty,
    topPayoutsHref: kpis.topReleaseByPayouts?.id
      ? analyticsReleaseDetailPath(kpis.topReleaseByPayouts.id)
      : undefined,
    payoutLag: formatPayoutLag(kpis.payoutLagDaysMin, kpis.payoutLagDaysMax, locale),
  };
}

export function useReleaseAnalyticsState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { authorizedFetch } = useAuth();
  const { locale } = useI18n();
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
      setLoadError(localizedApiError(e, locale));
      setLiveRows([]);
      setPagination(null);
    } finally {
      setListLoading(false);
    }
  }, [authorizedFetch, listQuery, liveMode, locale]);

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
        period === "7d"
          ? formatPayoutLag(11, 11, locale)
          : period === "30d"
            ? formatPayoutLag(14, 14, locale)
            : period === "90d"
              ? formatPayoutLag(16, 16, locale)
              : formatPayoutLag(15, 15, locale),
    };
  }, [locale, period]);

  const emptyLiveStats = React.useMemo(() => {
    const empty = noDataLabel(locale);
    return {
      totalReleases: empty,
      avgYield: empty,
      active: empty,
      payoutsReleases: empty,
      primaryVolume: empty,
      payouts: empty,
      secondaryVolume: empty,
      holders: empty,
      listings: empty,
      avgProgress: empty,
      avgLiquidity: empty,
      topVolume: empty,
      topPayouts: empty,
      payoutLag: empty,
    } as const;
  }, [locale]);

  const stats = React.useMemo(() => {
    if (liveMode && overview) return overviewStatsFromApi(overview, locale);
    if (liveMode) return emptyLiveStats;
    return mockStats;
  }, [emptyLiveStats, liveMode, locale, mockStats, overview]);

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
