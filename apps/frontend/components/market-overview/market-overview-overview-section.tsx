"use client";

import { PeriodButton } from "@/components/shared/exchange/period-button";
import { useI18n } from "@/components/providers/i18n-provider";
import { MARKET_OVERVIEW_PERIODS } from "@/constants/market-overview/page";
import { tf } from "@/lib/i18n/financial-messages";
import type { MarketOverviewChartsApi, MarketOverviewStatsApi } from "@/services/market-overview.service";
import type { MarketOverviewPeriod } from "@/types/market-overview";

import { MarketOverviewSummaryGrid } from "./market-overview-summary-grid";
import { MarketOverviewTopCards } from "./market-overview-top-cards";

export function MarketOverviewOverviewSection({
  period,
  onPeriodChange,
  lastUpdated,
  live,
  stats,
  charts,
  loading,
}: {
  period: MarketOverviewPeriod;
  onPeriodChange: (p: MarketOverviewPeriod) => void;
  lastUpdated: string;
  live?: boolean;
  stats?: MarketOverviewStatsApi | null;
  charts?: MarketOverviewChartsApi | null;
  loading?: boolean;
}) {
  const { t } = useI18n();

  return (
    <section>
      <div className="sticky top-0 z-[55] shrink-0 bg-black/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-5 md:flex-row md:items-end md:justify-between md:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                {t("marketOverview.header.market")}
              </span>
              <span className="rounded-lg bg-[#0a0a0a] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                {t("marketOverview.header.snapshot")}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              {t("marketOverview.header.title")}
            </h1>
            <p className="mt-2 font-mono text-[12px] tabular-nums text-zinc-500">
              {tf(t("marketOverview.header.updated"), { date: lastUpdated })}
              {live ? (
                <span className="text-zinc-600">{t("marketOverview.header.liveDisclaimer")}</span>
              ) : (
                <span className="text-zinc-600">{t("marketOverview.header.demoDisclaimer")}</span>
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                {t("marketOverview.header.period")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {MARKET_OVERVIEW_PERIODS.map((p) => (
                  <PeriodButton key={p.id} tone="neutral" active={period === p.id} onClick={() => onPeriodChange(p.id)}>
                    {t(`marketOverview.period.${p.id}`)}
                  </PeriodButton>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MarketOverviewTopCards period={period} live={live} stats={stats} charts={charts} loading={loading} />
      <MarketOverviewSummaryGrid period={period} live={live} stats={stats} charts={charts} loading={loading} />
    </section>
  );
}
