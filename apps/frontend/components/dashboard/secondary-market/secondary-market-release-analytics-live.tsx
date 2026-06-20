"use client";



import Link from "next/link";

import { BookOpen } from "@/lib/lucide";



import { SecondaryMarketBreadcrumbNav } from "@/components/dashboard/secondary-market/secondary-market-breadcrumb-nav";

import { ChartPeriodSelector } from "@/components/shared/charts/chart-period-selector";

import { useI18n } from "@/components/providers/i18n-provider";

import { secondaryMarketBookHref, secondaryMarketHref } from "@/constants/dashboard/secondary-market";

import { ReleaseAnalyticsProChart } from "@/features/catalog/market-overview/release-analytics/ui/release-analytics-pro-chart";

import { useSecondaryMarketCharts } from "@/hooks/use-secondary-market-charts";

import { cn } from "@/lib/utils";



const PRIMARY_CTA = cn(

  "inline-flex h-9 items-center justify-center rounded-full bg-[#B7F500] px-4 text-[12px] font-semibold text-black transition hover:bg-[#c9ff52]",

);



export function SecondaryMarketReleaseAnalyticsLive({

  releaseId,

  title,

  symbol,

}: {

  releaseId: string;

  title?: string;

  symbol?: string;

}) {

  const { t } = useI18n();

  const charts = useSecondaryMarketCharts(releaseId);



  return (

    <div className="space-y-8 font-sans tabular-nums text-white antialiased">

      <header className="border-b border-white/6 pb-6">

        <SecondaryMarketBreadcrumbNav

          className="mb-4"

          items={[

            { label: t("meta.secondaryMarket.breadcrumb.secondaryMarket"), href: secondaryMarketHref("market") },

            {

              label: t("meta.secondaryMarket.breadcrumb.tradingAnalytics"),

              href: secondaryMarketHref("analytics"),

              scroll: false,

            },

            { label: symbol ?? releaseId.slice(0, 8) },

          ]}

        />

        <h1 className="text-xl font-semibold tracking-tight">{t("secondaryMarket.hero.analytics.title")}</h1>

        <p className="mt-1 text-[13px] text-zinc-500">

          {title ?? t("secondaryMarket.analytics.defaultSubtitle")}

        </p>

      </header>



      <div className="flex flex-wrap items-center justify-between gap-3">

        <ChartPeriodSelector value={charts.period} onChange={charts.setPeriod} />

        <span className="font-mono text-[10px] text-zinc-600">Spliton · live</span>

      </div>



      {charts.loading ? (

        <p className="text-sm text-zinc-500">{t("secondaryMarket.analytics.loadingCharts")}</p>

      ) : charts.error ? (

        <p className="rounded-xl bg-red-950/50 px-4 py-3 text-sm text-red-200" role="alert">

          {charts.error}

        </p>

      ) : (

        <div className="grid gap-4 lg:grid-cols-2">

          <div className="rounded-xl bg-[#111111] px-3 py-3 ring-1 ring-white/6">

            <h3 className="text-[13px] font-semibold text-white">{t("secondaryMarket.analytics.priceClose")}</h3>

            {charts.priceValues.length === 0 ? (

              <p className="mt-8 text-center text-xs text-zinc-500">{t("secondaryMarket.analytics.noPriceHistory")}</p>

            ) : (

              <ReleaseAnalyticsProChart values={charts.priceValues} accent="lime" />

            )}

          </div>

          <div className="rounded-xl bg-[#111111] px-3 py-3 ring-1 ring-white/6">

            <h3 className="text-[13px] font-semibold text-white">{t("secondaryMarket.analytics.volumeUsdt")}</h3>

            {charts.volumeValues.length === 0 ? (

              <p className="mt-8 text-center text-xs text-zinc-500">{t("secondaryMarket.analytics.noTrades")}</p>

            ) : (

              <ReleaseAnalyticsProChart values={charts.volumeValues} accent="sky" />

            )}

          </div>

          <div className="rounded-xl bg-[#111111] px-3 py-3 ring-1 ring-white/6 lg:col-span-2">

            <h3 className="text-[13px] font-semibold text-white">{t("secondaryMarket.analytics.liquidity")}</h3>

            {charts.liquidityValues.length === 0 ? (

              <p className="mt-8 text-center text-xs text-zinc-500">{t("secondaryMarket.analytics.noLiquidity")}</p>

            ) : (

              <ReleaseAnalyticsProChart values={charts.liquidityValues} accent="fuchsia" />

            )}

          </div>

        </div>

      )}



      {symbol ? (

        <Link href={secondaryMarketBookHref(symbol)} className={cn(PRIMARY_CTA, "inline-flex gap-1.5")}>

          <BookOpen className="size-3.5" aria-hidden />

          {t("secondaryMarket.analytics.openOrderBook")}

        </Link>

      ) : null}

    </div>

  );

}


