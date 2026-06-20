/** Единое форматирование денег и дат в operator portal. */

import { getAppRuntimeMode } from "@/lib/public-env";

export function formatUsdtAmount(value: string | number): string {
  const n = typeof value === "string" ? Number(value.replace(/[^\d.-]/g, "")) : value;
  if (Number.isNaN(n)) return String(value);
  return `${n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
}

export function formatUnits(value: string | number): string {
  const n = typeof value === "string" ? Number(value.replace(/[^\d.-]/g, "")) : value;
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("ru-RU", { maximumFractionDigits: 4 });
}

export function formatAdminDate(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return String(isoOrDate);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAdminDateShort(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return String(isoOrDate);
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Placeholder for KPI cards when a value is unavailable. */
export const ADMIN_METRIC_NA_LABEL = "Н/Д";

const ADMIN_METRIC_EMPTY_MARKERS = new Set(["", "—", "-", "–", ADMIN_METRIC_NA_LABEL]);

export function isAdminMetricEmpty(value: string | number | null | undefined): boolean {
  if (value == null) return true;
  return ADMIN_METRIC_EMPTY_MARKERS.has(String(value).trim());
}

export function formatAdminOptionalText(value: string | null | undefined): string {
  if (isAdminMetricEmpty(value)) return ADMIN_METRIC_NA_LABEL;
  return String(value).trim();
}

export function formatAdminOptionalDate(isoOrDate: string | null | undefined): string {
  if (!isoOrDate || isAdminMetricEmpty(isoOrDate)) return ADMIN_METRIC_NA_LABEL;
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return ADMIN_METRIC_NA_LABEL;
  return formatAdminDate(isoOrDate);
}

export function formatAdminMetricHours(hours: number | null | undefined): string {
  if (hours == null || Number.isNaN(hours)) return ADMIN_METRIC_NA_LABEL;
  return `${hours.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} ч`;
}

export function formatAdminMetricMinutes(minutes: number | null | undefined): string {
  if (minutes == null || Number.isNaN(minutes)) return ADMIN_METRIC_NA_LABEL;
  return `${minutes.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} мин`;
}

export function formatAdminMetricUsdt(value: string | number | null | undefined): string {
  if (value == null || value === "") return ADMIN_METRIC_NA_LABEL;
  const n = typeof value === "string" ? Number(value.replace(/[^\d.-]/g, "")) : value;
  if (Number.isNaN(n)) return ADMIN_METRIC_NA_LABEL;
  return formatUsdtAmount(value);
}

export function getAdminEnvironmentLabel(): string {
  const env = getAppRuntimeMode();
  if (env === "production") return "Production";
  if (env === "staging") return "Staging";
  return "Local";
}
