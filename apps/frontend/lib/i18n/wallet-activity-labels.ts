import type { AppLocale } from "./types";
import { DICTIONARIES, lookupDictionaryMessage } from "./dictionaries";
import { statusLabel } from "./status-labels";

const TYPE_KEYS: Record<string, string> = {
  deposit: "wallet.activity.type.deposit",
  withdrawal: "wallet.activity.type.withdrawal",
  primary_purchase: "wallet.activity.type.primary_purchase",
  secondary_buy: "wallet.activity.type.secondary_buy",
  secondary_sell: "wallet.activity.type.secondary_sell",
  payout: "wallet.activity.type.payout",
  fee: "wallet.activity.type.fee",
  refund: "wallet.activity.type.refund",
  trade_lock: "wallet.activity.type.trade_lock",
  admin_adjustment: "wallet.activity.type.admin_adjustment",
  other: "wallet.activity.type.other",
};

const STATUS_KEYS: Record<string, string> = {
  completed: "wallet.activity.status.completed",
  pending: "wallet.activity.status.pending",
  failed: "wallet.activity.status.failed",
  cancelled: "wallet.activity.status.cancelled",
  reversed: "wallet.activity.status.reversed",
};

function dict(locale: AppLocale, key: string): string | undefined {
  const value = lookupDictionaryMessage(DICTIONARIES[locale], key, locale, {
    enMessages: DICTIONARIES.en,
  });
  return value !== key ? value : undefined;
}

export function walletActivityTypeLabel(type: string, locale: AppLocale): string {
  const key = TYPE_KEYS[type];
  if (key) {
    const value = dict(locale, key);
    if (value) return value;
  }
  return type.replace(/_/g, " ");
}

export function walletActivityStatusLabel(status: string, locale: AppLocale): string {
  const normalized = status.toLowerCase();
  const key = STATUS_KEYS[normalized];
  if (key) {
    const value = dict(locale, key);
    if (value) return value;
  }
  if (normalized === "pending") return statusLabel("withdrawal", "pending", locale);
  if (normalized === "completed") return statusLabel("withdrawal", "completed", locale);
  if (normalized === "failed") return statusLabel("withdrawal", "failed", locale);
  if (normalized === "cancelled") return statusLabel("withdrawal", "cancelled", locale);
  return status.replace(/_/g, " ");
}
