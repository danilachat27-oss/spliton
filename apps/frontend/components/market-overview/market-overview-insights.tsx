"use client";

import Link from "next/link";
import { ChevronRight } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { MARKET_INSIGHT_ITEMS } from "@/constants/market-overview/page";
import { ROUTES } from "@/constants/routes";
import { mapTopReleasesToInsights } from "@/lib/market-overview/market-overview-live-mappers";
import type { MarketOverviewStatsApi } from "@/services/market-overview.service";
import { cn } from "@/lib/utils";

const INSIGHT_HREF: Record<string, string> = {
  "ins-flow": ROUTES.dashboardCatalog,
  "ins-premium": ROUTES.analyticsReleases,
  "ins-spread": ROUTES.dashboardSecondaryMarket,
  "ins-liquidity": ROUTES.analyticsReleases,
  "live-byVolume": ROUTES.dashboardSecondaryMarket,
  "live-byYield": ROUTES.analyticsReleases,
  "live-byLiquidity": ROUTES.dashboardSecondaryMarket,
  "live-byProgress": ROUTES.dashboardCatalog,
};

function metricTone(metric: string) {
  const t = metric.trim();
  if (t.startsWith("−") || t.startsWith("-")) return "text-fuchsia-400/95";
  if (t.startsWith("+")) return "text-[#B7F500]";
  return "text-white";
}

function translateInsightItem(
  t: (key: string) => string,
  item: (typeof MARKET_INSIGHT_ITEMS)[number],
) {
  const prefix = `marketOverview.insights.${item.id}`;
  return {
    ...item,
    tag: t(`${prefix}.tag`),
    metric: t(`${prefix}.metric`),
    metricCaption: t(`${prefix}.metricCaption`),
    body: t(`${prefix}.body`),
    detail: t(`${prefix}.detail`),
  };
}

export function MarketOverviewInsights({
  live,
  stats,
  period = "7d",
}: {
  live?: boolean;
  stats?: MarketOverviewStatsApi | null;
  period?: string;
}) {
  const { locale, t } = useI18n();

  const items = !live
    ? MARKET_INSIGHT_ITEMS.map((item) => translateInsightItem(t, item))
    : stats
      ? mapTopReleasesToInsights(stats, period, locale)
      : [
          {
            id: "empty-1",
            tag: t("marketOverview.insights.loading.tag"),
            metric: "—",
            metricCaption: t("marketOverview.insights.loading.caption"),
            body: t("marketOverview.insights.loading.body"),
            detail: "",
          },
        ];

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pb-10 md:px-6 lg:px-8">
      <header className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            {t("marketOverview.insights.kicker")}
          </span>
          {!live ? (
            <span className="rounded-lg bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              {t("marketOverview.insights.mockBadge")}
            </span>
          ) : null}
        </div>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-white md:text-2xl">
          {t("marketOverview.insights.title")}
        </h2>
        <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-zinc-500">
          {t("marketOverview.insights.introBefore")}{" "}
          <Link
            href={ROUTES.analyticsReleases}
            className="text-zinc-400 underline decoration-white/15 underline-offset-2 transition-colors hover:text-zinc-200"
          >
            {t("marketOverview.insights.analyticsLink")}
          </Link>
          {t("marketOverview.insights.introAfter")}
        </p>
        <p className="mt-2 max-w-[68ch] font-mono text-[11px] leading-relaxed text-zinc-600">
          {live ? t("marketOverview.insights.noteLive") : t("marketOverview.insights.noteDemo")}
        </p>
      </header>

      <ul className="grid gap-2 sm:grid-cols-2 sm:gap-3" role="list">
        {items.map((item) => (
          <li key={item.id} className="flex min-h-0 min-w-0">
            <div className="flex h-full w-full flex-col rounded-xl bg-white/4 px-4 pb-4 pt-3 transition-colors hover:bg-white/7">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 font-mono text-[10px] font-semibold uppercase leading-snug tracking-[0.2em] text-zinc-500">
                  {item.tag}
                </p>
                <Link
                  href={INSIGHT_HREF[item.id] ?? ROUTES.analyticsReleases}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-black transition-opacity hover:opacity-90"
                >
                  {t("marketOverview.insights.more")}
                  <ChevronRight className="size-3 shrink-0" strokeWidth={2} aria-hidden />
                </Link>
              </div>

              <div className="mt-3">
                <p className={cn("font-mono text-2xl font-semibold tabular-nums tracking-tight", metricTone(item.metric))}>
                  {item.metric}
                </p>
                <p className="mt-1 font-mono text-[10px] font-medium uppercase leading-snug tracking-wide text-zinc-500">
                  {item.metricCaption}
                </p>
              </div>

              <p className="mt-3 text-[13px] leading-relaxed text-zinc-200">{item.body}</p>
              <p className="mt-2 border-t border-white/5 pt-3 text-[12px] leading-relaxed text-zinc-500">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
