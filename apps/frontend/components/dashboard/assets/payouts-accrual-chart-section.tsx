"use client";

import { PayoutsAccrualChart } from "@/components/dashboard/assets/payouts-accrual-chart";
import { useI18n } from "@/components/providers/i18n-provider";
import { ReadOnlySectionError } from "@/components/shared/data-states/read-only-section-error";
import { usePortfolioPayoutsChart } from "@/hooks/use-portfolio-payouts-chart";
import { isFinancialMockFallbackAllowed } from "@/lib/live-data-policy";

export function PayoutsAccrualChartSection() {
  const { t } = useI18n();
  const mockAllowed = isFinancialMockFallbackAllowed();
  const chart = usePortfolioPayoutsChart("30d");

  if (!mockAllowed && !chart.live) {
    return (
      <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
        {t("payouts.chart.loginRequired")}
      </p>
    );
  }

  if (mockAllowed) {
    return (
      <div className="space-y-3">
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          {t("payouts.chart.demoBanner")}
        </p>
        <PayoutsAccrualChart />
      </div>
    );
  }

  if (chart.loading && chart.series.length === 0) {
    return (
      <div
        className="h-[min(420px,55vh)] animate-pulse rounded-3xl bg-neutral-100"
        aria-busy="true"
        aria-label={t("common.loading")}
      />
    );
  }

  if (chart.error) {
    return (
      <ReadOnlySectionError
        sectionId="payouts-accrual-chart"
        error={chart.error}
        onRetry={() => void chart.reload()}
      />
    );
  }

  if (chart.empty || chart.series.length === 0) {
    return (
      <p className="rounded-2xl bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600">
        {t("payouts.chart.empty")}
      </p>
    );
  }

  return (
    <PayoutsAccrualChart
      data={chart.series}
      range={chart.range}
      onRangeChange={chart.setRange}
      liveSeries
    />
  );
}
