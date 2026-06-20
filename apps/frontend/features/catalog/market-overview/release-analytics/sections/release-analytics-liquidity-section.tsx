"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES, catalogBuyUnitsPath } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type {
  ReleaseMarketAnalyticsLiquidity,
  ReleaseMarketHeroVsTone,
  ReleaseMarketLiquidityCard,
} from "@/types/catalog/release-market-analytics";

const VS_TONE: Record<ReleaseMarketHeroVsTone, string> = {
  positive: "text-emerald-400",
  negative: "text-rose-400",
  neutral: "text-zinc-500",
  warning: "text-amber-400/95",
};

const BTN_BUY = cn(
  "inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[#B7F500] px-4 text-[13px] font-semibold text-black",
  "transition-colors hover:bg-[#c8ff3d]",
);

const BTN_SECONDARY = cn(
  "inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-white px-4 text-[13px] font-semibold text-black",
  "transition-colors hover:bg-zinc-100",
);

function Metric({ label, card }: { label: string; card: ReleaseMarketLiquidityCard }) {
  const tone = card.vsTone ?? "neutral";
  return (
    <div className="min-w-0">
      <p className="text-[12px] leading-snug text-zinc-500">{label}</p>
      <p className="mt-1.5 font-mono text-[20px] font-semibold tabular-nums tracking-tight text-white">{card.value}</p>
      {card.vsPrevious ? (
        <p className={cn("mt-1 text-[12px] font-medium leading-snug", VS_TONE[tone])}>{card.vsPrevious}</p>
      ) : null}
      <p className="mt-2 text-[12px] leading-snug text-zinc-600">{card.hint}</p>
    </div>
  );
}

export function ReleaseAnalyticsLiquiditySection({
  liquidity,
  releaseId,
}: {
  liquidity: ReleaseMarketAnalyticsLiquidity;
  releaseId: string;
}) {
  const { t } = useI18n();
  const L = liquidity.listings;
  const lt = L.vsTone ?? "neutral";
  const d = liquidity.depth;
  const dt = d.vsTone ?? "neutral";

  return (
    <section className="min-w-0">
      <header className="max-w-2xl">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-600">Ликвидность</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Рынок и активность</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">
          Сравнение с прошлым окном — ориентир по mock-модели (не сигнал к сделке).
        </p>
      </header>

      <div className="mt-6 min-w-0 space-y-0">
        <div className="flex flex-col gap-3 rounded-xl bg-[#111111] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-zinc-500">Листинги на secondary</p>
            <p className="mt-1.5 text-[15px] leading-snug text-zinc-300">{L.summary}</p>
            {L.vsPrevious ? (
              <p className={cn("mt-2 text-[12px] font-medium leading-snug", VS_TONE[lt])}>{L.vsPrevious}</p>
            ) : null}
          </div>
          <span
            className={cn(
              "inline-flex w-fit shrink-0 self-start rounded-md px-3 py-1.5 text-[12px] font-semibold sm:self-center",
              L.hasActive ? "bg-white text-black" : "bg-white/5 text-zinc-400",
            )}
          >
            {L.hasActive ? "Да" : "Нет"}
          </span>
        </div>

        <div className="h-px w-full bg-white/6" aria-hidden />

        <div className="py-6">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
              Цена и спред
            </p>
            <div className="flex min-w-0 flex-wrap gap-2 sm:justify-end">
              <Link href={ROUTES.dashboardSecondaryMarket} className={BTN_SECONDARY}>
                Secondary market
              </Link>
              <Link href={catalogBuyUnitsPath(releaseId)} className={BTN_BUY}>
                {t("catalog.releaseAnalytics.liquidity.buyUnt")}
              </Link>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-2.5">
            <div className="rounded-xl bg-[#111111] px-4 py-4">
              <Metric label={t("catalog.releaseAnalytics.liquidity.avgPrice")} card={liquidity.avgUnitPrice} />
            </div>
            <div className="rounded-xl bg-[#111111] px-4 py-4">
              <Metric label={t("catalog.releaseAnalytics.liquidity.spread")} card={liquidity.spread} />
            </div>
            <div className="rounded-xl bg-[#111111] px-4 py-4">
              <Metric label={t("catalog.releaseAnalytics.liquidity.priceRange")} card={liquidity.priceRange} />
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-white/6" aria-hidden />

        <div className="py-6">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
            {t("catalog.releaseAnalytics.liquidity.turnoverSection")}
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            <div className="rounded-xl bg-[#111111] px-4 py-4">
              <Metric label={t("catalog.releaseAnalytics.liquidity.volume24h")} card={liquidity.volume24h} />
            </div>
            <div className="rounded-xl bg-[#111111] px-4 py-4">
              <Metric label={t("catalog.releaseAnalytics.liquidity.volume7d")} card={liquidity.volume7d} />
            </div>
            <div className="rounded-xl bg-[#111111] px-4 py-4">
              <Metric label={t("catalog.releaseAnalytics.liquidity.trades24h")} card={liquidity.trades24h} />
            </div>
            <div className="rounded-xl bg-[#111111] px-4 py-4">
              <Metric label={t("catalog.releaseAnalytics.liquidity.trades7d")} card={liquidity.trades7d} />
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-white/6" aria-hidden />

        <div className="min-w-0 rounded-xl bg-[#111111] px-4 py-4 sm:px-5 sm:py-5">
          <p className="text-[13px] font-semibold tracking-tight text-zinc-200">{d.title}</p>
          <p className="mt-2.5 max-w-prose text-[15px] leading-relaxed text-zinc-400">{d.body}</p>
          {d.vsPrevious ? (
            <p className={cn("mt-2.5 text-[12px] font-medium leading-snug", VS_TONE[dt])}>{d.vsPrevious}</p>
          ) : null}
          <p className="mt-2.5 max-w-prose text-[12px] leading-relaxed text-zinc-600">{d.foot}</p>
        </div>
      </div>
    </section>
  );
}
