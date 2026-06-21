import type { AppLocale } from "./types";
import { DICTIONARIES } from "./dictionaries";
import { statusLabel } from "./status-labels";
import { isEmptyDisplayValue } from "@/lib/analytics/display-value";

function dict(locale: AppLocale, key: string): string {
  return DICTIONARIES[locale][key] ?? DICTIONARIES.ru[key] ?? key;
}

export function catalogPurchaseStateLabel(
  purchaseState: string | null | undefined,
  locale: AppLocale,
): string | undefined {
  if (!purchaseState) return undefined;
  const key = `catalog.purchaseState.${purchaseState}`;
  const value = dict(locale, key);
  return value !== key ? value : undefined;
}

export function catalogCardStatusLabel(input: {
  purchaseState?: string | null;
  releaseStatus?: string | null;
  roundStatus?: string | null;
  locale: AppLocale;
}): string {
  const fromPurchase = catalogPurchaseStateLabel(input.purchaseState, input.locale);
  if (fromPurchase) return fromPurchase;
  if (input.roundStatus) {
    const fromRound = statusLabel("round", input.roundStatus, input.locale);
    if (!isEmptyDisplayValue(fromRound)) return fromRound;
  }
  if (input.releaseStatus) {
    const normalized = input.releaseStatus.toLowerCase();
    const fromRelease = statusLabel("release", normalized, input.locale);
    if (!isEmptyDisplayValue(fromRelease)) return fromRelease;
  }
  return dict(input.locale, "catalog.cards.noData");
}

export function catalogCardRiskLabel(input: {
  purchaseState?: string | null;
  hasLiveRound?: boolean;
  liquidityScore?: number | null;
  locale: AppLocale;
}): string {
  if (input.purchaseState === "sold_out") {
    return dict(input.locale, "catalog.risk.roundClosed");
  }
  if (input.purchaseState === "paused") {
    return dict(input.locale, "catalog.risk.paused");
  }
  if (input.purchaseState === "unavailable") {
    return dict(input.locale, "catalog.risk.unavailable");
  }
  if (input.hasLiveRound === false) {
    return dict(input.locale, "catalog.risk.noActiveRound");
  }
  const score = input.liquidityScore;
  if (score != null && Number.isFinite(score) && score < 0.35) {
    return dict(input.locale, "catalog.risk.lowLiquidity");
  }
  return dict(input.locale, "catalog.risk.standard");
}
