"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { isLivePayoutsEnabled } from "@/lib/public-env";
import {
  fetchPayoutsOverview,
  portfolioErrorMessage,
  type PortfolioPayoutsOverviewApi,
} from "@/services/portfolio.service";

export function usePayoutsOverview() {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const live = isLivePayoutsEnabled() && isAuthenticated;

  const [data, setData] = useState<PortfolioPayoutsOverviewApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPayoutsOverview(authorizedFetch);
      setData(res);
    } catch (e) {
      setData(null);
      setError(portfolioErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live]);

  useEffect(() => {
    void load();
  }, [load]);

  return { live, data, loading, error, reload: load };
}
