"use client";

import { MetricsAssetDynamicsChart, MetricsResultsChart } from "@/components/dashboard/assets/metrics-charts";
import { MetricsEmptyState } from "@/components/dashboard/assets/metrics-empty-state";
import { MetricsIncomeChart } from "@/components/dashboard/assets/metrics-income-chart";
import { MetricsPageSkeleton } from "@/components/dashboard/assets/metrics-page-skeleton";
import { MetricsPerformanceCard } from "@/components/dashboard/assets/metrics-performance-card";
import { MetricsDailyBreakdownCard } from "@/components/dashboard/assets/metrics-daily-breakdown-card";
import { MetricsKpiGrid } from "@/components/dashboard/assets/metrics-kpi-grid";
import { useI18n } from "@/components/providers/i18n-provider";
import { ReadOnlySectionError } from "@/components/shared/data-states/read-only-section-error";
import { usePortfolioMetricsPage } from "@/hooks/use-portfolio-metrics-page";
import { usePortfolioValueChartLive } from "@/hooks/use-portfolio-charts";
import { useWalletCashflowTotals } from "@/hooks/use-wallet-cashflow-totals";
import { isLivePortfolioEnabled } from "@/lib/public-env";

export function AssetsMetricsContent() {
  const { t } = useI18n();
  const live = isLivePortfolioEnabled();
  const page = usePortfolioMetricsPage({ page: 1, limit: 1, sort: "value", sortDir: "desc" });
  const portfolioChart = usePortfolioValueChartLive();
  const cashflow = useWalletCashflowTotals();

  if (page.live && page.loading && !page.metrics) {
    return <MetricsPageSkeleton />;
  }

  if (page.live && page.error && !page.metrics) {
    return (
      <ReadOnlySectionError
        sectionId="assets-metrics"
        error={page.error}
        onRetry={page.reload}
      />
    );
  }

  const isEmptyPortfolio =
    page.live && page.metrics != null && page.metrics.overview.activePositions === 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      {!page.live ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          {t("assets.metrics.demoBanner")}
        </p>
      ) : null}

      <MetricsKpiGrid
        live={page.live}
        overview={page.metrics?.overview}
        wallet={page.walletSummary}
        loading={page.loading || page.walletLoading}
        error={Boolean(page.error && page.walletError && !page.metrics && !page.walletSummary)}
      />

      {isEmptyPortfolio ? <MetricsEmptyState /> : null}

      <section className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        {page.live ? (
          <MetricsPerformanceCard live performance={page.metrics?.performance} loading={page.loading} />
        ) : (
          <MetricsResultsChart />
        )}
        <MetricsAssetDynamicsChart
          compact
          isLiveMode={portfolioChart.live}
          liveSeries={portfolioChart.live ? portfolioChart.series : null}
          liveLoading={portfolioChart.live && portfolioChart.loading}
          liveEmpty={portfolioChart.live && portfolioChart.empty}
          liveError={portfolioChart.live ? portfolioChart.error : null}
          onRetry={portfolioChart.reload}
          cashflowTotals={cashflow.live ? cashflow.totals : null}
          cashflowLoading={cashflow.live && cashflow.loading}
          cashflowError={cashflow.live ? cashflow.error : null}
          dataSourceLabel={portfolioChart.live ? "Spliton · live portfolio value" : undefined}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        {page.live ? (
          <MetricsIncomeChart live rows={page.metrics?.incomeByPeriod} loading={page.loading} />
        ) : (
          <MetricsDailyBreakdownCard />
        )}
      </section>
    </div>
  );
}
