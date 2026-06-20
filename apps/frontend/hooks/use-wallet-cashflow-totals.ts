"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { portfolioErrorMessage } from "@/services/portfolio.service";
import { isLivePortfolioEnabled } from "@/lib/public-env";
import { fetchWalletActivity } from "@/services/wallet.service";

export type WalletCashflowTotals = {
  deposits30d: number;
  withdrawals30d: number;
};

function parseAmount(raw: string): number {
  const n = Number.parseFloat(raw.replace(/[^\d.-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.abs(n) : 0;
}

export function useWalletCashflowTotals() {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const live = isLivePortfolioEnabled() && isAuthenticated;
  const [totals, setTotals] = useState<WalletCashflowTotals | null>(null);
  const [loading, setLoading] = useState(live);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setError(null);
    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const res = await fetchWalletActivity(authorizedFetch, { page: 1, pageSize: 100 });
      let deposits30d = 0;
      let withdrawals30d = 0;
      for (const item of res.items) {
        const at = new Date(item.createdAt);
        if (Number.isNaN(at.getTime()) || at < since) continue;
        const amount = parseAmount(item.amountSigned || item.amount);
        if (item.type === "deposit") deposits30d += amount;
        else if (item.type === "withdrawal") withdrawals30d += amount;
      }
      setTotals({ deposits30d, withdrawals30d });
    } catch (e) {
      setError(portfolioErrorMessage(e));
      setTotals(null);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live]);

  useEffect(() => {
    void load();
  }, [load]);

  return { live, totals, loading, error, reload: load };
}
