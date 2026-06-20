"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  adaptOverviewStats,
  adaptPositionRow,
  adaptStructureItems,
} from "@/lib/portfolio/portfolio-adapter";
import type { PositionPreviewItem } from "@/components/dashboard/assets/assets-mock-data";
import type { AssetsStat, PositionStructureItem } from "@/components/dashboard/assets/assets-mock-data";
import { getWalletDataSource } from "@/services/wallet.service";
import { fetchWalletSummary, walletErrorMessage, type WalletSummary } from "@/services/wallet.service";
import {
  fetchPortfolioMetrics,
  fetchPortfolioOverview,
  fetchPortfolioPositions,
  type PortfolioMetricsApi,
  type PortfolioOverviewApi,
} from "@/services/portfolio.service";
import { useWalletActivityLive } from "@/hooks/use-wallet-activity-live";

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : "Не удалось загрузить портфель";
}

export function usePortfolioLiveEnabled(): boolean {
  const { isAuthenticated } = useAuth();
  return getWalletDataSource() === "live" && isAuthenticated;
}

export function usePortfolioOverviewLive() {
  const { authorizedFetch } = useAuth();
  const { locale } = useI18n();
  const live = usePortfolioLiveEnabled();
  const [overview, setOverview] = useState<PortfolioOverviewApi | null>(null);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setWalletLoading(true);
    setError(null);
    setWalletError(null);
    try {
      const [overviewResult, walletResult] = await Promise.allSettled([
        fetchPortfolioOverview(authorizedFetch),
        fetchWalletSummary(authorizedFetch),
      ]);
      if (overviewResult.status === "fulfilled") {
        setOverview(overviewResult.value);
      } else {
        setOverview(null);
        setError(errMsg(overviewResult.reason));
      }

      if (walletResult.status === "fulfilled") {
        setWalletSummary(walletResult.value);
      } else {
        setWalletSummary(null);
        setWalletError(walletErrorMessage(walletResult.reason));
      }
    } catch (e) {
      setError(errMsg(e));
      setOverview(null);
      setWalletSummary(null);
      setWalletError(walletErrorMessage(e));
    } finally {
      setLoading(false);
      setWalletLoading(false);
    }
  }, [authorizedFetch, live]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats: AssetsStat[] | null = overview ? adaptOverviewStats(overview) : null;
  const topPositions: PositionPreviewItem[] | null = overview
    ? overview.topPositions.map((row) => adaptPositionRow(row, locale))
    : null;
  const genreStructure: PositionStructureItem[] | null = overview
    ? adaptStructureItems(overview.genreStructure)
    : null;
  const statusStructure: PositionStructureItem[] | null = overview
    ? adaptStructureItems(overview.statusStructure)
    : null;

  return {
    live,
    overview,
    stats,
    topPositions,
    genreStructure,
    statusStructure,
    loading,
    walletSummary,
    walletLoading,
    walletError,
    error,
    reload: load,
  };
}

export function usePortfolioPositionsLive() {
  const { authorizedFetch } = useAuth();
  const { locale } = useI18n();
  const live = usePortfolioLiveEnabled();
  const [rows, setRows] = useState<PositionPreviewItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPortfolioPositions(authorizedFetch);
      setRows(res.items.map((row) => adaptPositionRow(row, locale)));
    } catch (e) {
      setError(errMsg(e));
      setRows(null);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live]);

  useEffect(() => {
    void load();
  }, [load]);

  return { live, rows, loading, error, reload: load };
}

export function usePortfolioActivityLive() {
  const live = usePortfolioLiveEnabled();
  const walletActivity = useWalletActivityLive({ pageSize: 100 });
  return {
    live,
    records: walletActivity.activityRecords,
    loading: walletActivity.loading,
    error: walletActivity.error,
    reload: walletActivity.reload,
  };
}

export function usePortfolioMetricsLive() {
  const { authorizedFetch } = useAuth();
  const live = usePortfolioLiveEnabled();
  const [metrics, setMetrics] = useState<PortfolioMetricsApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setError(null);
    try {
      setMetrics(await fetchPortfolioMetrics(authorizedFetch));
    } catch (e) {
      setError(errMsg(e));
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live]);

  useEffect(() => {
    void load();
  }, [load]);

  const genreAllocation = metrics
    ? adaptStructureItems(metrics.genreAllocation)
    : null;
  const statusAllocation = metrics
    ? adaptStructureItems(metrics.statusAllocation)
    : null;

  return {
    live,
    metrics,
    genreAllocation,
    statusAllocation,
    loading,
    error,
    reload: load,
  };
}
