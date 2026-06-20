"use client";

import Link from "next/link";
import { ChevronRight } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { MARKET_SUMMARY_PANELS } from "@/constants/market-overview/page";
import { ROUTES } from "@/constants/routes";
import { buildLiveSummaryPanels, type MarketSummaryPanelLive } from "@/lib/market-overview/market-overview-live-mappers";
import { formatSeriesDisplayValue } from "@/lib/market-overview/chart-series";
import type { MarketOverviewChartsApi, MarketOverviewStatsApi } from "@/services/market-overview.service";
import { cn } from "@/lib/utils";
import type { MarketOverviewPeriod, MarketRowTrend } from "@/types/market-overview";

import { MarketTopCardInteractiveChart } from "./ui/market-top-card-interactive-chart";

function trendFromSeriesDelta(series: readonly number[]): { delta: string; trend: MarketRowTrend } {
  if (series.length < 2) return { delta: "±0%", trend: "flat" };
  const first = series[0]!;
  const last = series[series.length - 1]!;
  const pct = first !== 0 ? ((last - first) / first) * 100 : 0;
  const abs = Math.abs(pct);
  if (abs < 0.05) return { delta: "±0%", trend: "flat" };
  const text = (pct > 0 ? "+" : "") + pct.toFixed(1).replace(".", ",") + "%";
  const trend: MarketRowTrend = pct > 0.05 ? "up" : pct < -0.05 ? "down" : "flat";
  return { delta: text, trend };
}

const SUMMARY_PANEL_HREF: Record<(typeof MARKET_SUMMARY_PANELS)[number]["id"], string> = {
  "segments-primary": ROUTES.dashboardCatalog,
  "genre-activity": ROUTES.analyticsReleases,
  "order-flow": ROUTES.dashboardSecondaryMarket,
  "secondary-demand": ROUTES.dashboardSecondaryMarket,
};

const SUMMARY_PANEL_I18N: Record<
  (typeof MARKET_SUMMARY_PANELS)[number]["id"],
  { title: string; caption: string }
> = {
  "segments-primary": {
    title: "marketOverview.summary.segmentsPrimary.title",
    caption: "marketOverview.summary.segmentsPrimary.caption",
  },
  "genre-activity": {
    title: "marketOverview.summary.genreActivity.title",
    caption: "marketOverview.summary.genreActivity.caption",
  },
  "order-flow": {
    title: "marketOverview.summary.orderFlow.title",
    caption: "marketOverview.summary.orderFlow.caption",
  },
  "secondary-demand": {
    title: "marketOverview.summary.secondaryDemand.title",
    caption: "marketOverview.summary.secondaryDemand.caption",
  },
};

export function MarketOverviewSummaryGrid({
  period,
  live,
  stats,
  charts,
  loading,
}: {
  period: MarketOverviewPeriod;
  live?: boolean;
  stats?: MarketOverviewStatsApi | null;
  charts?: MarketOverviewChartsApi | null;
  loading?: boolean;
}) {
  const { t } = useI18n();
  const periodLabel = t(`marketOverview.period.${period}`);

  if (live && loading && !stats) {
    return (
      <div className="mx-auto mt-3 w-full max-w-[1400px] px-4 pb-4 md:px-6 lg:px-8">
        <div className="grid gap-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[132px] animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      </div>
    );
  }

  const panels = live && stats ? buildLiveSummaryPanels(stats, charts ?? null) : [...MARKET_SUMMARY_PANELS];

  return (
    <div className="mx-auto mt-3 w-full max-w-[1400px] px-4 pb-4 md:px-6 lg:px-8">
      <div className="grid gap-2 lg:grid-cols-4">
        {panels.map((panel) => {
          const series = [...panel.series];
          const livePanel = live && stats ? (panel as MarketSummaryPanelLive) : null;
          const value = livePanel?.displayValue ?? formatSeriesDisplayValue(series);
          const { delta, trend } = trendFromSeriesDelta(panel.series);
          const d = delta.trim();
          const deltaClass =
            d.startsWith("-") || d.startsWith("−")
              ? "font-mono text-[11px] tabular-nums text-fuchsia-400"
              : d.startsWith("±")
                ? "font-mono text-[11px] tabular-nums text-zinc-500"
                : "font-mono text-[11px] tabular-nums text-[#B7F500]/90";
          const i18n = SUMMARY_PANEL_I18N[panel.id];
          const title = i18n ? t(i18n.title) : panel.title;
          const caption = i18n ? t(i18n.caption) : panel.caption;

          return (
            <Link
              key={panel.id}
              href={SUMMARY_PANEL_HREF[panel.id]}
              className="group flex min-h-[132px] min-w-0 flex-col rounded-xl bg-[#111111] px-3 py-3 text-left transition-colors hover:bg-white/4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[12px] font-semibold leading-tight text-white">{title}</h2>
                  <p className="mt-1 text-[11px] leading-snug text-zinc-500">{caption}</p>
                </div>
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-zinc-600">{periodLabel}</span>
              </div>

              <div className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 sm:max-w-[55%]">
                  <p className="break-words font-mono text-lg font-semibold tabular-nums leading-tight tracking-tight text-white md:text-xl">
                    {value}
                  </p>
                  <p className={cn("mt-1.5", deltaClass)}>{delta}</p>
                  <span className="mt-3 inline-flex items-center gap-0.5 text-[11px] font-medium text-zinc-500 transition-colors group-hover:text-[#c4f570]">
                    {t("marketOverview.summary.more")}
                    <ChevronRight className="size-3" strokeWidth={2} aria-hidden />
                  </span>
                </div>

                <div className="w-full max-w-[min(100%,180px)] shrink-0 sm:ml-auto">
                  <MarketTopCardInteractiveChart values={series} trend={trend} mode="compact" className="w-full" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
