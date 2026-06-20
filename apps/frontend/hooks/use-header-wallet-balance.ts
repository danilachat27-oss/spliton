"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { formatApiError } from "@/lib/i18n/format-api-error";
import { formatUsdtAmount } from "@/lib/i18n/formatters";
import { getWalletDataSource } from "@/lib/public-env";
import { fetchWalletSummary } from "@/services/wallet.service";

export function useHeaderWalletBalance() {
  const { authorizedFetch, isAuthenticated, user } = useAuth();
  const { locale } = useI18n();
  const live = getWalletDataSource() === "live" && isAuthenticated;
  const [display, setDisplay] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!live) {
      setDisplay(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const s = await fetchWalletSummary(authorizedFetch);
      setDisplay(formatUsdtAmount(Number(s.availableBalance), locale));
    } catch (e) {
      setDisplay(null);
      setError(formatApiError(e, locale));
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    live,
    isAuthenticated,
    userEmail: user?.email ?? null,
    balanceLabel: loading ? "…" : display,
    balanceShort: loading ? "…" : display?.replace(/\sUSDT$/, "") ?? null,
    error,
    reload: load,
  };
}
