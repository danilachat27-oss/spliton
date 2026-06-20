"use client";

import { assetsCardClass, assetsPanelClass } from "@/components/dashboard/assets/assets-ui";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/data-states/empty-state";
import { formatUsdtAmount } from "@/lib/i18n/formatters";
import type { PortfolioMetricsApi } from "@/services/portfolio.service";

function parseMoney(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

export function MetricsPerformanceCard({
  live = false,
  performance,
  loading = false,
}: {
  live?: boolean;
  performance?: PortfolioMetricsApi["performance"] | null;
  loading?: boolean;
}) {
  const { t, locale } = useI18n();

  if (!live) return null;

  const accrued = parseMoney(performance?.totalAccrued);
  const paid = parseMoney(performance?.realizedIncome);
  const pending = parseMoney(performance?.pendingPayouts);
  const hasData =
    (accrued != null && accrued > 0) ||
    (paid != null && paid > 0) ||
    (pending != null && pending > 0);

  return (
    <section className={assetsCardClass} aria-label={t("metrics.pnlAria")}>
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Metrics · Accrued vs paid
        </p>
        <h3 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
          {t("assets.metrics.accruedVsPaidTitle")}
        </h3>
        <p className="text-sm text-neutral-500">{t("assets.metrics.accruedVsPaidHint")}</p>
      </div>
      {loading && !performance ? (
        <div className="h-40 animate-pulse rounded-2xl bg-neutral-50" />
      ) : !hasData ? (
        <EmptyState message={t("assets.metrics.payoutsAfterFirstPeriod")} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: t("assets.metrics.kpiTotalAccrued"),
              value: accrued != null ? formatUsdtAmount(accrued, locale) : "—",
            },
            {
              label: t("assets.metrics.kpiTotalPaid"),
              value: paid != null ? formatUsdtAmount(paid, locale) : "—",
            },
            {
              label: t("assets.metrics.kpiPendingPayouts"),
              value: pending != null ? formatUsdtAmount(pending, locale) : "—",
            },
          ].map((item) => (
            <article
              key={item.label}
              className={cn(assetsPanelClass, "px-4 py-4")}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                {item.label}
              </p>
              <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-neutral-900">
                {item.value}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
