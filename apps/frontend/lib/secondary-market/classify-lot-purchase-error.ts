export type LotPurchaseFailedKind =
  | "insufficient_funds"
  | "listing_unavailable"
  | "price_changed"
  | "network"
  | "generic";

const INSUFFICIENT_CODES = new Set([
  "WALLET_INSUFFICIENT_BALANCE",
  "INSUFFICIENT_BALANCE",
  "INSUFFICIENT_AVAILABLE",
]);

const LISTING_UNAVAILABLE_CODES = new Set([
  "LISTING_UNAVAILABLE",
  "LISTING_ALREADY_SOLD",
  "LISTING_ALREADY_CANCELLED",
  "NOT_FOUND",
]);

const PRICE_CHANGED_CODES = new Set([
  "CONFLICT",
  "SECONDARY_TRADE_CONFLICT",
  "IDEMPOTENCY_CONFLICT",
]);

const NETWORK_CODES = new Set([
  "NETWORK_ERROR",
  "SERVER_UNAVAILABLE",
  "TIMEOUT",
  "PROVIDER_UNAVAILABLE",
]);

export function classifyLotPurchaseError(code?: string | null): LotPurchaseFailedKind {
  if (!code) return "generic";
  if (INSUFFICIENT_CODES.has(code)) return "insufficient_funds";
  if (LISTING_UNAVAILABLE_CODES.has(code)) return "listing_unavailable";
  if (PRICE_CHANGED_CODES.has(code)) return "price_changed";
  if (NETWORK_CODES.has(code)) return "network";
  return "generic";
}
