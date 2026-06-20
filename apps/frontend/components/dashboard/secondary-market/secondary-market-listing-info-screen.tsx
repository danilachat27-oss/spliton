"use client";

import Link from "next/link";

import {
  Activity,
  ArrowDown,
  ArrowUp,
  Banknote,
  CircleDollarSign,
  Disc3,
  LayoutGrid,
  Layers,
  Signal,
  Store,
  TrendingUp,
} from "@/lib/lucide";

import { SecondaryMarketBreadcrumbNav } from "@/components/dashboard/secondary-market/secondary-market-breadcrumb-nav";
import { SecondaryMarketListingActionPanel } from "@/components/dashboard/secondary-market/secondary-market-listing-action-panel";
import { SecondaryMarketListingMetricCard } from "@/components/dashboard/secondary-market/secondary-market-listing-metric-card";
import { SecondaryMarketListingStatGrid } from "@/components/dashboard/secondary-market/secondary-market-listing-stat-grid";
import { useI18n } from "@/components/providers/i18n-provider";
import { tf } from "@/lib/i18n/financial-messages";
import { secondaryMarketBookIdForSymbol, secondaryMarketHref } from "@/constants/dashboard/secondary-market";
import { analyticsReleaseDetailPath, secondaryMarketReleaseAnalyticsPath } from "@/constants/routes";
import { DetailSection, DETAIL_SECTION_TITLE_COMPACT } from "@/features/analytics/releases/detail/detail-section";
import {
  getSecondaryMarketListingTradesMock,
  type SecondaryMarketListingMock,
  type SecondaryMarketListingTradeMock,
} from "@/mocks/dashboard/secondary-market-listings.mock";
import { listingEffectiveCanBuy, listingEffectiveStatus } from "@/lib/secondary-market/listing-availability.util";
import { listingStatusLabel } from "@/lib/wallet/status-labels";
import type { ReleaseDetailPageData } from "@/types/analytics/release-detail";
import { cn } from "@/lib/utils";

function formatUsdt(n: number) {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function tapeSameSideTrend(trades: SecondaryMarketListingTradeMock[], index: number): "up" | "down" | null {
  const t = trades[index];
  if (!t) return null;
  for (let j = index + 1; j < trades.length; j++) {
    const prev = trades[j];
    if (prev.side !== t.side) continue;
    if (t.price > prev.price) return "up";
    if (t.price < prev.price) return "down";
    return null;
  }
  return null;
}

const LISTING_RELEASE_SUMMARY_STATS = 8;

const LIQUIDITY_KEY = {
  high: "secondaryMarket.kpi.liquidity.high",
  med: "secondaryMarket.kpi.liquidity.med",
  low: "secondaryMarket.kpi.liquidity.low",
} as const;

export function SecondaryMarketListingInfoScreen({
  listing,
  releaseDetail,
  tradesOverride,
}: {
  listing: SecondaryMarketListingMock;
  releaseDetail: ReleaseDetailPageData;
  tradesOverride?: SecondaryMarketListingTradeMock[];
}) {
  const { t } = useI18n();
  const bookId = secondaryMarketBookIdForSymbol(listing.symbol) ?? listing.releaseId;
  const pos = listing.change7dPct >= 0;
  const trades = tradesOverride ?? getSecondaryMarketListingTradesMock(listing);
  const { row: catalogRow } = releaseDetail;
  const releaseAnalyticsHref = `${analyticsReleaseDetailPath(listing.analyticsCatalogId)}?from=secondary`;
  const tradingAnalyticsHref = secondaryMarketReleaseAnalyticsPath(listing.releaseId);
  const releaseSummaryStats = releaseDetail.quickStats.slice(0, LISTING_RELEASE_SUMMARY_STATS);
  const paramsDescParts = t("secondaryMarket.listingDetail.paramsDesc").split("{link}");
  const liquidityLabel = t(LIQUIDITY_KEY[listing.liquidity]);
  const listingStatus = listingEffectiveStatus(listing);
  const listingStatusText = listing.statusLabel ?? listingStatusLabel(listingStatus, t);
  const canPurchase = listingEffectiveCanBuy(listing);

  return (
    <div className="bg-black text-white">
      <div className="mx-auto w-full max-w-[1320px] px-4 pb-20 pt-6 md:px-6 lg:px-8 lg:pb-28 lg:pt-8">
        <SecondaryMarketBreadcrumbNav
          className="mt-1"
          items={[
            {
              label: t("meta.secondaryMarket.breadcrumb.secondaryMarket"),
              href: secondaryMarketHref("market"),
              icon: Store,
            },
            {
              label: t("meta.secondaryMarket.breadcrumb.listingsMarket"),
              href: secondaryMarketHref("market"),
              icon: LayoutGrid,
            },
            { label: listing.track, icon: Disc3 },
          ]}
        />

        <p className="mt-5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">
          {t("secondaryMarket.hero.listingDetail.badge")}
        </p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">{listing.track}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide",
              canPurchase ? "bg-[#B7F500]/15 text-[#B7F500]" : "bg-zinc-800 text-zinc-400",
            )}
          >
            {listingStatusText}
          </span>
          {!canPurchase ? (
            <span className="font-mono text-[11px] text-zinc-500">{t("secondaryMarket.listingDetail.notPurchasable")}</span>
          ) : null}
        </div>
        <p className="mt-2 font-mono text-xs text-zinc-500">
          {tf(t("secondaryMarket.hero.listingDetail.subtitle"), { symbol: listing.symbol })}
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="flex min-w-0 flex-col gap-8">
            <section aria-label={t("secondaryMarket.listingDetail.paramsTitle")}>
              <h2 className={DETAIL_SECTION_TITLE_COMPACT}>{t("secondaryMarket.listingDetail.paramsTitle")}</h2>
              <p className="mt-2 max-w-[72ch] text-sm leading-relaxed text-zinc-500">
                {paramsDescParts[0]}
                <Link href={releaseAnalyticsHref} className="text-zinc-400 underline-offset-2 hover:text-white hover:underline">
                  {t("secondaryMarket.listingDetail.linkedReleaseAnalytics")}
                </Link>
                {paramsDescParts[1] ?? ""}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <SecondaryMarketListingMetricCard
                  label={t("secondaryMarket.listingDetail.pricePerUnit")}
                  value={`${formatUsdt(listing.pricePerUnit)} USDT`}
                  icon={CircleDollarSign}
                  tone="neutral"
                />
                <SecondaryMarketListingMetricCard
                  label={t("secondaryMarket.listingDetail.availableToBuy")}
                  value={
                    <>
                      {listing.unitsAvailable}
                      <span className="ml-1.5 text-base font-medium text-zinc-500">
                        {t("secondaryMarket.listingDetail.units")}
                      </span>
                    </>
                  }
                  icon={Layers}
                  tone={canPurchase ? "neutral" : "muted"}
                />
                <SecondaryMarketListingMetricCard
                  label={t("secondaryMarket.listingDetail.lotNotional")}
                  value={`${formatUsdt(listing.listingValueUsdt)} USDT`}
                  icon={Banknote}
                  tone="neutral"
                />
                <SecondaryMarketListingMetricCard
                  label={t("secondaryMarket.listingDetail.change7d")}
                  value={`${pos ? "+" : ""}${listing.change7dPct.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}%`}
                  icon={TrendingUp}
                  tone={pos ? "positive" : "negative"}
                  trend={pos ? "up" : listing.change7dPct < 0 ? "down" : "flat"}
                  trendTitle={pos ? t("secondaryMarket.listingDetail.trendUp7d") : t("secondaryMarket.listingDetail.trendDown7d")}
                />
                <SecondaryMarketListingMetricCard
                  label={t("secondaryMarket.listingDetail.deals7d")}
                  value={listing.deals7d}
                  icon={Activity}
                  tone={listing.deals7d > 0 ? "neutral" : "muted"}
                  trend={listing.deals7d > 0 ? "up" : "flat"}
                  trendTitle={listing.deals7d > 0 ? undefined : t("secondaryMarket.listingDetail.noTrades7d")}
                />
                <SecondaryMarketListingMetricCard
                  label={t("secondaryMarket.listingDetail.liquidityMock")}
                  value={liquidityLabel}
                  icon={Signal}
                  tone={listing.liquidity === "high" ? "positive" : listing.liquidity === "low" ? "warning" : "neutral"}
                  trend={listing.liquidity === "high" ? "up" : listing.liquidity === "low" ? "down" : "flat"}
                  footer={
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          listing.liquidity === "high" ? "w-[88%] bg-[#B7F500]/85" : "",
                          listing.liquidity === "med" ? "w-[55%] bg-[#B7F500]/55" : "",
                          listing.liquidity === "low" ? "w-[28%] bg-zinc-500" : "",
                        )}
                      />
                    </div>
                  }
                />
              </div>
            </section>

            <DetailSection
              className="!mt-0 border-t border-white/8 pt-8"
              eyebrow="Secondary"
              title={t("secondaryMarket.listingDetail.recentTradesTitle")}
              titleClassName={DETAIL_SECTION_TITLE_COMPACT}
              description={t("secondaryMarket.listingDetail.recentTradesDesc")}
            >
              <div className="overflow-x-auto rounded-xl bg-[#111111] ring-1 ring-white/6">
                <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-3 font-medium">{t("secondaryMarket.orderBook.tradesTime")}</th>
                      <th className="px-4 py-3 font-medium">{t("secondaryMarket.orderBook.tradesSide")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("secondaryMarket.orderBook.tradesPrice")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("secondaryMarket.orderBook.unitsHeader")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("secondaryMarket.kpi.usdt")}</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-zinc-300">
                    {trades.map((trade, i) => {
                      const trend = tapeSameSideTrend(trades, i);
                      const trendTitle =
                        trend === "up"
                          ? trade.side === "buy"
                            ? t("secondaryMarket.listingDetail.trendAbovePrevBuy")
                            : t("secondaryMarket.listingDetail.trendAbovePrevSell")
                          : trend === "down"
                            ? trade.side === "buy"
                              ? t("secondaryMarket.listingDetail.trendBelowPrevBuy")
                              : t("secondaryMarket.listingDetail.trendBelowPrevSell")
                            : undefined;

                      return (
                        <tr key={`${trade.time}-${i}`} className="border-t border-white/5 transition-colors hover:bg-white/3">
                          <td className="px-4 py-2.5 text-zinc-400">{trade.time}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                trade.side === "buy" ? "bg-[#B7F500]/14 text-[#d4f570]" : "bg-fuchsia-500/12 text-fuchsia-200",
                              )}
                            >
                              {trade.side === "buy" ? t("secondaryMarket.side.buy") : t("secondaryMarket.side.sell")}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-white">
                            <span className="inline-flex w-full items-center justify-end gap-1">
                              {trend === "up" ? (
                                <span className="inline-flex shrink-0" title={trendTitle}>
                                  <ArrowUp
                                    className={cn("size-3.5", trade.side === "buy" ? "text-[#B7F500]" : "text-fuchsia-300")}
                                    strokeWidth={2.5}
                                    aria-hidden
                                  />
                                </span>
                              ) : null}
                              {trend === "down" ? (
                                <span className="inline-flex shrink-0" title={trendTitle}>
                                  <ArrowDown
                                    className={cn("size-3.5", trade.side === "buy" ? "text-fuchsia-300/90" : "text-zinc-500")}
                                    strokeWidth={2.5}
                                    aria-hidden
                                  />
                                </span>
                              ) : null}
                              <span>{formatUsdt(trade.price)}</span>
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{trade.units}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-zinc-200">{formatUsdt(trade.notionalUsdt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </DetailSection>

            <section className="border-t border-white/8 pt-8" aria-label={t("secondaryMarket.listingDetail.releaseSummaryTitle")}>
              <h2 className={DETAIL_SECTION_TITLE_COMPACT}>{t("secondaryMarket.listingDetail.releaseSummaryTitle")}</h2>
              <p className="mt-2 max-w-[72ch] text-sm text-zinc-500">{t("secondaryMarket.listingDetail.releaseSummaryDesc")}</p>
              <div className="mt-6">
                <SecondaryMarketListingStatGrid stats={releaseSummaryStats} />
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-6">
            <SecondaryMarketListingActionPanel
              symbol={catalogRow.symbol}
              releaseTitle={catalogRow.release}
              artist={catalogRow.artist}
              bookId={bookId}
              releaseAnalyticsHref={releaseAnalyticsHref}
              tradingAnalyticsHref={tradingAnalyticsHref}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
