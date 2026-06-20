"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import type { ActivityFilterTab } from "@/components/dashboard/assets/activity-filters-bar";
import {
  ACTIVITY_RELEASE_ALL,
  ACTIVITY_STATUS_ALL,
} from "@/components/dashboard/assets/activity-filters-bar";
import { adaptWalletActivityToRecord } from "@/lib/wallet/wallet-activity-adapter";
import { isLivePortfolioEnabled } from "@/lib/public-env";
import {
  fetchPortfolioPositions,
  portfolioErrorMessage,
} from "@/services/portfolio.service";
import {
  fetchWalletActivity,
  walletErrorMessage,
  type WalletActivityList,
  type WalletActivityQuery,
} from "@/services/wallet.service";

export type ActivityPeriod = "7d" | "30d" | "90d" | "180d" | "1y" | "all";
export type ActivityDirection = "all" | "in" | "out";
export type ActivitySort = "newest" | "oldest" | "amount_desc" | "amount_asc";

export type ActivityPageFilters = {
  tab: ActivityFilterTab;
  period: ActivityPeriod;
  releaseId: string;
  status: string;
  direction: ActivityDirection;
  sort: ActivitySort;
  q: string;
  page: number;
  pageSize: number;
};

const DEFAULT_FILTERS: ActivityPageFilters = {
  tab: "all",
  period: "30d",
  releaseId: ACTIVITY_RELEASE_ALL,
  status: ACTIVITY_STATUS_ALL,
  direction: "all",
  sort: "newest",
  q: "",
  page: 1,
  pageSize: 20,
};

function tabToKind(tab: ActivityFilterTab): WalletActivityQuery["kind"] | undefined {
  if (tab === "all") return undefined;
  return tab;
}

function uiStatusToApi(status: string): WalletActivityQuery["status"] | undefined {
  switch (status) {
    case "Completed":
      return "completed";
    case "Pending":
      return "pending";
    case "Processing":
      return "processing";
    case "Cancelled":
      return "cancelled";
    default:
      return undefined;
  }
}

function buildApiQuery(filters: ActivityPageFilters, debouncedQ: string): WalletActivityQuery {
  const query: WalletActivityQuery = {
    period: filters.period,
    page: filters.page,
    limit: filters.pageSize,
    sort: filters.sort,
  };

  const kind = tabToKind(filters.tab);
  if (kind) query.kind = kind;

  const status = uiStatusToApi(filters.status);
  if (status) query.status = status;

  if (filters.releaseId !== ACTIVITY_RELEASE_ALL) {
    query.releaseId = filters.releaseId;
  }

  if (filters.direction === "in" || filters.direction === "out") {
    query.direction = filters.direction;
  }

  const q = debouncedQ.trim();
  if (q) query.q = q;

  return query;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function useAssetsActivityPage(initial: Partial<ActivityPageFilters> = {}) {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const { locale } = useI18n();
  const live = isLivePortfolioEnabled() && isAuthenticated;

  const [filters, setFilters] = useState<ActivityPageFilters>({
    ...DEFAULT_FILTERS,
    ...initial,
  });
  const debouncedQ = useDebouncedValue(filters.q, 350);

  const [data, setData] = useState<WalletActivityList | null>(null);
  const [releaseOptions, setReleaseOptions] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiQuery = useMemo(
    () => buildApiQuery(filters, debouncedQ),
    [filters, debouncedQ],
  );

  const loadReleases = useCallback(async () => {
    if (!live) return;
    try {
      const res = await fetchPortfolioPositions(authorizedFetch, {
        page: 1,
        limit: 100,
        sort: "value",
        sortDir: "desc",
      });
      const seen = new Set<string>();
      const options: { id: string; title: string }[] = [];
      for (const row of res.items) {
        if (seen.has(row.releaseId)) continue;
        seen.add(row.releaseId);
        options.push({ id: row.releaseId, title: row.release });
      }
      options.sort((a, b) => a.title.localeCompare(b.title, locale));
      setReleaseOptions(options);
    } catch {
      setReleaseOptions([]);
    }
  }, [authorizedFetch, live, locale]);

  const loadActivity = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWalletActivity(authorizedFetch, apiQuery);
      setData(res);
    } catch (e) {
      setError(walletErrorMessage(e) || portfolioErrorMessage(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, apiQuery, live]);

  useEffect(() => {
    void loadReleases();
  }, [loadReleases]);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  const records = useMemo(
    () => (data ? data.items.map((item) => adaptWalletActivityToRecord(item, locale)) : null),
    [data, locale],
  );

  const hasActiveFilters =
    filters.tab !== "all" ||
    filters.period !== "30d" ||
    filters.releaseId !== ACTIVITY_RELEASE_ALL ||
    filters.status !== ACTIVITY_STATUS_ALL ||
    filters.direction !== "all" ||
    debouncedQ.trim().length > 0;

  const updateFilters = useCallback((patch: Partial<ActivityPageFilters>) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      const resetsPage =
        patch.page === undefined &&
        (patch.tab !== undefined ||
          patch.period !== undefined ||
          patch.releaseId !== undefined ||
          patch.status !== undefined ||
          patch.direction !== undefined ||
          patch.sort !== undefined ||
          patch.q !== undefined);
      if (resetsPage) next.page = 1;
      return next;
    });
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page: Math.max(1, page) }));
  }, []);

  const reload = useCallback(async () => {
    await Promise.all([loadReleases(), loadActivity()]);
  }, [loadActivity, loadReleases]);

  return {
    live,
    filters,
    updateFilters,
    setPage,
    records,
    total: data?.total ?? 0,
    page: data?.page ?? filters.page,
    pageSize: data?.pageSize ?? filters.pageSize,
    hasMore: data?.hasMore ?? false,
    releaseOptions,
    loading,
    error,
    hasActiveFilters,
    reload,
  };
}
