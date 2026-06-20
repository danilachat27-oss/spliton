"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, ChevronRight, ExternalLink } from "@/lib/lucide";

import { SecondaryMarketBreadcrumbNav } from "@/components/dashboard/secondary-market/secondary-market-breadcrumb-nav";
import {
  SecondaryMarketEmptyState,
  SecondaryMarketErrorState,
  SecondaryMarketLoadingState,
} from "@/components/dashboard/secondary-market/secondary-market-fetch-states";
import {
  secondaryMarketBookHref,
  secondaryMarketBookIdForSymbol,
  secondaryMarketHref,
} from "@/constants/dashboard/secondary-market";
import {
  analyticsReleaseDetailPath,
  secondaryMarketListingInfoPath,
  secondaryMarketReleaseAnalyticsPath,
} from "@/constants/routes";
import { ReleaseAnalyticsProChart } from "@/features/catalog/market-overview/release-analytics/ui/release-analytics-pro-chart";
import { getSecondaryMarketAnalyticsCatalogIdForReleaseSlug } from "@/mocks/dashboard/secondary-market-listings.mock";
import {
  getSecondaryMarketListingTradesMock,
  SECONDARY_MARKET_LISTINGS_MOCK,
} from "@/mocks/dashboard/secondary-market-listings.mock";
import { buildSecondaryMarketTradingAnalytics } from "@/mocks/dashboard/secondary-market-trading-analytics.mock";
import { SecondaryMarketReleaseAnalyticsLive } from "@/components/dashboard/secondary-market/secondary-market-release-analytics-live";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  fetchMarketOverviewList,
  type MarketOverviewListItemApi,
} from "@/services/market-overview.service";
import { getWalletDataSource } from "@/services/wallet.service";
import { cn } from "@/lib/utils";

const ACTION_BTN = cn(
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#0a0a0a] px-3.5 text-[12px] font-medium text-zinc-300 ring-1 ring-white/8",
  "transition-colors hover:bg-white/[0.05] hover:text-white hover:ring-white/12",
);

const PRIMARY_CTA = cn(
  "inline-flex h-9 items-center justify-center rounded-full bg-[#B7F500] px-4 text-[12px] font-semibold text-black transition hover:bg-[#c9ff52] sm:h-10 sm:px-5 sm:text-[13px]",
);

function formatUsdt(n: number) {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function formatUsdtCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("ru-RU", { maximumFractionDigits: 2 })}M`;
  if (n >= 10_000) return `${(n / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}K`;
  return formatUsdt(n);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function liquidityLabel(l: "high" | "med" | "low", t: (key: string) => string) {
  if (l === "high") return t("secondaryMarket.kpi.liquidity.high");
  if (l === "med") return t("secondaryMarket.kpi.liquidity.med");
  return t("secondaryMarket.kpi.liquidity.low");
}

function MetaChip({ children, mono }: { children: ReactNode; mono?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-[#0a0a0a] px-2 py-0.5 text-[11px] text-zinc-400 ring-1 ring-white/8",
        mono && "font-mono tabular-nums text-zinc-300",
      )}
    >
      {children}
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-[#111111] px-3 py-3 ring-1 ring-white/6 transition-colors hover:bg-white/3">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600">{label}</p>
      <p className="mt-2 font-mono text-[15px] font-semibold tabular-nums tracking-tight text-white">{value}</p>
      {sub ? <p className="mt-1 text-[11px] leading-snug text-zinc-500">{sub}</p> : null}
    </div>
  );
}

function MiniBookSide({
  title,
  tone,
  rows,
}: {
  title: string;
  tone: "bid" | "ask";
  rows: Array<{ price: number; units: number }>;
}) {
  return (
    <div className="rounded-xl bg-[#0a0a0a] px-3 py-3 ring-1 ring-white/8">
      <p
        className={cn(
          "font-mono text-[10px] font-semibold uppercase tracking-[0.12em]",
          tone === "bid" ? "text-[#B7F500]/90" : "text-fuchsia-300/90",
        )}
      >
        {title}
      </p>
      <div className="mt-2 space-y-1.5">
        {rows.map((r, i) => (
          <div key={`${title}-${i}`} className="flex items-center justify-between gap-2 font-mono text-[12px]">
            <span className={tone === "bid" ? "text-[#c8f06a]" : "text-fuchsia-200"}>{formatUsdt(r.price)}</span>
            <span className="tabular-nums text-zinc-500">{r.units} u</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoverThumb({ symbol }: { symbol: string }) {
  const hue = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="size-10 shrink-0 rounded-full ring-1 ring-white/10"
      style={{
        background: `linear-gradient(145deg, hsl(${hue}, 42%, 28%) 0%, hsl(${(hue + 48) % 360}, 28%, 12%) 100%)`,
      }}
      aria-hidden
    />
  );
}

export function SecondaryMarketReleaseAnalyticsTab({
  releaseId,
  unknownReleaseQuery,
}: {
  releaseId: string | null;
  unknownReleaseQuery?: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const isLive = getWalletDataSource() === "live";
  const [overviewItems, setOverviewItems] = useState<MarketOverviewListItemApi[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(
    isLive && !releaseId && !unknownReleaseQuery,
  );
  const [overviewError, setOverviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLive || releaseId || unknownReleaseQuery) return;
    let cancelled = false;
    setOverviewLoading(true);
    setOverviewError(null);
    void fetchMarketOverviewList({ sort: "activity", sortDir: "desc" })
      .then((res) => {
        if (!cancelled) setOverviewItems(res.items);
      })
      .catch(() => {
        if (!cancelled) {
          setOverviewItems([]);
          setOverviewError(t("secondaryMarket.errors.loadFailed"));
        }
      })
      .finally(() => {
        if (!cancelled) setOverviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLive, releaseId, unknownReleaseQuery, t]);

  if (unknownReleaseQuery) {
    return (
      <div className="rounded-xl bg-[#111111] p-8 text-center ring-1 ring-white/6">
        <SecondaryMarketBreadcrumbNav
          className="mb-6 justify-center"
          items={[
            { label: t("meta.secondaryMarket.breadcrumb.secondaryMarket"), href: secondaryMarketHref("market") },
            { label: t("meta.secondaryMarket.breadcrumb.tradingAnalytics"), href: secondaryMarketHref("analytics"), scroll: false },
            { label: t("secondaryMarket.empty.notFoundBreadcrumb") },
          ]}
        />
        <p className="font-mono text-sm text-zinc-400">{t("secondaryMarket.empty.analyticsReleaseNotFound")}</p>
        <p className="mt-2 font-mono text-[11px] text-zinc-600">{t("secondaryMarket.empty.analyticsCheckReleaseParam")}</p>
        <button
          type="button"
          onClick={() => router.replace(secondaryMarketHref("analytics"), { scroll: false })}
          className={cn(PRIMARY_CTA, "mt-5")}
        >
          {t("secondaryMarket.hero.analytics.backToInstruments")}
        </button>
      </div>
    );
  }

  if (!releaseId) {
    if (isLive) {
      if (overviewLoading) {
        return <SecondaryMarketLoadingState label={t("secondaryMarket.errors.loadingListings")} />;
      }
      if (overviewError) {
        return <SecondaryMarketErrorState message={overviewError} />;
      }
      if (overviewItems.length === 0) {
        return (
          <SecondaryMarketEmptyState
            title={t("secondaryMarket.listings.emptyActiveTitle")}
            description={t("secondaryMarket.market.emptyActiveDesc")}
          />
        );
      }
      return (
        <div className="space-y-6">
          <SecondaryMarketBreadcrumbNav
            items={[
              { label: t("meta.secondaryMarket.breadcrumb.secondaryMarket"), href: secondaryMarketHref("market") },
              { label: t("meta.secondaryMarket.breadcrumb.tradingAnalytics") },
            ]}
          />
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">
              {t("secondaryMarket.hero.analytics.instrumentsSection")}
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
              {t("secondaryMarket.hero.analytics.title")}
            </h2>
            <p className="mt-2 max-w-[56ch] text-[13px] leading-relaxed text-zinc-500">
              {t("secondaryMarket.hero.analytics.lead")}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {overviewItems.map((row) => (
              <Link
                key={row.id}
                href={secondaryMarketReleaseAnalyticsPath(row.slug || row.id)}
                scroll={false}
                className="flex items-center gap-3 rounded-xl bg-[#111111] px-3 py-3 ring-1 ring-white/6 transition-colors hover:bg-white/3"
              >
                <CoverThumb symbol={row.symbol} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs font-semibold text-white">{row.symbol}</p>
                  <p className="truncate text-[13px] font-medium text-zinc-200">{row.title}</p>
                  <p className="truncate font-mono text-[11px] text-zinc-600">{row.artist}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-zinc-600" aria-hidden />
              </Link>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <SecondaryMarketBreadcrumbNav
          items={[
            { label: t("meta.secondaryMarket.breadcrumb.secondaryMarket"), href: secondaryMarketHref("market") },
            { label: t("meta.secondaryMarket.breadcrumb.tradingAnalytics") },
          ]}
        />
        <div>
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">{t("secondaryMarket.hero.analytics.instrumentsSection")}</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">{t("secondaryMarket.hero.analytics.title")}</h2>
          <p className="mt-2 max-w-[56ch] text-[13px] leading-relaxed text-zinc-500">
            {t("secondaryMarket.hero.analytics.lead")}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SECONDARY_MARKET_LISTINGS_MOCK.map((row) => (
            <Link
              key={row.id}
              href={secondaryMarketReleaseAnalyticsPath(row.releaseId)}
              scroll={false}
              className="flex items-center gap-3 rounded-xl bg-[#111111] px-3 py-3 ring-1 ring-white/6 transition-colors hover:bg-white/3"
            >
              <CoverThumb symbol={row.symbol} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs font-semibold text-white">{row.symbol}</p>
                <p className="truncate text-[13px] font-medium text-zinc-200">{row.track}</p>
                <p className="truncate font-mono text-[11px] text-zinc-600">{row.artist}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-zinc-600" aria-hidden />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (isLive && releaseId) {
    return <SecondaryMarketReleaseAnalyticsLive releaseId={releaseId} />;
  }

  const listing = SECONDARY_MARKET_LISTINGS_MOCK.find((l) => l.releaseId === releaseId);
  if (!listing) return null;

  const a = buildSecondaryMarketTradingAnalytics(listing);
  const trades = getSecondaryMarketListingTradesMock(listing).slice(0, 12);
  const bookId = secondaryMarketBookIdForSymbol(listing.symbol);
  const catalogAnalyticsId = getSecondaryMarketAnalyticsCatalogIdForReleaseSlug(listing.releaseId);
  const mid = round2((a.bestBid + a.bestAsk) / 2);
  const depthSeries = a.depthBidPct.map((b, i) => b + (a.depthAskPct[i] ?? 0));

  const askLevels = [0, 1, 2].map((i) => ({
    price: Number((a.bestAsk + i * 0.03).toFixed(2)),
    units: Math.max(8, Math.round((listing.unitsAvailable / 8) * (1 - i * 0.22))),
  }));
  const bidLevels = [0, 1, 2].map((i) => ({
    price: Number((a.bestBid - i * 0.03).toFixed(2)),
    units: Math.max(8, Math.round((listing.unitsAvailable / 8) * (1 - i * 0.2))),
  }));

  const periodRows = [
    {
      period: t("secondaryMarket.trade.period24h"),
      volume: `${formatUsdtCompact(a.volume24hUsdt)} USDT`,
      trades: String(a.trades24h),
      avgPrice: formatUsdt(a.lastTradedPrice),
      spread: `${formatUsdt(a.spread)} (${a.spreadPct.toFixed(2)}%)`,
    },
    {
      period: t("secondaryMarket.trade.period7d"),
      volume: `${formatUsdtCompact(a.volume7dUsdt)} USDT`,
      trades: String(a.trades7d),
      avgPrice: formatUsdt(mid),
      spread: `${formatUsdt(a.spread)}`,
    },
    {
      period: t("secondaryMarket.trade.period30d"),
      volume: `${formatUsdtCompact(a.volume30dUsdt)} USDT`,
      trades: String(a.trades30d),
      avgPrice: formatUsdt(listing.pricePerUnit),
      spread: `${formatUsdt(a.spread)}`,
    },
  ];

  const genreRu: Record<(typeof listing)["genre"], string> = {
    electronic: "Electronic",
    pop: "Pop",
    hiphop: "Hip-Hop",
    rock: "Rock",
  };

  return (
    <div className="space-y-8 font-sans tabular-nums text-white antialiased md:space-y-10">
      <header className="border-b border-white/6 pb-6">
        <SecondaryMarketBreadcrumbNav
          className="mb-4"
          items={[
            { label: t("meta.secondaryMarket.breadcrumb.secondaryMarket"), href: secondaryMarketHref("market") },
            { label: t("meta.secondaryMarket.breadcrumb.listingsMarket"), href: secondaryMarketHref("market") },
            { label: t("meta.secondaryMarket.breadcrumb.tradingAnalytics"), href: secondaryMarketHref("analytics"), scroll: false },
            { label: `${listing.symbol}/USDT` },
          ]}
        />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight text-white md:text-2xl">{t("secondaryMarket.hero.analytics.title")}</h1>
              <p className="mt-1.5 max-w-[60ch] text-[13px] leading-relaxed text-zinc-500">
                {t("meta.secondaryMarket.surface.analytics.subtitle")}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <CoverThumb symbol={listing.symbol} />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-white">{listing.track}</p>
                  <p className="truncate text-[13px] text-zinc-500">{listing.artist}</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-md bg-[#0a0a0a] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest ring-1 ring-inset",
                    a.liquidity === "high" && "text-[#d4f570] ring-[#B7F500]/22",
                    a.liquidity === "med" && "text-zinc-300 ring-white/10",
                    a.liquidity === "low" && "text-amber-200/90 ring-amber-500/20",
                  )}
                >
                  {t("secondaryMarket.analytics.liquidity")} · {liquidityLabel(a.liquidity, t)}
                </span>
                <MetaChip mono>{listing.symbol}</MetaChip>
                <MetaChip>{genreRu[listing.genre]}</MetaChip>
              </div>
          </div>

          <nav
            className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end"
            aria-label={t("secondaryMarket.actions.actions")}
          >
            {bookId ? (
              <Link href={secondaryMarketBookHref(bookId)} className={cn(PRIMARY_CTA, "inline-flex items-center gap-1.5")}>
                <BookOpen className="size-3.5" strokeWidth={2} aria-hidden />
                {t("secondaryMarket.analytics.openOrderBook")}
              </Link>
            ) : null}
            <Link href={secondaryMarketListingInfoPath(listing.id)} className={ACTION_BTN}>
              {t("secondaryMarket.listingDetail.listingInfo")}
            </Link>
            <Link href={`${analyticsReleaseDetailPath(catalogAnalyticsId)}?from=secondary`} className={ACTION_BTN}>
              {t("secondaryMarket.listingDetail.releaseAnalyticsLink")}
              <ExternalLink className="size-3.5 opacity-45" strokeWidth={1.75} aria-hidden />
            </Link>
          </nav>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">{t("secondaryMarket.analytics.keyMetrics")}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
          <Stat label={t("secondaryMarket.analytics.bestBid")} value={`${formatUsdt(a.bestBid)}`} sub={t("secondaryMarket.analytics.usdtPerUnt")} />
          <Stat label={t("secondaryMarket.analytics.bestAsk")} value={`${formatUsdt(a.bestAsk)}`} sub={t("secondaryMarket.analytics.usdtPerUnt")} />
          <Stat label={t("secondaryMarket.kpi.last")} value={`${formatUsdt(a.lastTradedPrice)}`} sub={t("secondaryMarket.analytics.usdtPerUnt")} />
          <Stat label={t("secondaryMarket.orderBook.mid")} value={`${formatUsdt(mid)}`} sub={t("secondaryMarket.analytics.usdtPerUnt")} />
          <Stat label={t("secondaryMarket.kpi.spread")} value={formatUsdt(a.spread)} sub={t("secondaryMarket.kpi.usdt")} />
          <Stat label={t("secondaryMarket.analytics.spreadPct")} value={`${a.spreadPct.toFixed(2)}%`} sub={t("secondaryMarket.analytics.vsLast")} />
          <Stat label={t("secondaryMarket.analytics.trades24h")} value={String(a.trades24h)} />
          <Stat label={t("secondaryMarket.kpi.volume24h")} value={`${formatUsdtCompact(a.volume24hUsdt)} USDT`} />
          <Stat label={t("secondaryMarket.analytics.activeListings")} value={String(a.activeListings)} sub={t("secondaryMarket.analytics.activeCount")} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">{t("secondaryMarket.trade.chartsTitle")}</h2>
            <p className="mt-1 text-sm font-semibold text-white">{t("secondaryMarket.analytics.chartsHeadline")}</p>
            <p className="mt-1 max-w-[52ch] text-[12px] text-zinc-600">{t("secondaryMarket.analytics.chartsDesc")}</p>
          </div>
          {bookId ? (
            <Link href={secondaryMarketBookHref(bookId)} className={cn(PRIMARY_CTA, "shrink-0")}>
              {t("secondaryMarket.analytics.openOrderBook")}
            </Link>
          ) : null}
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          <div className="flex min-h-[240px] flex-col rounded-xl bg-[#111111] px-3 pb-2 pt-3 ring-1 ring-white/6">
            <h3 className="text-[13px] font-semibold text-white">Last</h3>
            <p className="mt-0.5 text-[11px] text-zinc-600">{t("secondaryMarket.analytics.priceTrendCaption")}</p>
            <div className="mt-3 min-h-0 flex-1">
              <ReleaseAnalyticsProChart values={a.priceTrend} accent="lime" />
            </div>
          </div>
          <div className="flex min-h-[240px] flex-col rounded-xl bg-[#111111] px-3 pb-2 pt-3 ring-1 ring-white/6">
            <h3 className="text-[13px] font-semibold text-white">{t("secondaryMarket.trade.chartVolume")}</h3>
            <p className="mt-0.5 text-[11px] text-zinc-600">{t("secondaryMarket.analytics.volumeBarsCaption")}</p>
            <div className="mt-3 min-h-0 flex-1">
              <ReleaseAnalyticsProChart values={a.volumeTrend} accent="sky" />
            </div>
          </div>
          <div className="flex min-h-[240px] flex-col rounded-xl bg-[#111111] px-3 pb-2 pt-3 ring-1 ring-white/6 md:col-span-2 xl:col-span-1">
            <h3 className="text-[13px] font-semibold text-white">{t("secondaryMarket.analytics.depthBidAskTitle")}</h3>
            <p className="mt-0.5 text-[11px] text-zinc-600">{t("secondaryMarket.analytics.depthSliceCaption")}</p>
            <div className="mt-3 min-h-0 flex-1">
              <ReleaseAnalyticsProChart values={depthSeries} accent="fuchsia" />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">{t("secondaryMarket.analytics.byPeriod")}</h2>
        <div className="overflow-x-auto rounded-xl bg-[#111111] ring-1 ring-white/6">
          <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="text-zinc-500">
                <th className="px-3 py-2.5 font-normal">
                  <span className="text-[11px] uppercase tracking-wide">{t("secondaryMarket.analytics.columnPeriod")}</span>
                </th>
                <th className="px-3 py-2.5 font-normal">
                  <span className="text-[11px] uppercase tracking-wide">{t("secondaryMarket.analytics.columnVolume")}</span>
                </th>
                <th className="px-3 py-2.5 font-normal">
                  <span className="text-[11px] uppercase tracking-wide">{t("secondaryMarket.analytics.columnTrades")}</span>
                </th>
                <th className="px-3 py-2.5 font-normal">
                  <span className="text-[11px] uppercase tracking-wide">{t("secondaryMarket.forms.avgPriceEstimate")}</span>
                </th>
                <th className="px-3 py-2.5 font-normal">
                  <span className="text-[11px] uppercase tracking-wide">{t("secondaryMarket.kpi.spread")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {periodRows.map((r) => (
                <tr key={r.period} className="border-t border-white/4 first:border-t-0 hover:bg-white/2">
                  <td className="px-3 py-2.5 font-mono text-[12px] font-semibold text-white">{r.period}</td>
                  <td className="px-3 py-2.5 font-mono tabular-nums text-zinc-200">{r.volume}</td>
                  <td className="px-3 py-2.5 font-mono tabular-nums text-zinc-400">{r.trades}</td>
                  <td className="px-3 py-2.5 font-mono tabular-nums text-zinc-200">{r.avgPrice}</td>
                  <td className="px-3 py-2.5 font-mono tabular-nums text-[#B7F500]/90">{r.spread}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">{t("secondaryMarket.analytics.miniBookTitle")}</h2>
            <p className="mt-1 text-sm font-semibold text-white">{t("secondaryMarket.analytics.miniBookHeadline")}</p>
            <p className="mt-1 text-[12px] text-zinc-600">{t("secondaryMarket.analytics.miniBookDesc")}</p>
          </div>
          {bookId ? (
            <Link href={secondaryMarketBookHref(bookId)} className={PRIMARY_CTA}>
              {t("secondaryMarket.orderBook.openFullBook")}
            </Link>
          ) : null}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <MiniBookSide title="Bid" tone="bid" rows={bidLevels} />
          <MiniBookSide title="Ask" tone="ask" rows={askLevels} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">{t("secondaryMarket.analytics.tradesTapeTitle")}</h2>
        <p className="text-sm font-semibold text-white">{t("secondaryMarket.trade.recentExecutions")}</p>
        <div className="overflow-x-auto rounded-xl bg-[#111111] ring-1 ring-white/6">
          <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="text-zinc-500">
                <th className="px-3 py-2.5 font-normal">
                  <span className="text-[11px] uppercase tracking-wide">{t("secondaryMarket.orderBook.tradesTime")}</span>
                </th>
                <th className="px-3 py-2.5 font-normal">
                  <span className="text-[11px] uppercase tracking-wide">{t("secondaryMarket.orderBook.tradesSide")}</span>
                </th>
                <th className="px-3 py-2.5 text-right font-normal">
                  <span className="text-[11px] uppercase tracking-wide">{t("secondaryMarket.orderBook.tradesPrice")}</span>
                </th>
                <th className="px-3 py-2.5 text-right font-normal">
                  <span className="text-[11px] uppercase tracking-wide">Units</span>
                </th>
                <th className="px-3 py-2.5 text-right font-normal">
                  <span className="text-[11px] uppercase tracking-wide">USDT</span>
                </th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {trades.map((trade, i) => (
                <tr key={`${trade.time}-${i}`} className="border-t border-white/4 first:border-t-0 hover:bg-white/2">
                  <td className="px-3 py-2.5 font-mono text-[12px] text-zinc-500">{trade.time}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        trade.side === "buy" ? "bg-[#B7F500]/14 text-[#d4f570]" : "bg-fuchsia-500/12 text-fuchsia-200",
                      )}
                    >
                      {t(`secondaryMarket.side.${trade.side}`)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white">{formatUsdt(trade.price)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-zinc-400">{trade.units}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-zinc-200">{formatUsdt(trade.notionalUsdt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="border-t border-white/6 pt-6 font-mono text-[11px] leading-relaxed text-zinc-600">
        {t("secondaryMarket.analytics.footerNote")}
      </p>
    </div>
  );
}
