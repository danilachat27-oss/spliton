"use client";

import type {
  ReleaseMarketAnalyticsHero,
  ReleaseMarketHeroMetric,
  ReleaseMarketHeroVsTone,
} from "@/types/catalog/release-market-analytics";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

const VS_TONE: Record<ReleaseMarketHeroVsTone, string> = {
  positive: "text-emerald-400",
  negative: "text-rose-400",
  neutral: "text-zinc-500",
  warning: "text-amber-400/95",
};

function Stat({ label, metric, sub }: { label: string; metric: ReleaseMarketHeroMetric; sub?: string }) {
  const tone = metric.vsTone ?? "neutral";
  return (
    <div className="rounded-xl bg-[#111111] px-3 py-3 transition-colors hover:bg-white/[0.03]">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">{label}</p>
      <p className="mt-2 font-mono text-[15px] font-semibold tabular-nums tracking-tight text-white">{metric.value}</p>
      {metric.vsPrevious ? (
        <p className={cn("mt-1 text-[11px] font-medium leading-snug", VS_TONE[tone])}>{metric.vsPrevious}</p>
      ) : null}
      {sub ? <p className="mt-1 text-[11px] leading-snug text-zinc-500">{sub}</p> : null}
    </div>
  );
}

export function ReleaseAnalyticsHeroMetrics({ hero }: { hero: ReleaseMarketAnalyticsHero }) {
  const { t } = useI18n();

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">Key metrics</h2>
          <p className="mt-1 text-sm font-semibold text-white">{t("catalog.releaseAnalytics.hero.summary")}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 xl:grid-cols-7">
        <Stat label={t("catalog.releaseAnalytics.hero.yield")} metric={hero.yieldPct} />
        <Stat label="Total payouts" metric={hero.totalPayouts} />
        <Stat label="Active holders" metric={hero.activeHolders} />
        <Stat label="Available UNT" metric={hero.availableUnits} />
        <Stat
          label={t("catalog.releaseAnalytics.hero.liquidity")}
          metric={hero.liquidity}
          sub={t("catalog.releaseAnalytics.hero.liquiditySub")}
        />
        <Stat label="Secondary" metric={hero.secondary} sub={t("catalog.releaseAnalytics.hero.secondarySub")} />
        <div className="col-span-2 rounded-xl bg-[#111111] px-3 py-3 transition-colors hover:bg-white/[0.03] lg:col-span-2 xl:col-span-1">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">
            {t("catalog.releaseAnalytics.hero.trend")}
          </p>
          <p className="mt-2 text-[12px] font-medium text-zinc-200">
            7D:{" "}
            <span className={cn("font-mono tabular-nums", VS_TONE[hero.trend7d.vsTone ?? "neutral"])}>
              {hero.trend7d.value}
            </span>
          </p>
          {hero.trend7d.vsPrevious ? (
            <p className={cn("mt-0.5 text-[11px] leading-snug", VS_TONE[hero.trend7d.vsTone ?? "neutral"])}>
              {hero.trend7d.vsPrevious}
            </p>
          ) : null}
          <p className="mt-2 text-[12px] font-medium text-zinc-200">
            30D:{" "}
            <span className={cn("font-mono tabular-nums", VS_TONE[hero.trend30d.vsTone ?? "neutral"])}>
              {hero.trend30d.value}
            </span>
          </p>
          {hero.trend30d.vsPrevious ? (
            <p className={cn("mt-0.5 text-[11px] leading-snug", VS_TONE[hero.trend30d.vsTone ?? "neutral"])}>
              {hero.trend30d.vsPrevious}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
