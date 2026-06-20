"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { DEFAULT_CHART_PERIOD, type ChartPeriodId } from "@/lib/analytics/chart-period";
import {
  chartPointsToValues,
  fetchMarketLiquidityChart,
  fetchMarketPriceChart,
  fetchMarketVolumeChart,
  type ChartSeriesApi,
} from "@/services/market-charts.service";
import { getWalletDataSource } from "@/services/wallet.service";

export function useSecondaryMarketCharts(releaseId: string | null) {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const live = getWalletDataSource() === "live" && isAuthenticated;
  const [period, setPeriod] = useState<ChartPeriodId>(DEFAULT_CHART_PERIOD);
  const [price, setPrice] = useState<ChartSeriesApi | null>(null);
  const [volume, setVolume] = useState<ChartSeriesApi | null>(null);
  const [liquidity, setLiquidity] = useState<ChartSeriesApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!live || !releaseId) return;
    setLoading(true);
    setError(null);
    try {
      const [p, v, l] = await Promise.all([
        fetchMarketPriceChart(releaseId, period, authorizedFetch),
        fetchMarketVolumeChart(releaseId, period, authorizedFetch),
        fetchMarketLiquidityChart(releaseId, period, authorizedFetch),
      ]);
      setPrice(p);
      setVolume(v);
      setLiquidity(l);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить графики");
      setPrice(null);
      setVolume(null);
      setLiquidity(null);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live, period, releaseId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    live,
    period,
    setPeriod,
    loading,
    error,
    reload: load,
    priceValues: price ? chartPointsToValues(price) : [],
    volumeValues: volume ? chartPointsToValues(volume) : [],
    liquidityValues: liquidity ? chartPointsToValues(liquidity) : [],
    priceChart: price,
    volumeChart: volume,
    liquidityChart: liquidity,
  };
}
