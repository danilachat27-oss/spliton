"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import type { PayoutHistoryRow } from "@/components/dashboard/assets/payouts-mock-data";
import { isLivePayoutsEnabled } from "@/lib/public-env";
import { adaptWalletActivityToPayoutHistory } from "@/lib/wallet/wallet-activity-adapter";
import {
  fetchPayoutsHistory,
  portfolioErrorMessage,
} from "@/services/portfolio.service";
import type { WalletActivityList } from "@/services/wallet.service";

export type PayoutHistoryTypeFilter = "all" | PayoutHistoryRow["type"];

export type PayoutHistoryPageFilters = {
  type: PayoutHistoryTypeFilter;
  period: "7d" | "30d" | "90d" | "180d" | "1y" | "all";
  q: string;
  sort: "newest" | "oldest" | "amount_desc" | "amount_asc";
  page: number;
  pageSize: number;
};

const DEFAULT_FILTERS: PayoutHistoryPageFilters = {
  type: "all",
  period: "all",
  q: "",
  sort: "newest",
  page: 1,
  pageSize: 20,
};

function historyTypeToApi(type: PayoutHistoryTypeFilter): string | undefined {
  switch (type) {
    case "accrual":
      return "deposit";
    case "payout":
      return "payout";
    case "withdrawal":
      return "withdrawal";
    case "adjustment":
      return "admin_adjustment";
    default:
      return undefined;
  }
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function usePayoutsHistoryPage(initial: Partial<PayoutHistoryPageFilters> = {}) {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const { locale } = useI18n();
  const live = isLivePayoutsEnabled() && isAuthenticated;

  const [filters, setFilters] = useState<PayoutHistoryPageFilters>({
    ...DEFAULT_FILTERS,
    ...initial,
  });
  const debouncedQ = useDebouncedValue(filters.q, 350);

  const [data, setData] = useState<WalletActivityList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setError(null);
    try {
      const apiType = historyTypeToApi(filters.type);
      const res = await fetchPayoutsHistory(authorizedFetch, {
        period: filters.period === "all" ? undefined : filters.period,
        type: apiType,
        sort: filters.sort,
        page: filters.page,
        limit: filters.pageSize,
        q: debouncedQ.trim() || undefined,
      });
      setData(res);
    } catch (e) {
      setData(null);
      setError(portfolioErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [
    authorizedFetch,
    debouncedQ,
    filters.page,
    filters.pageSize,
    filters.period,
    filters.sort,
    filters.type,
    live,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows: PayoutHistoryRow[] | null = useMemo(
    () =>
      data
        ? data.items.map((item) => adaptWalletActivityToPayoutHistory(item, locale))
        : null,
    [data, locale],
  );

  const updateFilters = useCallback(
    (patch: Partial<PayoutHistoryPageFilters>) => {
      setFilters((prev) => ({
        ...prev,
        ...patch,
        page: patch.page ?? (patch.type || patch.period || patch.q != null ? 1 : prev.page),
      }));
    },
    [],
  );

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const hasActiveFilters =
    filters.type !== "all" ||
    filters.period !== "all" ||
    filters.q.trim().length > 0;

  return {
    live,
    filters,
    updateFilters,
    setPage,
    rows,
    total: data?.total ?? 0,
    page: data?.page ?? filters.page,
    pageSize: data?.pageSize ?? filters.pageSize,
    hasMore: data?.hasMore ?? false,
    loading,
    error,
    hasActiveFilters,
    reload: load,
  };
}
