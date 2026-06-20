"use client";

import Link from "next/link";
import { ArrowLeft } from "@/lib/lucide";

import { PayoutsSubpageHero } from "@/components/dashboard/assets/payouts-subpage-hero";
import { useI18n } from "@/components/providers/i18n-provider";
import { secondaryMarketHref } from "@/constants/dashboard/secondary-market";
import {
  ROUTES,
  catalogMarketOverviewReleaseAnalyticsPath,
} from "@/constants/routes";
import type { LinkedHoldingPreview } from "@/lib/assets/holdings";
import { formatNumber } from "@/lib/i18n/formatters";
import { formatUsdtRu } from "@/lib/wallet/format-money";
import { getPrimaryUnitPriceUsdt, roundUsdt2 } from "@/lib/market-overview/pricing";
import { cn } from "@/lib/utils";
import type { MarketOverviewRow } from "@/types/market-overview";

import { AssetsSellUnitsOrderPanel } from "./assets-sell-units-order-panel";

const CRUMB = cn(
  "inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-500 transition-colors hover:text-neutral-900",
);

type Props = {
  row: MarketOverviewRow;
  holding: LinkedHoldingPreview;
};

export function AssetsSellUnitsScreen({ row, holding }: Props) {
  const { t, locale } = useI18n();
  const primary = getPrimaryUnitPriceUsdt(row);
  const suggestedAsk = roundUsdt2(primary * 1.015);
  const secondaryTradeHref = secondaryMarketHref("orders");

  return (
    <div className="space-y-8 sm:space-y-10">
      <PayoutsSubpageHero eyebrow="USDT · Holdings · Secondary" title={t("sell.title")} />

      <section className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(380px,1.15fr)] lg:items-start lg:gap-10">
        <div className="min-w-0 space-y-6 rounded-3xl bg-white px-5 py-6 sm:px-7 sm:py-8">
          <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            <Link href={ROUTES.myAssetsOverview} className={CRUMB}>
              <ArrowLeft className="size-3.5" strokeWidth={1.75} aria-hidden />
              {t("sell.assetsOverview")}
            </Link>
            <span className="text-neutral-300" aria-hidden>
              ·
            </span>
            <Link href={catalogMarketOverviewReleaseAnalyticsPath(row.id)} className={CRUMB}>
              {t("sell.releaseAnalytics")}
            </Link>
          </nav>

          <div>
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
              {t("sell.subtitle")}
            </h1>
            <p className="mt-2 text-[15px] font-medium text-neutral-800 sm:text-base">
              «{row.title}» · {row.artist}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-neutral-600 sm:text-[15px]">{t("sell.flowHint")}</p>
          </div>

          <div className="rounded-2xl bg-neutral-100/75 px-4 py-4 sm:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{t("sell.positionData")}</p>
            <dl className="mt-3 space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">{t("sell.inPortfolio")}</dt>
                <dd className="font-mono font-semibold text-neutral-900">{formatNumber(holding.heldUnits, locale)} UNT</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">{t("sell.refPrice")}</dt>
                <dd className="font-mono font-semibold text-neutral-900">{formatUsdtRu(primary, "USDT", locale)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">{t("sell.suggestedAsk")}</dt>
                <dd className="font-mono font-semibold text-neutral-900">{formatUsdtRu(suggestedAsk, "USDT", locale)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">{t("sell.symbol")}</dt>
                <dd className="font-mono font-semibold text-neutral-900">{row.symbol}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="lg:pt-1">
          <AssetsSellUnitsOrderPanel row={row} heldUnits={holding.heldUnits} secondaryTradeHref={secondaryTradeHref} />
        </div>
      </section>
    </div>
  );
}
