"use client";



import { useI18n } from "@/components/providers/i18n-provider";

import { formatUsdtCompact } from "@/lib/market-overview/format";

import type { MarketOverviewDepthApi, MarketOverviewStatsApi } from "@/services/market-overview.service";



function fmtUsdt(value: string | number | null | undefined): string {
  if (value == null || value === "") return "$0";
  const n = Number.parseFloat(String(value));
  if (!Number.isFinite(n) || n <= 0) return "$0";
  return `$${formatUsdtCompact(n)}`;
}

function fmtCount(value: number | null | undefined): string {
  if (value == null || value <= 0) return "0";
  return String(value);
}



export function MarketOverviewKpiSection({

  live,

  stats,

  depth,

  loading,

  error,

}: {

  live?: boolean;

  stats?: MarketOverviewStatsApi | null;

  depth?: MarketOverviewDepthApi | null;

  loading?: boolean;

  error?: boolean;

}) {

  const { t } = useI18n();

  if (!live) return null;



  if (loading && !stats) {

    return (

      <div className="mx-auto mt-3 flex w-full max-w-[1400px] gap-2.5 overflow-x-auto px-4 pb-1 md:px-6 lg:px-8">

        {Array.from({ length: 3 }).map((_, i) => (

          <div key={i} className="h-[76px] min-w-[148px] shrink-0 animate-pulse rounded-xl bg-[#141414]" />

        ))}

      </div>

    );

  }



  if (error) {

    return (

      <div className="mx-auto mt-3 w-full max-w-[1400px] px-4 md:px-6 lg:px-8">

        <p className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">

          {t("marketOverview.kpi.unavailable")}

        </p>

      </div>

    );

  }



  const sm = stats?.secondaryMarket;

  const cards = [

    {

      label: t("marketOverview.kpi.volume24h"),

      value: fmtUsdt(sm?.volume24hUsdt ?? stats?.totals?.totalVolume24hUsdt),

      delta: fmtUsdt(sm?.volume7dUsdt),

      positive: true,

    },

    {

      label: t("marketOverview.kpi.activeListings"),

      value: fmtCount(sm?.activeListings ?? depth?.activeListings),

      delta: t("marketOverview.kpi.onSecondary"),

      positive: null,

    },

    {

      label: t("marketOverview.kpi.trades24h"),

      value: fmtCount(depth?.tradesCount24h ?? sm?.tradesCount ?? null),

      delta: fmtCount(depth?.tradesCount7d ?? null),

      positive: null,

    },

  ];



  return (

    <div className="mx-auto mt-3 w-full max-w-[1400px] px-4 md:px-6 lg:px-8">

      <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        {cards.map((c) => (

          <div key={c.label} className="min-w-[148px] shrink-0 rounded-xl bg-[#141414] px-3.5 py-3 ring-1 ring-white/[0.06]">

            <p className="text-[11px] text-zinc-500">{c.label}</p>

            <p className="mt-1 font-mono text-[15px] font-semibold tabular-nums text-white">{c.value}</p>

            {c.delta !== "0" && c.delta !== "$0" ? (

              <p

                className={

                  c.positive === true

                    ? "mt-0.5 font-mono text-[11px] tabular-nums text-[#B7F500]"

                    : "mt-0.5 text-[11px] text-zinc-600"

                }

              >

                {c.delta}

              </p>

            ) : null}

          </div>

        ))}

      </div>

    </div>

  );

}

