import type { AppLocale } from "@/lib/i18n/types";
import { ADMIN_MESSAGES } from "@/lib/i18n/admin-messages";

function msg(locale: AppLocale, key: string, fallback?: string): string {
  return ADMIN_MESSAGES[locale]?.[key] ?? ADMIN_MESSAGES.ru[key] ?? fallback ?? key;
}

const REVENUE_STATUS_KEYS = [
  "draft",
  "calculated",
  "preview",
  "review",
  "approved",
  "paid",
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
  "manual_review",
] as const;

const REVENUE_SOURCE_KEYS = [
  "streaming",
  "distributor",
  "license",
  "manual",
  "import",
  "other",
] as const;

export type RevenueTooltipKey =
  | "grossRevenue"
  | "holdersShare"
  | "artistShare"
  | "platformShare"
  | "distribution"
  | "duplicateProtection"
  | "walletLedger"
  | "preview";

export function revenueStatusLabel(status: string, locale: AppLocale = "ru"): string {
  return msg(locale, `admin.revenue.status.${status}`, status);
}

export function revenueSourceLabel(source: string, locale: AppLocale = "ru"): string {
  return msg(locale, `admin.revenue.source.${source}`, source);
}

export function revenueFieldTooltip(field: RevenueTooltipKey, locale: AppLocale = "ru"): string {
  return msg(locale, `admin.revenue.tooltip.${field}`);
}

export function revenueSourceOptions(locale: AppLocale = "ru") {
  return [
    { value: "all", label: msg(locale, "admin.revenue.sourceAll") },
    ...REVENUE_SOURCE_KEYS.map((value) => ({
      value,
      label: revenueSourceLabel(value, locale),
    })),
  ] as const;
}

/** @deprecated Use revenueFieldTooltip(field, locale) */
export const REVENUE_FIELD_TOOLTIPS = {
  grossRevenue: revenueFieldTooltip("grossRevenue"),
  holdersShare: revenueFieldTooltip("holdersShare"),
  artistShare: revenueFieldTooltip("artistShare"),
  platformShare: revenueFieldTooltip("platformShare"),
  distribution: revenueFieldTooltip("distribution"),
  duplicateProtection: revenueFieldTooltip("duplicateProtection"),
  walletLedger: revenueFieldTooltip("walletLedger"),
  preview: revenueFieldTooltip("preview"),
} as const;

/** @deprecated Use revenueSourceOptions(locale) */
export const REVENUE_SOURCE_OPTIONS = revenueSourceOptions();

export function revenueStatusTone(
  status: string,
): "neutral" | "success" | "warning" | "pending" | "danger" | "info" {
  switch (status) {
    case "completed":
    case "paid":
      return "success";
    case "failed":
    case "cancelled":
      return "danger";
    case "manual_review":
    case "review":
      return "warning";
    case "preview":
    case "processing":
    case "calculated":
      return "info";
    case "approved":
      return "pending";
    case "pending":
    case "draft":
      return "pending";
    default:
      return "neutral";
  }
}

export function formatRevenuePeriod(from: string, to: string, locale: AppLocale = "ru"): string {
  const fmt = (d: string) => {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    return date.toLocaleDateString(locale === "ru" ? "ru-RU" : locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  return `${fmt(from)} · ${fmt(to)}`;
}
