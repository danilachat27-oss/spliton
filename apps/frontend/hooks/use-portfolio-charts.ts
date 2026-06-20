"use client";

import { useCallback, useEffect, useState } from "react";

import type { MetricsPoint } from "@/components/dashboard/assets/metrics-charts";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { DEFAULT_CHART_PERIOD, type ChartPeriodId } from "@/lib/analytics/chart-period";
import { formatDate } from "@/lib/i18n/formatters";
import type { AppLocale } from "@/lib/i18n/types";
import { isLivePortfolioEnabled } from "@/lib/public-env";
import { portfolioErrorMessage, fetchPortfolioValueChart } from "@/services/portfolio.service";

function parseMoney(value: string): number {
  const n = Number(value.replace(/[^\d.-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function toMetricsPoints(
  points: Array<{ timestamp: string; value: number }>,
  locale: AppLocale,
): MetricsPoint[] {
  return points.map((p) => ({
    label: formatDate(p.timestamp, locale, { day: "2-digit", month: "short" }),
    primary: p.value,
  }));
}

export function usePortfolioValueChartLive() {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const { locale } = useI18n();
  const live = isLivePortfolioEnabled() && isAuthenticated;
  const [period, setPeriod] = useState<ChartPeriodId>(DEFAULT_CHART_PERIOD);
  const [series, setSeries] = useState<MetricsPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>();

  const load = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPortfolioValueChart(authorizedFetch, period);
      setSeries(toMetricsPoints(data.points, locale));
      setEmpty(data.points.length === 0);
      setLastUpdated(data.lastUpdatedAt);
    } catch (e) {
      setError(portfolioErrorMessage(e));
      setSeries([]);
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live, locale, period]);

  useEffect(() => {
    void load();
  }, [load]);

  return { live, period, setPeriod, series, loading, error, empty, lastUpdated, reload: load };
}
