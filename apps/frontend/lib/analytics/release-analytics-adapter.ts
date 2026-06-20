import { ROUTES } from "@/constants/routes";
import { secondaryMarketHref } from "@/constants/dashboard/secondary-market";
import { isEmptyDisplayValue } from "@/lib/analytics/display-value";
import {
  buildAboutParagraphs,
  buildHowItWorksSection,
  buildPulsePanel,
  buildQuickStatsLocalized,
  buildReleaseDetailPageState,
  buildTermsRows,
  resolveDetailRowStatus,
  resolveLifecycleLabel,
} from "@/lib/analytics/release-detail-build";
import { detailPageText } from "@/lib/i18n/analytics-detail-page-messages";
import type { ReleaseDetailPageData, ReleaseDetailChartPeriod } from "@/types/analytics/release-detail";
import { applyReleaseDetailSummarySparklines, type ReleaseDetailSparklineCharts } from "@/lib/analytics/release-detail-summary-sparklines";
import { statusLabel } from "@/lib/i18n/status-labels";
import type { AppLocale } from "@/lib/i18n/types";
import type { ReleaseDetailFullApi, ReleaseMyHistoryApi, ReleasePriceChartApi } from "@/types/analytics/release-detail-api";
import type { ReleaseAnalyticsRow, ReleaseRowGenre } from "@/types/analytics/releases";
import type {
  ReleaseAnalyticsLedgerApi,
  ReleaseAnalyticsListApi,
} from "@/services/release-analytics.service";

function normalizeGenre(genre: string): ReleaseRowGenre {
  const g = genre.toLowerCase();
  if (g.includes("hip")) return "hiphop";
  if (g.includes("pop")) return "pop";
  return "electronic";
}

export function adaptAnalyticsListItem(
  item: ReleaseAnalyticsListApi["items"][number],
): ReleaseAnalyticsRow {
  const parsedRaisedUsdt =
    item.raisedUsdt == null
      ? null
      : (() => {
          const n = Number.parseFloat(item.raisedUsdt);
          return Number.isFinite(n) ? n : null;
        })();

  return {
    id: item.id,
    symbol: item.symbol,
    release: item.release,
    artist: item.artist,
    genre: normalizeGenre(item.genre),
    yieldPct: item.yieldPct,
    changePct: item.changePct,
    payouts: item.payouts,
    units: item.units.replace(/\s/g, " ").trim(),
    status: item.status,
    trend: item.trend,
    sparkline: item.sparkline,
    payoutBand: item.payoutBand,
    soldUnits: item.soldUnits,
    availableUnits: item.availableUnits,
    pricePerUnitUsdt: item.pricePerUnitUsdt,
    raisedUsdt: parsedRaisedUsdt,
    targetUsdt: item.targetUsdt,
    progressPercent: item.progressPercent ?? null,
    holdersCount: item.holdersCount ?? null,
    secondaryListingsCount: item.secondaryListingsCount ?? null,
    secondaryVolumeUsdt: item.secondaryVolumeUsdt,
    liquidityPercent: item.liquidityPercent ?? null,
    lastTradePrice: item.lastTradePrice ?? null,
    updatedAt: item.updatedAt,
  };
}


function buildCoverFromIdentity(identity: ReleaseDetailFullApi["identity"]): ReleaseDetailPageData["cover"] {
  const posterSrc = identity.videoPosterUrl ?? identity.coverUrl ?? undefined;
  const videoStatus = (identity.videoStatus ?? "NONE") as NonNullable<
    ReleaseDetailPageData["cover"]
  >["videoStatus"];

  if (identity.videoStatus === "READY" && identity.videoUrl) {
    return {
      videoSrc: identity.videoUrl,
      videoType: identity.videoType === "HLS" ? "HLS" : "MP4",
      videoStatus: "READY",
      posterSrc,
      caption: identity.shortDescription ?? undefined,
    };
  }

  return {
    videoStatus,
    posterSrc: posterSrc || undefined,
    caption: identity.shortDescription ?? undefined,
  };
}

function secondaryRowsFromSummary(
  summary: ReleaseDetailFullApi["secondarySummary"],
  enabled: boolean,
  locale: AppLocale,
): { label: string; value: string }[] {
  const t = (key: Parameters<typeof detailPageText>[1]) => detailPageText(locale, key);
  const liquidityUi = statusLabel("liquidity", summary.liquidityLabel, locale);
  if (!enabled) {
    return [{ label: t("analytics.detail.secondary.eyebrow"), value: t("analytics.detail.secondary.unavailable") }];
  }
  if (!summary.secondaryAvailable && summary.activeListings === 0 && summary.trades7d === 0) {
    return [];
  }

  const rows: { label: string; value: string }[] = [
    { label: t("analytics.detail.secondary.activeListings"), value: String(summary.activeListings) },
    { label: t("analytics.detail.secondary.trades7d"), value: String(summary.trades7d) },
  ];
  if (summary.bestAsk) rows.push({ label: t("analytics.detail.secondary.bestAsk"), value: `${summary.bestAsk} USDT` });
  if (summary.bestBid) rows.push({ label: t("analytics.detail.secondary.bestBid"), value: `${summary.bestBid} USDT` });
  if (summary.lastTradePrice) rows.push({ label: t("analytics.detail.secondary.lastPrice"), value: `${summary.lastTradePrice} USDT` });
  if (summary.averageSpread) rows.push({ label: t("analytics.detail.secondary.spread"), value: `${summary.averageSpread} USDT` });
  if (summary.secondaryVolume24h) rows.push({ label: t("analytics.detail.secondary.volume24h"), value: summary.secondaryVolume24h });
  if (!isEmptyDisplayValue(liquidityUi)) rows.push({ label: t("analytics.detail.secondary.liquidity"), value: liquidityUi });
  return rows;
}

/** Preferred live adapter: GET /api/v1/releases/:id/detail + price chart. */
export function buildReleaseDetailPageDataFromFullApi(
  detail: ReleaseDetailFullApi,
  chart: ReleasePriceChartApi,
  charts?: ReleaseDetailSparklineCharts,
  locale: AppLocale = "ru",
): ReleaseDetailPageData {
  const { identity: id, pulse, primaryRound, dealTerms, payoutSummary, secondarySummary } = detail;
  const pageState = buildReleaseDetailPageState(detail);
  const lifecycleLabel = resolveLifecycleLabel(detail, locale);
  const liquidityUi = statusLabel("liquidity", secondarySummary.liquidityLabel, locale);
  const soldUnitsFormatted = Number.parseFloat(primaryRound.soldUnits || "0").toLocaleString("ru-RU");
  const yieldVal = detail.expectedYieldPct ?? pulse.grossYieldReference;
  const row: ReleaseAnalyticsRow = {
    id: id.id,
    symbol: id.symbol,
    release: id.title,
    artist: id.artistName,
    genre: normalizeGenre(id.genre ?? "electronic"),
    yieldPct: yieldVal && !isEmptyDisplayValue(yieldVal) ? yieldVal : "0%",
    changePct: chart.miniStats[0]?.value ?? secondarySummary.priceChange7d ?? "0,0%",
    payouts: payoutSummary.payoutsAllTime || "0 USDT",
    units: soldUnitsFormatted,
    status: resolveDetailRowStatus(detail),
    trend: "flat",
    sparkline: chart.seriesByPeriod["30d"]?.slice(-12) ?? [],
    payoutBand: { lo: "0", hi: "0", t: 0.5 },
  };

  const seriesByPeriod = chart.seriesByPeriod as Record<ReleaseDetailChartPeriod, number[]>;
  const faq =
    detail.faq.length > 0 ? detail.faq.map((f) => ({ q: f.question, a: f.answer })) : [];
  const t = (key: Parameters<typeof detailPageText>[1]) => detailPageText(locale, key);

  const parseRoundNum = (raw: string | null | undefined) => {
    if (!raw) return 0;
    const n = Number.parseFloat(raw.replace(/[^\d.,-]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  const sparklineCharts: ReleaseDetailSparklineCharts = {
    ...charts,
    soldUnits: parseRoundNum(primaryRound.soldUnits),
    totalUnits: parseRoundNum(primaryRound.totalUnits),
    availableUnits:
      parseRoundNum(primaryRound.availableUnits) || parseRoundNum(pulse.availablePrimaryUnits),
  };

  return applyReleaseDetailSummarySparklines(
    {
    row,
    slug: id.slug,
    pageState,
    lifecycleLabel,
    breadcrumbs: [
      { label: t("analytics.detail.breadcrumb.catalog"), href: ROUTES.dashboardCatalog },
      { label: t("analytics.detail.breadcrumb.analytics"), href: ROUTES.analyticsReleases },
      { label: id.title },
    ],
    heroBlurb:
      id.shortDescription?.trim() ||
      id.fullDescription?.trim() ||
      t("analytics.detail.hero.fallbackBlurb"),
    cover: buildCoverFromIdentity(id),
    summaryPanel: buildPulsePanel(detail, locale),
    performance: {
      title: t("analytics.detail.chart.title"),
      subtitle: seriesByPeriod["30d"]?.length
        ? t("analytics.detail.chart.sourceNote")
        : t("analytics.detail.chart.emptyBody"),
      seriesByPeriod,
      miniStats: chart.miniStats,
    },
    quickStats: buildQuickStatsLocalized(detail, locale, soldUnitsFormatted),
    about: {
      title: t("analytics.detail.about.eyebrow"),
      paragraphs: buildAboutParagraphs(detail, locale),
    },
    howItWorks: buildHowItWorksSection(detail, locale),
    terms: {
      title: t("analytics.detail.terms.title"),
      rows: buildTermsRows(detail, locale),
    },
    payoutHistory: detail.payoutHistory,
    secondary: {
      title: t("analytics.detail.secondary.eyebrow"),
      rows: secondaryRowsFromSummary(secondarySummary, dealTerms.secondaryEnabled, locale),
      marketHref: dealTerms.secondaryEnabled
        ? secondaryMarketHref("market", { release: id.slug })
        : undefined,
    },
    faq,
    related: [
      { title: t("analytics.detail.breadcrumb.analytics"), description: "", href: ROUTES.analyticsReleases },
      { title: t("analytics.detail.breadcrumb.catalog"), description: "", href: ROUTES.dashboardCatalog },
    ],
    liveContext: {
      secondarySummary: {
        activeListings: secondarySummary.activeListings,
        trades7d: secondarySummary.trades7d,
        averageSpread: secondarySummary.averageSpread,
        bestBid: secondarySummary.bestBid,
        bestAsk: secondarySummary.bestAsk,
        lastTradePrice: secondarySummary.lastTradePrice,
        liquidityLabel: liquidityUi,
        secondaryVolume24h: secondarySummary.secondaryVolume24h,
        secondaryAvailable: secondarySummary.secondaryAvailable,
      },
      user: detail.user,
      walletCtaHref: pulse.walletCtaHref,
      walletCtaAvailable: pulse.walletCtaAvailable,
      canBuyPrimary: pageState.canBuyPrimary,
      primaryBlockingReason: detail.primaryRound.primaryBlockingReason,
    },
  },
    sparklineCharts,
  );
}

export function secondaryStackHrefForRelease(slug: string, _symbol: string): string {
  return secondaryMarketHref("market", { release: slug });
}

export type ReleaseLedgerEventUi = {
  id: string;
  title: string;
  date: string;
  detail: string;
  tone: "buy" | "order" | "fill" | "cancel" | "payout" | "sell" | "other";
};

function ledgerUiTone(
  tone: ReleaseAnalyticsLedgerApi["items"][number]["tone"],
): ReleaseLedgerEventUi["tone"] {
  if (tone === "sell" || tone === "other") return tone === "sell" ? "sell" : "other";
  if (tone === "buy" || tone === "order" || tone === "fill" || tone === "cancel" || tone === "payout") {
    return tone;
  }
  return "other";
}

export function adaptLedgerEvents(api: ReleaseAnalyticsLedgerApi): ReleaseLedgerEventUi[] {
  return api.items.map((item) => ({
    id: item.id,
    title: item.title,
    date: new Date(item.happenedAt).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    detail: item.detail,
    tone: ledgerUiTone(item.tone),
  }));
}

export function adaptMyHistoryLedgerEvents(api: ReleaseMyHistoryApi): ReleaseLedgerEventUi[] {
  if (api.ledger.length > 0) {
    return api.ledger.map((item) => ({
      id: item.id,
      title: item.title,
      date: new Date(item.happenedAt).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      detail: item.detail,
      tone: ledgerUiTone(item.tone),
    }));
  }
  const events: ReleaseLedgerEventUi[] = [];
  for (const t of api.trades.slice(0, 10)) {
    events.push({
      id: t.id,
      title: t.side === "buy" ? "Покупка UNT" : "Продажа UNT",
      date: new Date(t.executedAt).toLocaleDateString("ru-RU"),
      detail: `${t.units} u. · ${t.price} USDT`,
      tone: t.side === "buy" ? "buy" : "sell",
    });
  }
  for (const p of api.payouts.slice(0, 10)) {
    events.push({
      id: p.id,
      title: "Выплата",
      date: new Date(p.createdAt).toLocaleDateString("ru-RU"),
      detail: `+${p.amountNet} USDT · ${p.status}`,
      tone: "payout",
    });
  }
  return events.sort((a, b) => (a.date < b.date ? 1 : -1));
}
