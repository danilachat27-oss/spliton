"use client";

import { assetsMutedCardClass } from "@/components/dashboard/assets/assets-ui";
import { useI18n } from "@/components/providers/i18n-provider";
import { EmptyState } from "@/components/shared/data-states/empty-state";
import { formatUsdtAmount } from "@/lib/i18n/formatters";
import { emptyAmountLabel, emptyValueLabel } from "@/lib/analytics/display-value";
import type { WalletSummary } from "@/services/wallet.service";

function parseMoney(raw: string | undefined): number | null {
  if (raw == null) return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

function formatOrDash(value: string | undefined, locale: Parameters<typeof formatUsdtAmount>[1]): string {
  const n = parseMoney(value);
  if (n == null) return emptyAmountLabel(locale);
  return formatUsdtAmount(n, locale);
}

type PortfolioOverviewWalletKpiProps = {
  live?: boolean;
  summary?: WalletSummary | null;
  loading?: boolean;
  error?: string | null;
};

export function PortfolioOverviewWalletKpi({
  live = false,
  summary,
  loading,
  error,
}: PortfolioOverviewWalletKpiProps) {
  const { t, locale } = useI18n();

  if (!live) return null;

  if (loading && !summary) {
    return (
      <section aria-label={t("assets.overview.walletKpiAria")}>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-neutral-50" />
          ))}
        </div>
      </section>
    );
  }

  if (error && !summary) {
    return (
      <section aria-label={t("assets.overview.walletKpiAria")}>
        <EmptyState message={t("assets.overview.metricsUnavailable")} />
      </section>
    );
  }

  if (!summary) {
    return (
      <section aria-label={t("assets.overview.walletKpiAria")}>
        <EmptyState message={t("assets.overview.insufficientData")} />
      </section>
    );
  }

  const available = parseMoney(summary.availableBalance);
  const locked = parseMoney(summary.lockedBalance);
  const pending = parseMoney(summary.pendingBalance);
  const total =
    available != null && locked != null && pending != null
      ? available + locked + pending
      : null;

  const cards = [
    {
      label: t("assets.overview.walletTotal"),
      value: total != null ? formatUsdtAmount(total, locale) : emptyAmountLabel(locale),
      hint: t("assets.overview.walletTotalHint"),
    },
    {
      label: t("assets.overview.walletAvailable"),
      value: formatOrDash(summary.availableBalance, locale),
      hint: t("assets.overview.walletAvailableHint"),
    },
    {
      label: t("assets.overview.walletLocked"),
      value: formatOrDash(summary.lockedBalance, locale),
      hint: t("assets.overview.walletLockedHint"),
    },
    {
      label: t("assets.overview.walletPending"),
      value: formatOrDash(summary.pendingBalance, locale),
      hint: t("assets.overview.walletPendingHint"),
    },
    {
      label: t("assets.overview.walletEarned"),
      value: formatOrDash(summary.earnedTotal, locale),
      hint: t("assets.overview.walletEarnedHint"),
    },
    {
      label: t("assets.overview.walletWithdrawn"),
      value: formatOrDash(summary.withdrawnTotal, locale),
      hint: t("assets.overview.walletWithdrawnHint"),
    },
    {
      label: t("assets.overview.walletDeposits"),
      value: formatOrDash(summary.totalDeposits, locale),
      hint: t("assets.overview.walletDepositsHint"),
    },
    {
      label: t("assets.overview.walletPendingWithdrawals"),
      value: String(summary.pendingWithdrawalsCount ?? emptyValueLabel(locale)),
      hint: t("assets.overview.walletPendingWithdrawalsHint"),
    },
  ];

  return (
    <section aria-label={t("assets.overview.walletKpiAria")}>
      <div className="mb-4 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Wallet · USDT
        </p>
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
          {t("assets.overview.walletKpiTitle")}
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {cards.map((item) => (
          <article
            key={item.label}
            className={assetsMutedCardClass}
            title={item.hint}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              {item.label}
            </p>
            <p className="mt-2 font-mono text-lg font-semibold tabular-nums tracking-tight text-neutral-900 sm:text-xl">
              {item.value}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
