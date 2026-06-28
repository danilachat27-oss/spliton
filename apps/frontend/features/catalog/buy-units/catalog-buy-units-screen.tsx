"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { FileText } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { catalogCardRiskLabel } from "@/lib/i18n/catalog-card-labels";
import { tf } from "@/lib/i18n/financial-messages";
import { ROUTES, catalogMarketOverviewReleaseAnalyticsPath } from "@/constants/routes";
import {
  derivePrimaryBuyTermsFromSsr,
  type PrimaryBuyTerms,
} from "@/lib/catalog/primary-buy-terms";
import { computeOwnershipPercent } from "@/lib/market/pricing-calculator";
import { formatUnitsCompact, formatUsdtFixedRu } from "@/lib/market-overview/format";
import type { CatalogPrimaryRoundPublic, CatalogReleaseDetailApi } from "@/services/catalog.service";
import type { MarketOverviewRow } from "@/types/market-overview";

import { CatalogBuyUnitsOrderPanel } from "./catalog-buy-units-order-panel";

export function CatalogBuyUnitsScreen({
  row,
  detail,
  primaryRound,
  purchaseState,
}: {
  row: MarketOverviewRow;
  detail: CatalogReleaseDetailApi | null;
  primaryRound: CatalogPrimaryRoundPublic | null;
  purchaseState: CatalogReleaseDetailApi["purchaseState"] | null;
}) {
  const { t, locale } = useI18n();
  const [buyTerms, setBuyTerms] = useState<PrimaryBuyTerms>(() =>
    derivePrimaryBuyTermsFromSsr(row, primaryRound),
  );
  const handleBuyTermsChange = useCallback((next: PrimaryBuyTerms) => {
    setBuyTerms(next);
  }, []);

  const { unitPrice, maxUnits, minUnits, priceInvalid } = buyTerms;
  const purchaseBlocked = purchaseState != null && purchaseState !== "available";
  const displayAvailableUnits = purchaseBlocked ? 0 : buyTerms.availableUnits;
  const displayMaxUnits = purchaseBlocked ? 0 : maxUnits;
  const minOrderUsdt = unitPrice != null ? unitPrice * minUnits : null;
  const maxOrderUsdt = unitPrice != null && displayMaxUnits > 0 ? unitPrice * displayMaxUnits : null;
  const ownershipAtMin =
    unitPrice != null && !priceInvalid
      ? computeOwnershipPercent(minUnits, buyTerms.totalUnits)
      : null;

  return (
    <div className="min-h-0 bg-white text-zinc-950 antialiased">
      <div className="border-b border-zinc-100 bg-white py-3.5 md:py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <span className="text-[14px] font-semibold tracking-tight text-zinc-900">{t("catalog.buy.screen.title")}</span>
          <Link
            href={ROUTES.dashboardActivity}
            className="inline-flex items-center gap-2 text-[13px] font-medium text-zinc-700 transition-colors hover:text-zinc-950"
          >
            <FileText className="size-4 shrink-0 text-zinc-500" strokeWidth={1.75} aria-hidden />
            {t("catalog.buy.screen.orderHistory")}
          </Link>
        </div>
      </div>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
          <nav className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium text-zinc-500">
            <Link href={ROUTES.catalogMarketOverview} className="transition-colors hover:text-zinc-900">
              {t("catalog.buy.screen.marketOverview")}
            </Link>
            <span className="text-zinc-300" aria-hidden>
              /
            </span>
            <Link
              href={catalogMarketOverviewReleaseAnalyticsPath(row.id)}
              className="transition-colors hover:text-zinc-900"
            >
              {t("catalog.buy.screen.releaseAnalytics")}
            </Link>
          </nav>

          <h1 className="text-[1.9rem] font-bold leading-[1.1] tracking-tight text-zinc-950 md:text-[2.3rem]">
            {t("catalog.buyUnt")}
          </h1>
          <p className="mt-2 text-[15px] text-zinc-600 md:text-[16px]">
            «{row.title}» · {row.artist}
            {detail ? (
              <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                {catalogCardRiskLabel({
                  purchaseState: detail.purchaseState,
                  liquidityScore: detail.liquidityScore,
                  locale,
                })}
              </span>
            ) : null}
          </p>
          {detail?.shortDescription ? (
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-zinc-600">{detail.shortDescription}</p>
          ) : null}
          <p className="mt-3 text-[14px] md:text-[15px]">
            <Link
              href={ROUTES.assetsUnt}
              className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-700 hover:decoration-zinc-500"
            >
              {t("catalog.buy.screen.whatIsUnt")}
            </Link>
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.25fr)] md:items-start">
            <aside className="rounded-3xl bg-zinc-100/70 p-5 md:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{t("catalog.buy.screen.aboutRelease")}</p>
              <h2 className="mt-2 text-[22px] font-bold tracking-tight text-zinc-950">{row.symbol}</h2>

              <dl className="mt-5 space-y-4 text-[13px]">
                <div>
                  <dt className="text-zinc-500">{t("catalog.buy.screen.unitPrice")}</dt>
                  <dd className="mt-0.5 font-mono text-[16px] font-semibold text-zinc-900">
                    {priceInvalid || unitPrice == null
                      ? t("catalog.cards.noData")
                      : formatUsdtFixedRu(unitPrice)}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">{t("catalog.buy.screen.availableUnits")}</dt>
                  <dd className="mt-0.5 font-mono text-[16px] font-semibold text-zinc-900">
                    {formatUnitsCompact(displayAvailableUnits)}
                  </dd>
                </div>
              </dl>

              <div className="mt-7 rounded-2xl bg-white/85 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{t("catalog.buy.screen.purchaseTerms")}</p>
                <dl className="mt-3 space-y-2.5 text-[13px]">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-zinc-500">{t("catalog.buy.screen.forSaleNow")}</dt>
                    <dd className="font-mono font-semibold text-zinc-900">{formatUnitsCompact(displayMaxUnits)} UNT</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-zinc-500">{t("catalog.buy.screen.maxPerOrder")}</dt>
                    <dd className="font-mono font-semibold text-zinc-900">{formatUnitsCompact(displayMaxUnits)} UNT</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-zinc-500">{t("catalog.buy.screen.minimum")}</dt>
                    <dd className="font-mono font-semibold text-zinc-900">
                      {displayMaxUnits > 0 && !priceInvalid
                        ? tf(t("catalog.buy.screen.minimumUnits"), { units: String(minUnits) })
                        : t("catalog.cards.noData")}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-zinc-500">{t("catalog.buy.screen.purchaseAmount")}</dt>
                    <dd className="text-right font-mono font-semibold text-zinc-900">
                      {minOrderUsdt != null && maxOrderUsdt != null && displayMaxUnits > 0
                        ? `${formatUsdtFixedRu(minOrderUsdt)} — ${formatUsdtFixedRu(maxOrderUsdt)}`
                        : t("catalog.cards.noData")}
                    </dd>
                  </div>
                  {ownershipAtMin != null ? (
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-zinc-500">{t("catalog.buy.screen.ownershipShare")}</dt>
                      <dd className="font-mono font-semibold text-zinc-900">
                        {tf(t("catalog.buy.screen.ownershipAtMin"), {
                          pct: String(ownershipAtMin),
                          units: String(minUnits),
                        })}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            </aside>

            <div>
              <CatalogBuyUnitsOrderPanel
                row={row}
                publicRound={primaryRound}
                purchaseState={purchaseState}
                initialBuyTerms={buyTerms}
                onBuyTermsChange={handleBuyTermsChange}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
