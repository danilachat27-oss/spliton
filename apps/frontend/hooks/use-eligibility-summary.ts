"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { isLiveAccountEnabled } from "@/lib/public-env";
import {
  fetchEligibilitySummary,
  type EligibilitySummary,
} from "@/services/legal.service";

export function useEligibilitySummary() {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const live = isLiveAccountEnabled() && isAuthenticated;

  const [data, setData] = useState<EligibilitySummary | null>(null);
  const [loading, setLoading] = useState(live);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!live) {
      setLoading(false);
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const summary = await fetchEligibilitySummary(authorizedFetch);
      setData(summary);
    } catch {
      setData(null);
      setError("verification.eligibility.loadError");
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { live, data, loading, error, reload };
}
