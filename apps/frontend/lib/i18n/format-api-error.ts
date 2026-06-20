import type { AppLocale } from "./types";
import { DEFAULT_LOCALE } from "./types";
import { messageForApiError } from "./dictionaries";
import { readStoredLocale } from "./locale-storage";

/** Maps legacy/alternate backend codes to canonical dictionary keys. */
const CODE_ALIASES: Record<string, string> = {
  INSUFFICIENT_AVAILABLE: "WALLET_INSUFFICIENT_BALANCE",
  INSUFFICIENT_BALANCE: "WALLET_INSUFFICIENT_BALANCE",
  ROUND_NOT_ACTIVE: "ROUND_NOT_ACTIVE",
  RELEASE_NOT_ACTIVE: "RELEASE_UNAVAILABLE",
  RELEASE_UNAVAILABLE: "RELEASE_UNAVAILABLE",
  INSUFFICIENT_UNITS: "INSUFFICIENT_UNITS",
  DEPOSIT_ADDRESS_UNAVAILABLE: "DEPOSIT_PROVIDER_UNAVAILABLE",
  DEPOSIT_MISCONFIGURED: "DEPOSIT_DISABLED",
  CONSENT_REQUIRED: "COMPLIANCE_RESTRICTED",
  LEGAL_CONSENT_REQUIRED: "COMPLIANCE_RESTRICTED",
  KYC_REQUIRED: "WITHDRAWAL_KYC_REQUIRED",
  AML_BLOCKED: "COMPLIANCE_RESTRICTED",
  AML_RESTRICTED: "COMPLIANCE_RESTRICTED",
  COUNTRY_RESTRICTED: "COMPLIANCE_RESTRICTED",
  FEATURE_DISABLED: "FEATURE_DISABLED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHORIZED: "AUTH_REQUIRED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  SELF_TRADE_BLOCKED: "OWN_LISTING_FORBIDDEN",
  MARKET_ORDER_DISABLED: "MARKET_DISABLED",
  SECONDARY_TRADE_FAILED: "SECONDARY_TRADE_CONFLICT",
  PRIMARY_ORDER_PREVIEW_FAILED: "VALIDATION_ERROR",
  DOCUMENT_ACCESS_DENIED: "DOCUMENT_FORBIDDEN",
  DOCUMENT_NOT_FOUND: "NOT_FOUND",
  RECEIPT_NOT_READY: "DOCUMENT_NOT_READY",
  DOWNLOAD_EXPIRED: "DOCUMENT_EXPIRED",
  ROLE_FORBIDDEN: "ADMIN_FORBIDDEN",
  INVALID_STATUS_TRANSITION: "VALIDATION_ERROR",
  TREASURY_APPROVAL_REQUIRED: "FORBIDDEN",
  AUDIT_REQUIRED: "FORBIDDEN",
  PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE",
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  SOLD_OUT: "SOLD_OUT",
  ROUND_CLOSED: "ROUND_CLOSED",
  LISTING_UNAVAILABLE: "LISTING_UNAVAILABLE",
  LISTING_ALREADY_SOLD: "LISTING_ALREADY_SOLD",
  LISTING_ALREADY_CANCELLED: "LISTING_ALREADY_CANCELLED",
  OWN_LISTING_FORBIDDEN: "OWN_LISTING_FORBIDDEN",
  ORDER_DUPLICATE: "ORDER_DUPLICATE",
  IDEMPOTENCY_CONFLICT: "IDEMPOTENCY_CONFLICT",
  SERVER_UNAVAILABLE: "SERVER_UNAVAILABLE",
  TIMEOUT: "TIMEOUT",
  BAD_REQUEST: "BAD_REQUEST",
  CONFLICT: "CONFLICT",
  NOT_FOUND: "NOT_FOUND",
};

export type ApiErrorShape = {
  code?: string;
  message?: string | string[] | Record<string, unknown>;
  status?: number;
  requestId?: string;
};

function normalizeCode(code?: string): string | undefined {
  if (!code) return undefined;
  return CODE_ALIASES[code] ?? code;
}

function extractMessageString(message: ApiErrorShape["message"]): string | undefined {
  if (!message) return undefined;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) {
    const parts = message.filter((m) => typeof m === "string") as string[];
    return parts.length > 0 ? parts.join(". ") : undefined;
  }
  if (typeof message === "object") {
    const obj = message as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
  }
  return undefined;
}

function extractErrorShape(err: unknown): ApiErrorShape {
  if (err && typeof err === "object") {
    const e = err as {
      code?: string;
      message?: string | string[] | Record<string, unknown>;
      status?: number;
      statusCode?: number;
      requestId?: string;
      response?: { error?: { code?: string; message?: string | string[] } };
    };
    if (e.code || e.message || e.status != null || e.statusCode != null) {
      return {
        code: e.code,
        message: e.message,
        status: e.status ?? e.statusCode,
        requestId: e.requestId,
      };
    }
    if (e.response?.error) {
      return {
        code: e.response.error.code,
        message: e.response.error.message,
        status: e.status ?? e.statusCode,
      };
    }
  }
  if (err instanceof Error) {
    const withCode = err as Error & { code?: string; status?: number; requestId?: string };
    return {
      code: withCode.code,
      message: err.message,
      status: withCode.status,
      requestId: withCode.requestId,
    };
  }
  return {};
}

/**
 * Unified localized API error message for UI (no stack traces / Prisma / SQL).
 */
export function formatApiError(
  err: unknown,
  locale: AppLocale = typeof window !== "undefined" ? readStoredLocale() : DEFAULT_LOCALE,
): string {
  if (err instanceof TypeError && /fetch|network/i.test(String(err.message))) {
    return messageForApiError("NETWORK_ERROR", locale);
  }

  const shape = extractErrorShape(err);
  let code = normalizeCode(shape.code);
  const messageText = extractMessageString(shape.message);

  const msgLower = messageText?.toLowerCase() ?? "";
  if (!code && (msgLower.includes("invalid credentials") || msgLower.includes("invalid access token"))) {
    code = "INVALID_CREDENTIALS";
  }
  if (!code && msgLower.includes("email not verified")) {
    code = "EMAIL_NOT_VERIFIED";
  }

  if (shape.status === 401 && !code) {
    return messageForApiError("AUTH_REQUIRED", locale);
  }
  if (shape.status === 403 && !code) {
    return messageForApiError("FORBIDDEN", locale);
  }
  if (shape.status === 404 && !code) {
    return messageForApiError("NOT_FOUND", locale);
  }
  if (shape.status === 409 && !code) {
    return messageForApiError("CONFLICT", locale);
  }
  if (shape.status === 422 && !code) {
    return messageForApiError("VALIDATION_ERROR", locale);
  }
  if (shape.status === 429) {
    return messageForApiError("RATE_LIMITED", locale);
  }
  if (shape.status === 500 && !code) {
    return messageForApiError("SERVER_UNAVAILABLE", locale);
  }
  if (shape.status === 503 && !code) {
    return messageForApiError("SERVER_UNAVAILABLE", locale);
  }
  if (shape.status === 408 && !code) {
    return messageForApiError("TIMEOUT", locale);
  }

  if (Array.isArray(shape.message) && shape.message.length > 0) {
    return messageForApiError("VALIDATION_ERROR", locale);
  }

  const fallback = code ? undefined : messageText;
  return messageForApiError(code, locale, fallback);
}

export function formatApiErrorWithMeta(
  err: unknown,
  locale?: AppLocale,
): { message: string; code?: string; requestId?: string } {
  const loc = locale ?? readStoredLocale();
  const shape = extractErrorShape(err);
  const code = normalizeCode(shape.code);
  return {
    message: formatApiError(err, loc),
    code,
    requestId: shape.requestId,
  };
}
