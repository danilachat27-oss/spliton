"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  adaptWalletActivityToPayoutHistory,
  adaptWalletActivityToRecord,
} from "@/lib/wallet/wallet-activity-adapter";
import type { ActivityRecord } from "@/components/dashboard/assets/activity-mock-data";
import type { PayoutHistoryRow } from "@/components/dashboard/assets/payouts-mock-data";
import {
  fetchWalletActivity,
  getWalletDataSource,
  walletErrorMessage,
  type WalletActivityList,
  type WalletActivityQuery,
} from "@/services/wallet.service";

export function useWalletActivityLiveEnabled(): boolean {
  const { isAuthenticated } = useAuth();
  return getWalletDataSource() === "live" && isAuthenticated;
}

export function useWalletActivityLive(query: WalletActivityQuery = { pageSize: 100 }) {
  const { authorizedFetch } = useAuth();
  const { locale } = useI18n();
  const live = useWalletActivityLiveEnabled();
  const [data, setData] = useState<WalletActivityList | null>(null);
  const [activityRecords, setActivityRecords] = useState<ActivityRecord[] | null>(null);
  const [payoutHistoryRows, setPayoutHistoryRows] = useState<PayoutHistoryRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWalletActivity(authorizedFetch, {
        page: 1,
        pageSize: 100,
        ...query,
      });
      setData(res);
      setActivityRecords(res.items.map((row) => adaptWalletActivityToRecord(row, locale)));
      setPayoutHistoryRows(res.items.map((row) => adaptWalletActivityToPayoutHistory(row, locale)));
    } catch (e) {
      setError(walletErrorMessage(e));
      setData(null);
      setActivityRecords(null);
      setPayoutHistoryRows(null);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live, query.asset, query.from, query.pageSize, query.releaseId, query.status, query.to, query.type]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    live,
    data,
    activityRecords,
    payoutHistoryRows,
    loading,
    error,
    reload: load,
  };
}
