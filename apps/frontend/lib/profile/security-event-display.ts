import type { AppLocale } from "@/lib/i18n/types";
import { PROFILE_MESSAGES } from "@/lib/i18n/profile-messages";
import { intlLocaleFor } from "@/lib/i18n/formatters";

export type SecurityEventTone = "ok" | "warn" | "danger" | "neutral";

/** Auth audit log action codes (see backend AuthAuditEvent). */
export const AUTH_AUDIT_ACTIONS = new Set<string>([
  "REGISTER",
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "REFRESH_SUCCESS",
  "REFRESH_FAILED",
  "REFRESH_REUSE_DETECTED",
  "LOGOUT",
  "LOGOUT_ALL",
  "TWO_FACTOR_SETUP_STARTED",
  "TWO_FACTOR_ENABLED",
  "TWO_FACTOR_DISABLED",
  "TWO_FACTOR_CHALLENGE_CREATED",
  "TWO_FACTOR_CHALLENGE_SUCCESS",
  "TWO_FACTOR_CHALLENGE_FAILED",
  "TWO_FACTOR_BACKUP_CODE_USED",
  "TWO_FACTOR_RECOVERY_CODES_REGENERATED",
  "EMAIL_VERIFICATION_SENT",
  "EMAIL_VERIFICATION_RESENT",
  "EMAIL_VERIFIED",
  "EMAIL_VERIFICATION_FAILED",
  "EMAIL_VERIFICATION_REQUIRED",
  "PASSWORD_RESET_REQUESTED",
  "PASSWORD_RESET_FAILED",
  "PASSWORD_RESET_COMPLETED",
  "PASSWORD_CHANGED",
  "PASSWORD_CHANGE_FAILED",
]);

export function isAuthAuditAction(action: string): boolean {
  return AUTH_AUDIT_ACTIONS.has(action.trim().toUpperCase());
}

const TONE_BY_ACTION: Record<string, SecurityEventTone> = {
  LOGIN_SUCCESS: "ok",
  REGISTER: "ok",
  EMAIL_VERIFIED: "ok",
  PASSWORD_CHANGED: "ok",
  PASSWORD_RESET_COMPLETED: "ok",
  TWO_FACTOR_ENABLED: "ok",
  TWO_FACTOR_CHALLENGE_SUCCESS: "ok",
  REFRESH_SUCCESS: "neutral",
  LOGOUT: "neutral",
  LOGOUT_ALL: "neutral",
  TWO_FACTOR_SETUP_STARTED: "neutral",
  TWO_FACTOR_CHALLENGE_CREATED: "neutral",
  EMAIL_VERIFICATION_SENT: "neutral",
  EMAIL_VERIFICATION_RESENT: "neutral",
  PASSWORD_RESET_REQUESTED: "neutral",
  LOGIN_FAILED: "warn",
  REFRESH_FAILED: "warn",
  PASSWORD_CHANGE_FAILED: "warn",
  PASSWORD_RESET_FAILED: "warn",
  EMAIL_VERIFICATION_FAILED: "warn",
  TWO_FACTOR_CHALLENGE_FAILED: "warn",
  REFRESH_REUSE_DETECTED: "danger",
  TWO_FACTOR_DISABLED: "danger",
  TWO_FACTOR_BACKUP_CODE_USED: "warn",
};

const ACTION_LABEL_FALLBACK: Partial<Record<AppLocale, Record<string, string>>> = {
  ru: {
    REFRESH_SUCCESS: "Сессия продлена",
    REFRESH_REUSE_DETECTED: "Подозрительная активность с сессией",
  },
  en: {
    LOGIN_SUCCESS: "Successful sign-in",
  },
};

function dict(locale: AppLocale) {
  return PROFILE_MESSAGES[locale] ?? PROFILE_MESSAGES.ru;
}

function translate(locale: AppLocale, key: string): string | undefined {
  const m = dict(locale);
  return m[key] ?? PROFILE_MESSAGES.ru[key];
}

/** User-facing title for an auth / security audit action. */
export function securityEventLabel(action: string, locale: AppLocale): string {
  const normalized = action.trim().toUpperCase();

  const fromFallback = ACTION_LABEL_FALLBACK[locale]?.[normalized];
  if (fromFallback) return fromFallback;

  const fromSecurity = translate(locale, `profile.security.events.action.${normalized}`);
  if (fromSecurity) return fromSecurity;
  const fromOverview = translate(locale, `profile.overview.activity.event.${normalized}`);
  if (fromOverview) return fromOverview;
  return translate(locale, "profile.security.events.action.UNKNOWN") ?? normalized;
}

/** Optional one-line explanation shown under high-signal events. */
export function securityEventHint(action: string, locale: AppLocale): string | null {
  const normalized = action.trim().toUpperCase();
  return translate(locale, `profile.security.events.hint.${normalized}`) ?? null;
}

export function securityEventTone(action: string): SecurityEventTone {
  return TONE_BY_ACTION[action.trim().toUpperCase()] ?? "neutral";
}

export function formatSecurityEventIp(ip: string | null | undefined, locale: AppLocale): string | null {
  if (!ip?.trim()) return null;
  const value = ip.trim();
  if (value === "::1" || value === "127.0.0.1" || value.toLowerCase() === "localhost") {
    return translate(locale, "profile.security.events.ipLocal") ?? (locale === "ru" ? "Это устройство" : "This device");
  }
  if (value.startsWith("::ffff:")) return value.slice("::ffff:".length);
  return value;
}

export function formatSecurityEventWhen(
  iso: string,
  locale: AppLocale,
  timeZone?: string | null,
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(intlLocaleFor(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(timeZone?.trim() ? { timeZone: timeZone.trim() } : {}),
  }).format(date);
}
