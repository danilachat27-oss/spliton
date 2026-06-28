import type { AppLocale } from "./types";
import { DICTIONARIES, lookupDictionaryMessage } from "./dictionaries";

function dict(locale: AppLocale, key: string): string {
  return lookupDictionaryMessage(DICTIONARIES[locale], key, locale, {
    enMessages: DICTIONARIES.en,
  });
}

/** Holder-aware release risk hint — maps release status enum, not backend RU strings. */
export function releaseRiskContextLabel(
  releaseStatus: string | null | undefined,
  hasHolding: boolean,
  locale: AppLocale,
): string {
  if (!hasHolding) return dict(locale, "analytics.risk.noPosition");
  const normalized = (releaseStatus ?? "").toLowerCase();
  if (normalized === "paused") return dict(locale, "analytics.risk.pausedWithPosition");
  if (normalized === "active") return dict(locale, "analytics.risk.activeWithPosition");
  return dict(locale, "analytics.risk.closedWithPosition");
}

export function releaseRoundStatusLabel(releaseStatus: string | null | undefined, locale: AppLocale): string {
  const normalized = (releaseStatus ?? "").toLowerCase();
  if (normalized === "active") return dict(locale, "analytics.roundStatus.active");
  if (normalized === "paused") return dict(locale, "analytics.roundStatus.paused");
  return dict(locale, "analytics.roundStatus.closed");
}
