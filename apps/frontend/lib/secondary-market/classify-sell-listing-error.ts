export type SellListingFailedKind = "insufficient_units" | "invalid_price" | "network" | "generic";

const INSUFFICIENT_UNITS_CODES = new Set([
  "INSUFFICIENT_UNITS",
  "INSUFFICIENT_AVAILABLE",
  "INSUFFICIENT_BALANCE",
  "WALLET_INSUFFICIENT_BALANCE",
]);

const INVALID_PRICE_CODES = new Set([
  "INVALID_PRICE",
  "VALIDATION_ERROR",
  "BAD_REQUEST",
  "PRICE_OUT_OF_RANGE",
]);

const NETWORK_CODES = new Set([
  "NETWORK_ERROR",
  "SERVER_UNAVAILABLE",
  "TIMEOUT",
  "PROVIDER_UNAVAILABLE",
  "SYSTEM_MAINTENANCE",
]);

export function classifySellListingError(code?: string | null): SellListingFailedKind {
  if (!code) return "generic";
  if (INSUFFICIENT_UNITS_CODES.has(code)) return "insufficient_units";
  if (INVALID_PRICE_CODES.has(code)) return "invalid_price";
  if (NETWORK_CODES.has(code)) return "network";
  return "generic";
}

export function extractApiErrorCode(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
  const rec = err as Record<string, unknown>;
  if (typeof rec.code === "string") return rec.code;
  if (typeof rec.errorCode === "string") return rec.errorCode;
  return null;
}
