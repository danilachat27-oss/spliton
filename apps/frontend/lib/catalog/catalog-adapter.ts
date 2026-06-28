import type { CatalogItem } from "@/lib/catalog-mock";
import { DICTIONARIES } from "@/lib/i18n/dictionaries";
import { lookupDictionaryMessage } from "@/lib/i18n/dictionaries";
import { catalogCardRiskLabel, catalogCardStatusLabel } from "@/lib/i18n/catalog-card-labels";
import { formatNumber, formatPercent, intlLocaleFor } from "@/lib/i18n/formatters";
import { statusLabel } from "@/lib/i18n/status-labels";
import type { AppLocale } from "@/lib/i18n/types";
import type {
  CatalogReleaseCardApi,
  CatalogReleaseDetailApi,
} from "@/services/catalog.service";

import {
  mapCatalogCardUiStatus,
  mapPurchaseStateToMarketOverviewStatus,
} from "@/lib/catalog/catalog-purchase.util";
import type { MarketOverviewRow } from "@/types/market-overview";

function catalogText(locale: AppLocale, key: string): string {
  return lookupDictionaryMessage(DICTIONARIES[locale], key, locale, {
    enMessages: DICTIONARIES.en,
  });
}
function formatUsdtShort(n: number, locale: AppLocale): string {
  return formatNumber(n, locale);
}

function parseAmount(raw: string | null | undefined): number | null {
  if (raw == null || !raw.trim()) return null;
  const n = Number.parseFloat(raw.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseAmountUnits(raw: string | null | undefined): number {
  return parseAmount(raw) ?? 0;
}

function resolveGoalUsdt(
  card: CatalogReleaseCardApi,
  unitPrice: number,
  totalUnits: number,
): number | null {
  for (const raw of [card.goalUsdt, card.raiseTargetUsdt, card.hardCapUsdt]) {
    const value = parseAmount(raw);
    if (value != null) return value;
  }
  if (unitPrice > 0 && totalUnits > 0) return unitPrice * totalUnits;
  return null;
}

function formatForecastYield(raw: string | null | undefined, locale: AppLocale): string {
  const value = raw?.trim();
  if (!value) return catalogText(locale, "catalog.cards.noData");
  const numeric = Number.parseFloat(value.replace("%", "").replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(numeric)) return catalogText(locale, "catalog.cards.noData");
  return formatPercent(numeric, locale);
}

function formatUsdtFixed(value: number, locale: AppLocale, fractionDigits = 2): string {
  return new Intl.NumberFormat(intlLocaleFor(locale), {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function parseDisplayNumber(raw: string): number | null {
  const normalized = raw.replace(/[^\d,.-]/g, "").replace(/\s/g, "").replace(",", ".");
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

function remapLiquidityLabel(value: string, locale: AppLocale): string {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "высокая" || lower === "high") return statusLabel("liquidity", "high", locale);
  if (lower === "средняя" || lower === "medium" || lower === "mid") {
    return statusLabel("liquidity", "medium", locale);
  }
  if (lower === "низкая" || lower === "low" || lower === "thin") return statusLabel("liquidity", "low", locale);
  if (trimmed.endsWith("%")) return trimmed;
  const n = parseDisplayNumber(trimmed);
  if (n != null) return `${Math.round(n)}%`;
  return trimmed;
}

/** Re-localize mock/demo catalog cards for the active UI locale. */
export function localizeCatalogItem(item: CatalogItem, locale: AppLocale): CatalogItem {
  if (item.kind === "market") {
    const price = parseDisplayNumber(item.sharePrice);
    const payout = parseDisplayNumber(item.lastMonthPayout);
    return {
      ...item,
      sharePrice: price != null && price > 0 ? formatUsdtFixed(price, locale) : item.sharePrice,
      sharePriceChange: item.sharePriceChange.includes("%")
        ? formatForecastYield(item.sharePriceChange, locale)
        : item.sharePriceChange,
      lastMonthPayout:
        payout != null ? formatUsdtFixed(payout, locale) : catalogText(locale, "catalog.cards.noData"),
      liquidityLabel: item.liquidityLabel
        ? remapLiquidityLabel(item.liquidityLabel, locale)
        : item.liquidityLabel,
    };
  }

  const unitPrice = parseDisplayNumber(item.unitPriceUsdt);
  const raised = parseDisplayNumber(item.raised);
  const goal = item.goal ? parseDisplayNumber(item.goal) : null;

  return {
    ...item,
    raised: raised != null ? formatNumber(raised, locale) : item.raised,
    goal: goal != null ? formatNumber(goal, locale) : item.goal,
    availablePct: remapLiquidityLabel(item.availablePct, locale),
    forecastYield: formatForecastYield(item.forecastYield, locale),
    unitPriceUsdt: unitPrice != null && unitPrice > 0 ? formatUsdtFixed(unitPrice, locale) : "—",
    statusLabel: catalogCardStatusLabel({
      purchaseState: item.purchaseState,
      releaseStatus: item.roundStatus === "completed" ? "sold_out" : undefined,
      roundStatus: item.roundStatus,
      locale,
    }),
    riskLabel: catalogCardRiskLabel({
      purchaseState: item.purchaseState,
      hasLiveRound: item.purchaseState === "available",
      locale,
    }),
  };
}
function resolveSecondaryPrice(card: CatalogReleaseCardApi): number {
  return (
    parseAmount(card.bestSecondaryAskPrice) ??
    parseAmount(card.lastTradePrice) ??
    0
  );
}

function resolveCardKind(card: CatalogReleaseCardApi): CatalogItem["kind"] {
  if (card.cardKind === "market") return "market";
  if (card.cardKind === "payouts") return "funding";
  if (card.cardKind === "coming_soon") return "funding";
  if (
    card.secondaryMarketEnabled &&
    card.activeSecondaryListingsCount > 0 &&
    card.purchaseState !== "available"
  ) {
    return "market";
  }
  return "funding";
}

function mapCatalogStatus(card: CatalogReleaseCardApi): "open" | "payouts" {
  return mapCatalogCardUiStatus({
    catalogStatus: card.catalogStatus,
    purchaseState: card.purchaseState,
  });
}

function formatLiquidityScore(score: number | null | undefined, locale: AppLocale): string {
  if (score == null || !Number.isFinite(score)) return "—";
  if (score >= 0.7) return statusLabel("liquidity", "high", locale);
  if (score >= 0.35) return statusLabel("liquidity", "medium", locale);
  return statusLabel("liquidity", "low", locale);
}

export function adaptCatalogCardToItem(
  card: CatalogReleaseCardApi,
  locale: AppLocale = "ru",
): CatalogItem {  const kind = resolveCardKind(card);
  const lastTrade = catalogText(locale, "catalog.cards.lastTrade");

  if (kind === "market") {
    const price = resolveSecondaryPrice(card);
    return {
      kind: "market",
      id: card.id,
      slug: card.slug,
      title: card.title,
      artist: card.artist,
      genre: card.genre,
      sharePrice: price > 0 ? formatUsdtFixed(price, locale) : "—",
      sharePriceChange: card.lastTradePrice ? lastTrade : "—",
      lastMonthPayout: formatForecastYield(card.expectedYieldPct, locale),      coverUrl: card.coverUrl,
      shortDescription: card.shortDescription,
      statusLabel: catalogCardStatusLabel({
        purchaseState: card.purchaseState,
        releaseStatus: card.releaseStatus,
        roundStatus: card.roundStatus,
        locale,
      }),
      riskLabel: catalogCardRiskLabel({
        purchaseState: card.purchaseState,
        liquidityScore: card.liquidityScore,
        locale,
      }),
      activeListingsCount: card.activeSecondaryListingsCount,
      volume24hUsdt: card.volume24hUsdt,
      volume7dUsdt: card.volume7dUsdt,
      liquidityLabel: formatLiquidityScore(card.liquidityScore, locale),
      secondaryMarketEnabled: card.secondaryMarketEnabled,
      hasSparkline: false,
      hasAudioPreview: false,
    };
  }

  const raised = Number.parseFloat(card.raisedUsdt) || 0;
  const unitPrice =
    parseAmount(card.primaryUnitPriceUsdt) ??
    parseAmount(card.unitPriceUsdt) ??
    0;
  const total = Number.parseFloat(card.totalUnits.replace(/\s/g, "").replace(",", ".")) || 0;
  const available = parseAmountUnits(card.availableUnits);
  const goalValue = resolveGoalUsdt(card, unitPrice, total);
  const liquidityScore = card.liquidityScore;
  const availablePct =
    liquidityScore != null
      ? formatLiquidityScore(liquidityScore, locale)
      : total > 0
        ? `${Math.round((available / total) * 100)}%`
        : "—";

  return {
    kind: "funding",
    id: card.id,
    slug: card.slug,
    title: card.title,
    artist: card.artist,
    genre: card.genre,
    status: mapCatalogStatus(card),
    raised: formatUsdtShort(raised, locale),
    goal: goalValue != null ? formatUsdtShort(goalValue, locale) : "",
    pct: card.progressPct,
    availablePct,
    forecastYield: formatForecastYield(card.expectedYieldPct, locale),
    unitPriceUsdt: unitPrice > 0 ? formatUsdtFixed(unitPrice, locale) : "—",
    coverUrl: card.coverUrl,
    shortDescription: card.shortDescription,
    riskLabel: catalogCardRiskLabel({
      purchaseState: card.purchaseState,
      liquidityScore: card.liquidityScore,
      locale,
    }),
    statusLabel: catalogCardStatusLabel({
      purchaseState: card.purchaseState,
      releaseStatus: card.releaseStatus,
      roundStatus: card.roundStatus,
      locale,
    }),
    roundStatus: card.roundStatus,
    purchaseState: card.purchaseState,
    availableUnits: available,
    payoutFreq: card.payoutFreq,
    nextPayoutDate: card.nextPayoutDate,
    secondaryMarketEnabled: card.secondaryMarketEnabled,
    activeListingsCount: card.activeSecondaryListingsCount,
    hasSparkline: false,
    hasAudioPreview: false,
  };
}

export function catalogDetailToMarketRow(
  detail: CatalogReleaseDetailApi,
): MarketOverviewRow {  const available = Number.parseFloat(detail.availableUnits) || 0;
  const price = Number.parseFloat(detail.primaryUnitPriceUsdt) || 0;
  const secondaryPrice =
    parseAmount(detail.bestSecondaryAskPrice) ??
    parseAmount(detail.lastTradePrice) ??
    price;

  const mappedStatus = mapPurchaseStateToMarketOverviewStatus(detail.purchaseState);
  const liquidityScore = detail.liquidityScore;
  const liquidityLabel: MarketOverviewRow["liquidityLabel"] =
    liquidityScore == null
      ? "Mid"
      : liquidityScore >= 0.7
        ? "Deep"
        : liquidityScore >= 0.35
          ? "Mid"
          : "Thin";

  return {
    id: detail.id,
    symbol: detail.symbol,
    title: detail.title,
    artist: detail.artist,
    segment: detail.segment ?? detail.genre,
    yieldPct: detail.expectedYieldPct
      ? Number.parseFloat(detail.expectedYieldPct.replace("%", "").replace(",", ".")) || 0
      : 0,
    payoutsUsdt: Number.parseFloat(detail.raisedUsdt) || 0,
    activityScore: detail.progressPct,
    availableUnits: available,
    primaryUnitPriceUsdt: price,
    secondaryLabel:
      detail.activeSecondaryListingsCount > 0
        ? "High"
        : detail.secondaryMarketEnabled
          ? "Medium"
          : "—",
    liquidityLabel,    trend: "flat",
    sparkline: secondaryPrice > 0 ? [secondaryPrice] : [price].filter((v) => v > 0),
    status: mappedStatus,
    payoutFreq: detail.payoutFreq,
    categories: ["all"],
  };
}
