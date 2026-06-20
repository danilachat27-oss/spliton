import type { SecondaryMarketListingMock, SecondaryMarketListingTradeMock } from "@/mocks/dashboard/secondary-market-listings.mock";
import type { ListingDetailDto } from "@/services/secondary-market.service";
import type { ReleaseDetailPageData } from "@/types/analytics/release-detail";
import type { ReleaseAnalyticsRow } from "@/types/analytics/releases";
import type { AppLocale } from "@/lib/i18n/types";
import { statusLabel } from "@/lib/i18n/status-labels";
import { listingStatusLabel } from "@/lib/wallet/status-labels";
import { adaptRichListing, type AdaptedListing } from "@/lib/secondary-market/secondary-market-adapter";
import { listingEffectiveStatus } from "@/lib/secondary-market/listing-availability.util";
import {
  createMockReleaseDetailPageState,
  mockLifecycleLabel,
} from "@/lib/analytics/release-detail-mock-state";

export function adaptListingDetailToMock(detail: ListingDetailDto): AdaptedListing {
  return adaptRichListing(detail.listing);
}

export function adaptRecentTrades(
  detail: ListingDetailDto,
): SecondaryMarketListingTradeMock[] {
  return detail.recentTrades.map((t) => ({
    time: new Date(t.executedAt).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    side: t.side,
    price: Number(t.price),
    units: Number(t.units),
    notionalUsdt: Number(t.grossAmount),
  }));
}

export function buildReleaseDetailStub(
  detail: ListingDetailDto,
  translate: (key: string) => string,
  locale: AppLocale,
): ReleaseDetailPageData {
  const s = detail.marketSummary;
  const listing = adaptListingDetailToMock(detail);
  const t = translate;
  const liquidityUi = statusLabel("liquidity", s.liquidityLabel, locale, s.liquidityLabel);
  const listingStatusUi =
    listing.statusLabel ||
    listingStatusLabel(listingEffectiveStatus(listing), (key) => t(key));

  const row: ReleaseAnalyticsRow = {
    id: detail.release.slug,
    symbol: detail.release.symbol,
    release: detail.release.title,
    artist: s.artist,
    genre:
      detail.release.genre === "hiphop" ||
      detail.release.genre === "pop" ||
      detail.release.genre === "electronic"
        ? detail.release.genre
        : ("electronic" as const),
    yieldPct: `${s.change7dPct}%`,
    changePct: `${s.change7dPct}%`,
    payouts: s.volume24hUsdt,
    units: detail.listing.unitsAvailable,
    status: "Active" as const,
    trend: Number(s.change7dPct) >= 0 ? ("up" as const) : ("down" as const),
    sparkline: listing.payoutSparkline,
    payoutBand: { lo: listing.range7dLow.toString(), hi: listing.range7dHigh.toString(), t: 0.5 },
  };

  return {
    row,
    breadcrumbs: [],
    heroBlurb: detail.release.description ?? "",
    summaryPanel: [],
    performance: {
      title: "Performance",
      subtitle: "",
      seriesByPeriod: {
        "7d": listing.payoutSparkline,
        "30d": listing.payoutSparkline,
        "90d": listing.payoutSparkline,
        ytd: listing.payoutSparkline,
        all: listing.payoutSparkline,
      },
      miniStats: [],
    },
    quickStats: [
      { label: t("secondaryMarket.kpi.volume24h"), value: `${s.volume24hUsdt} USDT` },
      { label: t("secondaryMarket.listingDetail.deals7d"), value: String(s.deals7d) },
      { label: t("secondaryMarket.kpi.spread"), value: `${s.spreadPct}%` },
      { label: t("secondaryMarket.analytics.liquidity"), value: liquidityUi },
      { label: t("secondaryMarket.analytics.bestBid"), value: s.bestBid ?? "—" },
      { label: t("secondaryMarket.analytics.bestAsk"), value: s.bestAsk ?? "—" },
      { label: t("secondaryMarket.market.column7dPct"), value: `${s.change7dPct}%` },
      { label: t("secondaryMarket.listingDetail.status"), value: listingStatusUi },
    ],
    about: { title: t("secondaryMarket.listingDetail.aboutRelease"), paragraphs: [detail.release.description ?? ""] },
    howItWorks: { title: "", blocks: [] },
    terms: { title: "", rows: [] },
    payoutHistory: [],
    secondary: { title: "", rows: [] },
    faq: [],
    related: [],
    pageState: createMockReleaseDetailPageState(row),
    lifecycleLabel: mockLifecycleLabel(row),
  };
}
