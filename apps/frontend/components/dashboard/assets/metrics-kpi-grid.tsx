"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { assetsCardClass } from "@/components/dashboard/assets/assets-ui";
import { EmptyState } from "@/components/shared/data-states/empty-state";
import { formatUsdtAmount } from "@/lib/i18n/formatters";
import type { PortfolioMetricsOverviewApi } from "@/services/portfolio.service";
import type { WalletSummary } from "@/services/wallet.service";

function parseMoney(raw: string | undefined | null): number | null {
  if (raw == null) return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

function fmt(value: string | null | undefined, locale: Parameters<typeof formatUsdtAmount>[1]): string {
  const n = parseMoney(value ?? undefined);
  if (n == null) return "—";
  return formatUsdtAmount(n, locale);
}

type MetricsKpiGridProps = {
  live?: boolean;
  overview?: PortfolioMetricsOverviewApi | null;
  wallet?: WalletSummary | null;
  loading?: boolean;
  error?: boolean;
};

export function MetricsKpiGrid({ live = false, overview, wallet, loading, error }: MetricsKpiGridProps) {
  const { t, locale } = useI18n();

  if (!live) return null;

  if (loading && !overview && !wallet) {
    return (
      <section aria-label={t("assets.metrics.kpiAria")} className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={cnSkeleton()} />
        ))}
      </section>
    );
  }

  if (error && !overview && !wallet) {
    return (
      <section aria-label={t("assets.metrics.kpiAria")}>
        <EmptyState message={t("assets.metrics.metricsUnavailable")} />
      </section>
    );
  }

  const cards = [
    {
      label: t("assets.metrics.statTodayChange"),
      value: overview?.change30dPct ? `$0` : "$0",
      hint: overview?.change30dPct ?? "0,00%",
    },
    {
      label: t("assets.metrics.statMonthChange"),
      value: "$0",
      hint: "0,00%",
    },
    {
      label: t("assets.metrics.statHoldingsValue"),
      value: fmt(overview?.portfolioValueUsdt, locale),
      hint: t("assets.metrics.kpiPortfolioValueHint"),
    },
  ];

  return (
    <section aria-label={t("assets.metrics.kpiAria")} className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {cards.map((item) => (
        <article key={item.label} className={assetsCardClass}>
          <p className="text-sm text-neutral-500">{item.label}</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight text-neutral-900 sm:text-[1.75rem]">
            {item.value}
          </p>
          <p className="mt-1 text-sm text-neutral-500">{item.hint}</p>
        </article>
      ))}
    </section>
  );
}

function cnSkeleton() {
  return "h-28 animate-pulse rounded-2xl bg-white";
}
