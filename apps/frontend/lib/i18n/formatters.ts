import type { AppLocale } from "./types";
import { emptyDateLabel } from "../analytics/display-value";

const INTL_LOCALE: Record<AppLocale, string> = {
  ru: "ru-RU",
  en: "en-US",
  es: "es-ES",
  pt: "pt-PT",
};

function intlLocale(locale: AppLocale): string {
  return INTL_LOCALE[locale] ?? INTL_LOCALE.ru;
}

/** BCP-47 tag for Intl APIs (centralized — avoid hardcoding in components). */
export function intlLocaleFor(locale: AppLocale): string {
  return intlLocale(locale);
}

function safeNumber(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0;
  return value;
}

export function formatCurrency(
  value: number | null | undefined,
  locale: AppLocale,
  currency = "USD",
): string {
  const n = safeNumber(value);
  try {
    return new Intl.NumberFormat(intlLocale(locale), {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

/** USDT amounts — always show 2 decimals with explicit suffix for clarity. */
export function formatUsdtAmount(value: number | null | undefined, locale: AppLocale): string {
  const n = safeNumber(value);
  const formatted = new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `${formatted} USDT`;
}

export function formatNumber(value: number | null | undefined, locale: AppLocale): string {
  const n = safeNumber(value);
  return new Intl.NumberFormat(intlLocale(locale)).format(n);
}

export function formatPercent(value: number | null | undefined, locale: AppLocale): string {
  const n = safeNumber(value);
  return `${new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)}%`;
}

export function formatDate(
  value: string | number | Date | null | undefined,
  locale: AppLocale,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return emptyDateLabel(locale);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return emptyDateLabel(locale);
  return date.toLocaleDateString(intlLocale(locale), options);
}

export function formatDateTime(
  value: string | number | Date | null | undefined,
  locale: AppLocale,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return emptyDateLabel(locale);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return emptyDateLabel(locale);
  return date.toLocaleString(intlLocale(locale), options);
}

/** Past-relative time via Intl (e.g. "3 hours ago" / "3 ч. назад"). Empty for invalid/future. */
export function formatRelativeTime(
  value: string | number | Date | null | undefined,
  locale: AppLocale,
): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  const then = date.getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 0) return "";

  try {
    const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
    const mins = Math.floor(diffSec / 60);
    if (mins < 1) return rtf.format(-Math.max(diffSec, 1), "second");
    if (mins < 60) return rtf.format(-mins, "minute");
    const hours = Math.floor(mins / 60);
    if (hours < 24) return rtf.format(-hours, "hour");
    const days = Math.floor(hours / 24);
    return rtf.format(-days, "day");
  } catch {
    return "";
  }
}
