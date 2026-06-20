"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, X } from "@/lib/lucide";

import { MarketTopCardInteractiveChart } from "./ui/market-top-card-interactive-chart";
import { useI18n } from "@/components/providers/i18n-provider";
import { MARKET_TOP_CARD_DEFS, MARKET_TOP_CARD_METRICS } from "@/constants/market-overview/page";
import { ROUTES } from "@/constants/routes";
import { buildLiveTopCardMetrics } from "@/lib/market-overview/market-overview-live-mappers";
import type { MarketOverviewChartsApi, MarketOverviewStatsApi } from "@/services/market-overview.service";
import { cn } from "@/lib/utils";
import type { MarketOverviewPeriod, MarketRowTrend } from "@/types/market-overview";

function trendFromDelta(delta: string): MarketRowTrend {
  const t = delta.trim();
  if (t.startsWith("-")) return "down";
  if (t.includes("±") || /^[±]0[,.]/.test(t)) return "flat";
  return "up";
}

const TOP_CARD_HREF: Record<(typeof MARKET_TOP_CARD_DEFS)[number]["id"], string> = {
  active: ROUTES.analyticsReleases,
  new: ROUTES.dashboardCatalog,
  depth: ROUTES.catalogReleaseParameters,
  secondary: ROUTES.dashboardSecondaryMarket,
};

type CardId = (typeof MARKET_TOP_CARD_DEFS)[number]["id"];

function splitUsdtMetric(metric: string): { value: string; unit: "USDT" } | null {
  const m = metric.trim().match(/^(.*?)\s+(USDT)$/i);
  if (!m) return null;
  return { value: m[1].trim(), unit: "USDT" };
}

function CardMetricBlock({
  metric,
  delta,
  slim,
  expanded,
}: {
  metric: string;
  delta: string;
  slim: boolean;
  expanded: boolean;
}) {
  const neg = delta.trim().startsWith("-");
  const deltaSlim = neg
    ? "font-mono text-[11px] tabular-nums text-fuchsia-400 xl:text-[10px]"
    : "font-mono text-[11px] tabular-nums text-[#B7F500]/90 xl:text-[10px]";
  const deltaFull = neg
    ? "font-mono text-[12px] tabular-nums text-fuchsia-400"
    : "font-mono text-[12px] tabular-nums text-[#B7F500]/90";
  const usdt = splitUsdtMetric(metric);

  if (slim && usdt) {
    return (
      <div className="min-w-0 space-y-1">
        <p className="break-words font-mono text-[13px] font-semibold tabular-nums leading-[1.15] tracking-tight text-white xl:text-[12px]">
          {usdt.value}
        </p>
        <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-zinc-500">{usdt.unit}</p>
        <p className={deltaSlim}>{delta}</p>
      </div>
    );
  }

  if (slim) {
    return (
      <div className="min-w-0 space-y-1">
        <p className="break-words font-mono text-[13px] font-semibold tabular-nums leading-[1.15] tracking-tight text-white xl:text-[12px]">
          {metric}
        </p>
        <p className={deltaSlim}>{delta}</p>
      </div>
    );
  }

  const usdtWide = splitUsdtMetric(metric);

  return (
    <div className={cn("min-w-0 space-y-1.5", expanded && "pt-0.5")}>
      {usdtWide ? (
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p
            className={cn(
              "break-words font-mono font-semibold tabular-nums tracking-tight text-white",
              expanded ? "text-[2.1rem] leading-[1.08] sm:text-[2.2rem]" : "text-xl leading-tight md:text-2xl",
            )}
          >
            {usdtWide.value}
          </p>
          <span className="shrink-0 font-mono text-[12px] font-medium uppercase tracking-wide text-zinc-500">
            {usdtWide.unit}
          </span>
        </div>
      ) : (
        <p
          className={cn(
            "break-words font-mono font-semibold tabular-nums tracking-tight text-white",
            expanded ? "text-[2.1rem] leading-[1.08] sm:text-[2.2rem]" : "text-xl leading-tight md:text-2xl",
          )}
        >
          {metric}
        </p>
      )}
      <p className={cn(deltaFull, expanded && "text-[13px]")}>{delta}</p>
    </div>
  );
}

export function MarketOverviewTopCards({
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

  if (live && loading && !stats) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[142px] animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      </div>
    );
  }

  const m =
    live && stats
      ? buildLiveTopCardMetrics(stats, charts ?? null, period)
      : MARKET_TOP_CARD_METRICS[period];
  const [expandedId, setExpandedId] = React.useState<CardId | null>(null);

  const ordered = React.useMemo(() => {
    if (!expandedId) return [...MARKET_TOP_CARD_DEFS];
    const head = MARKET_TOP_CARD_DEFS.filter((d) => d.id === expandedId);
    const tail = MARKET_TOP_CARD_DEFS.filter((d) => d.id !== expandedId);
    return [...head, ...tail];
  }, [expandedId]);

  const toggleCard = React.useCallback((id: CardId) => {
    setExpandedId((cur) => (cur === id ? null : id));
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-4 md:px-6 lg:px-8">
      <div
        className={cn(
          "gap-2 transition-[gap] duration-300 ease-out",
          expandedId
            ? "flex flex-col xl:flex-row xl:items-stretch"
            : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
        )}
      >
        {ordered.map((def) => {
          const metric = m[def.metricKey];
          const delta = m[def.deltaKey];
          const bars = m[def.barsKey];
          const href = TOP_CARD_HREF[def.id];
          const expanded = expandedId === def.id;
          const slim = Boolean(expandedId) && !expanded;

          return (
            <div
              key={def.id}
              data-expanded={expanded ? "" : undefined}
              onClick={() => toggleCard(def.id)}
              className={cn(
                "flex min-h-[142px] min-w-0 cursor-pointer flex-col rounded-xl bg-[#111111] px-3.5 py-3.5 text-left outline-none transition-[flex-grow,flex-basis,width,max-width,padding,box-shadow] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]",
                "hover:bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-[#B7F500]/35",
                expanded && "ring-1 ring-white/10 xl:min-w-0 xl:flex-1 xl:basis-0 xl:max-w-none",
                slim && "xl:w-[168px] xl:flex-none xl:shrink-0 xl:px-2.5 xl:py-2.5",
              )}
            >
              <div className="pointer-events-none flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h2
                    className={cn(
                      "text-[14px] font-semibold leading-tight text-white",
                      slim && "xl:line-clamp-3 xl:text-[12px] xl:leading-snug",
                    )}
                  >
                    {t(`marketOverview.topCard.${def.id}.title`)}
                  </h2>
                  {!slim ? (
                    <p className="mt-1 text-[12px] leading-snug text-zinc-500">
                      {t(`marketOverview.topCard.${def.id}.subtitle`)}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {expanded ? (
                    <span className="pointer-events-auto inline-flex" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setExpandedId(null)}
                        className="flex size-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-200"
                        aria-label={t("marketOverview.topCard.collapseAria")}
                      >
                        <X className="size-3.5" strokeWidth={2} />
                      </button>
                    </span>
                  ) : null}
                  <span className="font-mono text-[11px] tabular-nums text-zinc-600">{period}</span>
                </div>
              </div>

              <div
                className={cn(
                  "mt-3 flex min-h-0 min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
                  expanded && "gap-4 sm:flex-col sm:items-stretch xl:mt-5",
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none min-w-0 sm:max-w-[55%]",
                    expanded && "sm:order-2 sm:max-w-none",
                    slim && "sm:max-w-none",
                  )}
                >
                  <CardMetricBlock metric={metric} delta={delta} slim={slim} expanded={expanded} />
                  {!slim ? (
                    <Link
                      href={href}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="pointer-events-auto mt-3 inline-flex items-center gap-0.5 text-[12px] font-medium text-zinc-500 transition-colors hover:text-[#c4f570] focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#B7F500]/35"
                    >
                      {t("marketOverview.topCard.more")}
                      <ChevronRight className="size-3" strokeWidth={2} aria-hidden />
                    </Link>
                  ) : null}
                </div>

                <div
                  className={cn(
                    "w-full shrink-0 transition-[max-width] duration-300 ease-out",
                    expanded ? "max-w-none sm:order-1" : "max-w-[min(100%,180px)] sm:ml-auto",
                    slim && "xl:mt-3 xl:max-w-full",
                    "pointer-events-auto",
                  )}
                >
                  <div
                    className={cn(
                      "w-full rounded-lg border border-transparent transition-colors",
                      expanded && "border-white/8 bg-black/25 px-1 py-1.5 sm:px-2 sm:py-2",
                    )}
                  >
                    <MarketTopCardInteractiveChart
                      key={`${def.id}-${expanded ? "1" : "0"}-${slim ? "1" : "0"}`}
                      values={bars}
                      trend={trendFromDelta(delta)}
                      mode={expanded ? "expanded" : slim ? "slim" : "compact"}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
