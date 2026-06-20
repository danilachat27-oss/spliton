"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { adaptPositionRow, adaptStructureItems } from "@/lib/portfolio/portfolio-adapter";
import { isLivePortfolioEnabled } from "@/lib/public-env";
import {
  fetchPortfolioMetrics,
  fetchPortfolioPositions,
  portfolioErrorMessage,
  type PortfolioMetricsApi,
  type PortfolioPositionApi,
} from "@/services/portfolio.service";
import {
  fetchWalletSummary,
  walletErrorMessage,
  type WalletSummary,
} from "@/services/wallet.service";

export type MetricsPositionsQuery = {
  q?: string;
  genre?: string;
  status?: string;
  sort?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export function usePortfolioMetricsPage(positionsQuery: MetricsPositionsQuery = {}) {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const { locale } = useI18n();
  const live = isLivePortfolioEnabled() && isAuthenticated;

  const [metrics, setMetrics] = useState<PortfolioMetricsApi | null>(null);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [positionsRaw, setPositionsRaw] = useState<PortfolioPositionApi[] | null>(null);
  const [positionsTotal, setPositionsTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [positionsError, setPositionsError] = useState<string | null>(null);

  const loadCore = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setWalletLoading(true);
    setError(null);
    setWalletError(null);
    const [metricsResult, walletResult] = await Promise.allSettled([
      fetchPortfolioMetrics(authorizedFetch),
      fetchWalletSummary(authorizedFetch),
    ]);
    if (metricsResult.status === "fulfilled") {
      setMetrics(metricsResult.value);
    } else {
      setError(portfolioErrorMessage(metricsResult.reason));
      setMetrics(null);
    }
    if (walletResult.status === "fulfilled") {
      setWalletSummary(walletResult.value);
    } else {
      setWalletError(walletErrorMessage(walletResult.reason));
      setWalletSummary(null);
    }
    setLoading(false);
    setWalletLoading(false);
  }, [authorizedFetch, live]);

  const loadPositions = useCallback(async () => {
    if (!live) return;
    setPositionsLoading(true);
    setPositionsError(null);
    try {
      const res = await fetchPortfolioPositions(authorizedFetch, {
        page: positionsQuery.page ?? 1,
        limit: positionsQuery.limit ?? 20,
        sort: positionsQuery.sort ?? "value",
        sortDir: positionsQuery.sortDir ?? "desc",
        q: positionsQuery.q,
        genre: positionsQuery.genre,
        status: positionsQuery.status,
      });
      setPositionsRaw(res.items);
      setPositionsTotal(res.total);
    } catch (e) {
      setPositionsError(portfolioErrorMessage(e));
      setPositionsRaw(null);
      setPositionsTotal(0);
    } finally {
      setPositionsLoading(false);
    }
  }, [
    authorizedFetch,
    live,
    positionsQuery.genre,
    positionsQuery.limit,
    positionsQuery.page,
    positionsQuery.q,
    positionsQuery.sort,
    positionsQuery.sortDir,
    positionsQuery.status,
  ]);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

  useEffect(() => {
    void loadPositions();
  }, [loadPositions]);

  const genreAllocation = metrics ? adaptStructureItems(metrics.genreAllocation) : null;
  const statusAllocation = metrics ? adaptStructureItems(metrics.statusAllocation) : null;
  const positionRows = useMemo(
    () => (positionsRaw ? positionsRaw.map((row) => adaptPositionRow(row, locale)) : null),
    [locale, positionsRaw],
  );

  const reload = useCallback(async () => {
    await Promise.all([loadCore(), loadPositions()]);
  }, [loadCore, loadPositions]);

  return {
    live,
    metrics,
    walletSummary,
    genreAllocation,
    statusAllocation,
    positionRows,
    positionsRaw,
    positionsTotal,
    loading,
    walletLoading,
    positionsLoading,
    error,
    walletError,
    positionsError,
    reload,
  };
}
