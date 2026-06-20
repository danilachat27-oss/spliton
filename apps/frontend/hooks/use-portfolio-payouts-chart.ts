"use client";

import { useCallback, useEffect, useState } from "react";

import type { PayoutAccrualChartPoint } from "@/components/dashboard/assets/payouts-mock-data";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  adaptPayoutChartPoints,
  mapPayoutChartRangeToApi,
  payoutChartKpiFromSeries,
  type PayoutChartRangeId,
} from "@/lib/portfolio/payouts-chart-adapter";
import { isLivePortfolioEnabled } from "@/lib/public-env";
import { portfolioErrorMessage, fetchPortfolioPayoutsChart } from "@/services/portfolio.service";

export function usePortfolioPayoutsChart(initialRange: PayoutChartRangeId = "30d") {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const { locale } = useI18n();
  const live = isLivePortfolioEnabled() && isAuthenticated;
  const [range, setRange] = useState<PayoutChartRangeId>(initialRange);
  const [series, setSeries] = useState<PayoutAccrualChartPoint[]>([]);
  const [loading, setLoading] = useState(live);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);
  const [totalPaid, setTotalPaid] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPortfolioPayoutsChart(
        authorizedFetch,
        mapPayoutChartRangeToApi(range),
      );
      const adapted = adaptPayoutChartPoints(data.points, locale);
      setSeries(adapted);
      setEmpty(adapted.length === 0);
      const paid = data.summary.totalPaid;
      setTotalPaid(typeof paid === "string" ? paid : null);
    } catch (e) {
      setError(portfolioErrorMessage(e));
      setSeries([]);
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live, locale, range]);

  useEffect(() => {
    void load();
  }, [load]);

  const kpi = payoutChartKpiFromSeries(series);

  return {
    live,
    range,
    setRange,
    series,
    kpi,
    totalPaid,
    loading,
    error,
    empty,
    reload: load,
  };
}
