"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { isLivePayoutsEnabled } from "@/lib/public-env";
import {
  fetchPayoutsCompare,
  portfolioErrorMessage,
  type PortfolioPayoutsCompareApi,
} from "@/services/portfolio.service";

export type PayoutCompareWindow = "7d" | "30d" | "90d";

export function usePayoutsCompare(window: PayoutCompareWindow = "30d") {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const live = isLivePayoutsEnabled() && isAuthenticated;

  const [data, setData] = useState<PortfolioPayoutsCompareApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPayoutsCompare(authorizedFetch, window);
      setData(res);
    } catch (e) {
      setData(null);
      setError(portfolioErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live, window]);

  useEffect(() => {
    void load();
  }, [load]);

  return { live, data, loading, error, reload: load };
}
