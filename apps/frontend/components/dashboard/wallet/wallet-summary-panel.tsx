"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { walletActivityStatusLabel } from "@/lib/i18n/wallet-activity-labels";
import { formatUsdtRu } from "@/lib/wallet/format-money";
import { adaptWalletActivityToRecord } from "@/lib/wallet/wallet-activity-adapter";
import {
  fetchWalletSummary,
  fetchWalletActivity,
  getWalletDataSource,
  type WalletActivityItem,
  type WalletSummary,
  walletErrorMessage,
} from "@/services/wallet.service";
import { ReadOnlySectionError } from "@/components/shared/data-states/read-only-section-error";
import { CopyValueButton } from "@/components/wallet/copy-value-button";
import { StyledSelect } from "@/components/ui/styled-select";
import { cn } from "@/lib/utils";

const TX_TYPES = [
  "all",
  "deposit",
  "withdrawal",
  "primary_purchase",
  "secondary_buy",
  "secondary_sell",
  "payout",
  "fee",
] as const;

const TX_TYPE_KEYS: Record<(typeof TX_TYPES)[number], string> = {
  all: "wallet.panel.filterAll",
  deposit: "wallet.status.txType.deposit",
  withdrawal: "wallet.status.txType.withdrawal",
  primary_purchase: "wallet.panel.filterPrimaryMarket",
  secondary_buy: "wallet.panel.filterSecondaryBuy",
  secondary_sell: "wallet.panel.filterSecondarySell",
  payout: "wallet.status.txType.payout",
  fee: "wallet.status.txType.fee",
};

export function WalletSummaryPanel({ className }: { className?: string }) {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const { locale, t } = useI18n();
  const live = getWalletDataSource() === "live" && isAuthenticated;
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [items, setItems] = useState<WalletActivityItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<(typeof TX_TYPES)[number]>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setError(null);
    try {
      const [s, activity] = await Promise.all([
        fetchWalletSummary(authorizedFetch),
        fetchWalletActivity(authorizedFetch, { page: 1, pageSize: 30 }),
      ]);
      setSummary(s);
      setItems(activity.items);
    } catch (e) {
      setError(walletErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live]);

  useEffect(() => {
    void load();
  }, [load]);

  const typeOptions = useMemo(
    () =>
      TX_TYPES.map((txType) => ({
        value: txType,
        label: t(TX_TYPE_KEYS[txType]),
      })),
    [t],
  );

  const filtered = useMemo(() => {
    if (typeFilter === "all") return items;
    return items.filter((item) => item.type === typeFilter);
  }, [items, typeFilter]);

  const displayRows = useMemo(
    () => filtered.map((item) => adaptWalletActivityToRecord(item, locale)),
    [filtered, locale],
  );

  if (!live) {
    return (
      <p className={cn("text-sm text-neutral-500", className)}>
        {t("wallet.summary.demoHint")}
      </p>
    );
  }

  if (loading && !summary) {
    return <p className={cn("text-sm text-neutral-500", className)}>{t("wallet.panel.loading")}</p>;
  }

  if (error) {
    return (
      <ReadOnlySectionError
        sectionId="wallet-summary-panel"
        error={error}
        onRetry={() => void load()}
        retryLabel={t("wallet.panel.retry")}
        className={className}
      />
    );
  }

  if (!summary) return null;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t("wallet.panel.available")} value={formatUsdtRu(summary.availableBalance)} />
        <Stat label={t("wallet.panel.locked")} value={formatUsdtRu(summary.lockedBalance)} />
        <Stat label={t("wallet.panel.earned")} value={formatUsdtRu(summary.earnedTotal)} />
        <Stat label={t("wallet.panel.withdrawn")} value={formatUsdtRu(summary.withdrawnTotal)} />
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
        <span>
          {t("wallet.panel.depositsTotal")}: {formatUsdtRu(summary.totalDeposits)}
        </span>
        <span>
          {t("wallet.panel.pendingWithdrawals")}: {summary.pendingWithdrawalsCount}
        </span>
        <span>
          {summary.asset} · {summary.network}
        </span>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-neutral-900">{t("wallet.panel.operations")}</h3>
          <StyledSelect
            size="sm"
            align="end"
            value={typeFilter}
            options={typeOptions}
            onChange={(next) => setTypeFilter(next as (typeof TX_TYPES)[number])}
            aria-label={t("wallet.panel.filterTypeAria")}
          />
        </div>
        {displayRows.length === 0 ? (
          <p className="text-sm text-neutral-500">{t("wallet.panel.emptyOperations")}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-neutral-100">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-neutral-50 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                <tr>
                  <th className="px-4 py-2">{t("wallet.panel.columnDate")}</th>
                  <th className="px-4 py-2">{t("wallet.panel.columnType")}</th>
                  <th className="px-4 py-2">{t("wallet.panel.columnAmount")}</th>
                  <th className="px-4 py-2">Units</th>
                  <th className="px-4 py-2">{t("wallet.panel.columnStatus")}</th>
                  <th className="px-4 py-2">ID</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <tr key={row.id} className="border-t border-neutral-100">
                    <td className="px-4 py-2 text-neutral-600">{row.date}</td>
                    <td className="px-4 py-2">{row.type}</td>
                    <td className="px-4 py-2 font-mono tabular-nums">{row.amount}</td>
                    <td className="px-4 py-2 text-neutral-500">{row.units}</td>
                    <td className="px-4 py-2">{walletActivityStatusLabel(row.status, locale)}</td>
                    <td className="px-4 py-2">
                      <CopyValueButton value={row.txId} label="ID" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-neutral-50 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-neutral-900">{value}</p>
    </div>
  );
}
