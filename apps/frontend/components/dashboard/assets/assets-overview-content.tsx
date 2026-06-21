"use client";

import { MetricsAssetDynamicsChart } from "@/components/dashboard/assets/metrics-charts";
import { OverviewHero } from "@/components/dashboard/assets/overview-hero";
import { PortfolioOverviewEmptyState } from "@/components/dashboard/assets/portfolio-overview-empty-state";
import { PortfolioOverviewSkeleton } from "@/components/dashboard/assets/portfolio-overview-skeleton";
import { RecentActivityCard } from "@/components/dashboard/assets/recent-activity-card";
import { TopPositionsCard } from "@/components/dashboard/assets/top-positions-card";
import { useI18n } from "@/components/providers/i18n-provider";
import { ReadOnlySectionError } from "@/components/shared/data-states/read-only-section-error";
import {
  usePortfolioActivityLive,
  usePortfolioOverviewLive,
} from "@/hooks/use-portfolio-live";
import { usePortfolioValueChartLive } from "@/hooks/use-portfolio-charts";
import { useWalletCashflowTotals } from "@/hooks/use-wallet-cashflow-totals";
import { parseOverviewTotalUsdt } from "@/lib/portfolio/portfolio-adapter";

export function AssetsOverviewContent() {
  const { t } = useI18n();
  const {
    live,
    overview,
    walletSummary,
    topPositions,
    loading,
    walletLoading,
    error,
    reload,
  } = usePortfolioOverviewLive();
  const activity = usePortfolioActivityLive();
  const portfolioChart = usePortfolioValueChartLive();
  const cashflow = useWalletCashflowTotals();

  if (live && loading && !overview) {
    return <PortfolioOverviewSkeleton />;
  }

  if (live && error && !overview) {
    return (
      <ReadOnlySectionError
        sectionId="assets-overview"
        error={error}
        onRetry={reload}
      />
    );
  }

  const totalUsdt = overview ? parseOverviewTotalUsdt(overview.totalValue) : undefined;
  const isEmptyPortfolio = live && overview != null && overview.positionCount === 0;
  const recentActivityItems =
    live && activity.records
      ? activity.records.slice(0, 6).map((row) => ({
          id: row.id,
          type: row.typeKey ? t(`activity.widgets.type.${row.typeKey}`) : (row.type ?? t("common.empty")),
          detail: row.detailsKey ? t(`activity.widgets.details.${row.detailsKey}`) : (row.details ?? ""),
          amount: row.amount,
          date: row.relativeKey
            ? t(`activity.widgets.relative.${row.relativeKey}`)
            : (row.relative ?? row.date),
        }))
      : undefined;

  return (
    <div className="space-y-4 sm:space-y-5">
      {!live ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          {t("assets.overview.demoBanner")}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] lg:items-stretch lg:gap-5">
        <OverviewHero
          live={live}
          totalValueUsdt={totalUsdt}
          totalValueUnavailable={live && overview == null}
          change30dPct={overview?.change30dPct ?? null}
          walletSummary={walletSummary}
          walletLoading={walletLoading}
        />

        <RecentActivityCard
          preview
          live={live}
          items={recentActivityItems}
          loading={activity.loading}
          error={activity.error}
          onRetry={activity.reload}
          variant="statement"
        />
      </div>

      {isEmptyPortfolio ? (
        <PortfolioOverviewEmptyState />
      ) : (
        <TopPositionsCard rows={topPositions ?? undefined} live={live} loading={loading} compact />
      )}

      {live ? (
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
          dataSourceLabel="Spliton · live portfolio value"
        />
      ) : null}
    </div>
  );
}
