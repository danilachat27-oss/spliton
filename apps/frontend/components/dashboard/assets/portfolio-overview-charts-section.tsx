"use client";

import { MetricsAssetDynamicsChart } from "@/components/dashboard/assets/metrics-charts";
import { PayoutsAccrualChartSection } from "@/components/dashboard/assets/payouts-accrual-chart-section";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePortfolioValueChartLive } from "@/hooks/use-portfolio-charts";
import { useWalletCashflowTotals } from "@/hooks/use-wallet-cashflow-totals";

export function PortfolioOverviewChartsSection({ live = false }: { live?: boolean }) {
  const { t } = useI18n();
  const portfolioChart = usePortfolioValueChartLive();
  const cashflow = useWalletCashflowTotals();

  if (!live) {
    return null;
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2 lg:gap-8" aria-label={t("assets.overview.chartsAria")}>
      <div className="space-y-3">
        <div className="space-y-1 px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Portfolio · Chart
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
            {t("assets.overview.valueChartTitle")}
          </h2>
          <p className="text-sm text-neutral-500">{t("assets.overview.valueChartHint")}</p>
        </div>
        <MetricsAssetDynamicsChart
          isLiveMode={portfolioChart.live}
          liveSeries={portfolioChart.live ? portfolioChart.series : null}
          liveLoading={portfolioChart.live && portfolioChart.loading}
          liveEmpty={portfolioChart.live && portfolioChart.empty}
          liveError={portfolioChart.live ? portfolioChart.error : null}
          onRetry={portfolioChart.reload}
          cashflowTotals={cashflow.live ? cashflow.totals : null}
          cashflowLoading={cashflow.live && cashflow.loading}
          cashflowError={cashflow.live ? cashflow.error : null}
          dataSourceLabel="Spliton · live portfolio value"
        />
      </div>

      <div className="space-y-3">
        <div className="space-y-1 px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Payouts · Chart
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
            {t("assets.overview.payoutsChartTitle")}
          </h2>
          <p className="text-sm text-neutral-500">{t("assets.overview.payoutsChartHint")}</p>
        </div>
        <PayoutsAccrualChartSection />
      </div>
    </section>
  );
}
