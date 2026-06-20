import { formatApiErrorWithMeta } from "@/lib/i18n/format-api-error";

export type ApiErrorCategory =
  | "backend_unavailable"
  | "auth_error"
  | "validation_error"
  | "forbidden"
  | "not_found"
  | "unknown";

const BACKEND_UNAVAILABLE_CODES = new Set([
  "NETWORK_ERROR",
  "SERVER_UNAVAILABLE",
  "TIMEOUT",
  "PROVIDER_UNAVAILABLE",
  "DEPOSIT_PROVIDER_UNAVAILABLE",
]);

const AUTH_ERROR_CODES = new Set([
  "AUTH_REQUIRED",
  "SESSION_EXPIRED",
  "INVALID_CREDENTIALS",
  "EMAIL_NOT_VERIFIED",
  "AUTH_INVALID",
  "AUTH_2FA_REQUIRED",
]);

const VALIDATION_ERROR_CODES = new Set(["VALIDATION_ERROR", "BAD_REQUEST"]);

const FORBIDDEN_CODES = new Set([
  "FORBIDDEN",
  "INSUFFICIENT_PERMISSIONS",
  "AUTH_FORBIDDEN",
  "ADMIN_FORBIDDEN",
  "DOCUMENT_FORBIDDEN",
  "COMPLIANCE_RESTRICTED",
]);

const NOT_FOUND_CODES = new Set(["NOT_FOUND", "DOCUMENT_NOT_FOUND", "LISTING_NOT_FOUND", "RELEASE_NOT_FOUND"]);

const BACKEND_UNAVAILABLE_MESSAGE_PATTERNS = [
  /временно недоступн/i,
  /temporarily unavailable/i,
  /no se puede conectar/i,
  /não foi possível ligar/i,
  /нет связи с сервером/i,
  /cannot reach the server/i,
  /сервер временно/i,
  /server is temporarily/i,
  /network/i,
  /timeout/i,
  /fetch failed/i,
  /no pudimos cargar/i,
  /failed to load/i,
];

function extractErrorShape(err: unknown): { status?: number; code?: string } {
  if (err && typeof err === "object") {
    const e = err as { status?: number; statusCode?: number; code?: string };
    return { status: e.status ?? e.statusCode, code: e.code };
  }
  return {};
}

function categoryFromCode(code?: string, status?: number): ApiErrorCategory | null {
  if (code) {
    if (BACKEND_UNAVAILABLE_CODES.has(code)) return "backend_unavailable";
    if (AUTH_ERROR_CODES.has(code)) return "auth_error";
    if (VALIDATION_ERROR_CODES.has(code)) return "validation_error";
    if (FORBIDDEN_CODES.has(code)) return "forbidden";
    if (NOT_FOUND_CODES.has(code)) return "not_found";
  }

  if (status === 401) return "auth_error";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 422) return "validation_error";
  if (status === 500 || status === 503 || status === 408) return "backend_unavailable";

  return null;
}

function categoryFromMessage(message: string): ApiErrorCategory | null {
  if (BACKEND_UNAVAILABLE_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))) {
    return "backend_unavailable";
  }
  return null;
}

/** Classifies API/fetch errors for UI routing (global notice vs section state vs action alert). */
export function classifyApiError(err: unknown): ApiErrorCategory {
  if (err == null || err === "") return "unknown";

  if (err instanceof TypeError && /fetch|network/i.test(String(err.message))) {
    return "backend_unavailable";
  }

  const { code, status } = extractErrorShape(err);
  const fromCode = categoryFromCode(code, status);
  if (fromCode) return fromCode;

  const meta = formatApiErrorWithMeta(err);
  const fromMeta = categoryFromCode(meta.code, status);
  if (fromMeta) return fromMeta;

  if (typeof err === "string") {
    const fromString = categoryFromMessage(err);
    if (fromString) return fromString;
    return "unknown";
  }

  if (err instanceof Error) {
    const fromErrorMessage = categoryFromMessage(err.message);
    if (fromErrorMessage) return fromErrorMessage;
  }

  if (meta.message) {
    const fromFormatted = categoryFromMessage(meta.message);
    if (fromFormatted) return fromFormatted;
  }

  return "unknown";
}

export function isBackendUnavailableError(err: unknown): boolean {
  return classifyApiError(err) === "backend_unavailable";
}

export function isReadOnlyFetchError(err: unknown): boolean {
  if (err == null || err === "") return false;
  const category = classifyApiError(err);
  return category === "backend_unavailable" || category === "unknown" || category === "not_found";
}
