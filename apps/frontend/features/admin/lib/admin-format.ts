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

export function getAdminEnvironmentLabel(): string {
  const env = getAppRuntimeMode();
  if (env === "production") return "Production";
  if (env === "staging") return "Staging";
  return "Local";
}
