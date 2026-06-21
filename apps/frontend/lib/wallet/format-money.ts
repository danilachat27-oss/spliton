import type { AppLocale } from "@/lib/i18n/types";
import { formatDateTime, formatUsdtAmount } from "@/lib/i18n/formatters";
import { emptyAmountLabel } from "@/lib/analytics/display-value";

/** Format decimal string/number as localized USDT amount. */
export function formatUsdtRu(
  amount: string | number,
  asset = "USDT",
  locale: AppLocale = "ru",
): string {
  const n =
    typeof amount === "string" ? Number(amount.replace(/\s/g, "").replace(",", ".")) : amount;
  if (!Number.isFinite(n)) return emptyAmountLabel(locale);
  if (asset === "USDT") return formatUsdtAmount(n, locale);
  return `${formatUsdtAmount(n, locale).replace(" USDT", "")} ${asset}`;
}

export function formatWalletDate(iso: string, locale: AppLocale = "ru"): string {
  return formatDateTime(iso, locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
