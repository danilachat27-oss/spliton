"use client";

import { AnalyticsStatCard } from "@/components/shared/analytics/analytics-stat-card";
import { PeriodButton } from "@/components/shared/exchange/period-button";
import { CatalogStatsSkeleton } from "@/features/catalog/ui/catalog-skeleton";
import { releaseAnalyticsPeriodLabel } from "@/lib/analytics/period-label";
import type { ReleaseAnalyticsOverviewApi } from "@/services/release-analytics.service";
import type { ReleaseAnalyticsPeriod } from "@/types/analytics/releases";

import { YieldDynamicsChart } from "../ui/yield-dynamics-chart";

const STAT_CARD_BACKGROUNDS = {
  metric: "/images/myactiv/metrik.png",
  active: "/images/catalogbuy/2.png",
  payouts: "/images/gotov/1.png",
  volume: "/images/assetsunt/backgraund.png",
} as const;

const NO_DATA = "Недостаточно данных";

export type ReleaseAnalyticsOverviewStats = {
  totalReleases: string;
  avgYield: string;
  active: string;
  payoutsReleases: string;
  primaryVolume: string;
  payouts: string;
  secondaryVolume: string;
  holders: string;
  listings: string;
  avgProgress: string;
  avgLiquidity: string;
  topVolume: string;
  topVolumeHref?: string;
  topPayouts: string;
  topPayoutsHref?: string;
  payoutLag: string;
};

export function ReleaseAnalyticsOverviewSection({
  period,
  onPeriodChange,
  stats,
  overview,
  loading,
  overviewError,
  mockMode,
}: {
  period: ReleaseAnalyticsPeriod;
  onPeriodChange: (p: ReleaseAnalyticsPeriod) => void;
  stats: ReleaseAnalyticsOverviewStats;
  overview?: ReleaseAnalyticsOverviewApi | null;
  loading?: boolean;
  overviewError?: boolean;
  mockMode?: boolean;
}) {
  const kpiCards: {
    label: string;
    value: string;
    bg: (typeof STAT_CARD_BACKGROUNDS)[keyof typeof STAT_CARD_BACKGROUNDS];
    href?: string;
  }[] = [
    { label: "Всего релизов", value: stats.totalReleases, bg: STAT_CARD_BACKGROUNDS.metric },
    { label: "Активные релизы", value: stats.active, bg: STAT_CARD_BACKGROUNDS.active },
    { label: "С выплатами", value: stats.payoutsReleases, bg: STAT_CARD_BACKGROUNDS.payouts },
    { label: "Первичный объём", value: stats.primaryVolume, bg: STAT_CARD_BACKGROUNDS.volume },
    { label: "Вторичный объём", value: stats.secondaryVolume, bg: STAT_CARD_BACKGROUNDS.volume },
    { label: "Начисления/выплаты", value: stats.payouts, bg: STAT_CARD_BACKGROUNDS.payouts },
    { label: "Средняя доходность", value: stats.avgYield, bg: STAT_CARD_BACKGROUNDS.metric },
    { label: "Средний прогресс", value: stats.avgProgress, bg: STAT_CARD_BACKGROUNDS.active },
    { label: "Средняя ликвидность", value: stats.avgLiquidity, bg: STAT_CARD_BACKGROUNDS.metric },
    { label: "Холдеры", value: stats.holders, bg: STAT_CARD_BACKGROUNDS.active },
    { label: "Листинги", value: stats.listings, bg: STAT_CARD_BACKGROUNDS.payouts },
    {
      label: "Лидер по объёму",
      value: stats.topVolume,
      href: stats.topVolumeHref,
      bg: STAT_CARD_BACKGROUNDS.volume,
    },
    {
      label: "Лидер по выплатам",
      value: stats.topPayouts,
      href: stats.topPayoutsHref,
      bg: STAT_CARD_BACKGROUNDS.payouts,
    },
  ];

  const visibleKpiCards = kpiCards.filter((card) => card.value !== NO_DATA);

  return (
    <section>
      <div className="sticky top-0 z-[55] shrink-0 bg-black/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-4 md:flex-row md:items-end md:justify-between md:px-6 lg:px-8">
          <div className="min-w-0">
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-white md:text-2xl">
              Аналитика релизов
            </h1>

          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Период
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["7d", "30d", "90d", "all"] as const).map((p) => (
                <PeriodButton key={p} tone="neutral" active={period === p} onClick={() => onPeriodChange(p)}>
                  {releaseAnalyticsPeriodLabel(p)}
                </PeriodButton>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-4 py-4 md:px-6 lg:px-8">
        {overviewError ? (
          <p className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-400">
            Метрики временно недоступны
          </p>
        ) : null}

        {loading ? (
          <CatalogStatsSkeleton />
        ) : visibleKpiCards.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {visibleKpiCards.map((card) => (
              <AnalyticsStatCard
                key={card.label}
                label={card.label}
                value={card.value}
                href={card.href}
                backgroundSrc={card.bg}
                priority={card.label === "Средняя доходность"}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-5 w-full">
          <div className="flex items-start justify-between gap-3 px-0.5">
            <h2 className="font-mono text-sm font-semibold tracking-tight text-white">Динамика доходности</h2>
            <div className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              {releaseAnalyticsPeriodLabel(period)}
            </div>
          </div>
          <div className="mt-3 w-full min-w-0">
            <YieldDynamicsChart
              period={period}
              yieldDynamics={overview?.yieldDynamics}
              mockMode={mockMode}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
