import type { AppLocale } from "@/lib/i18n/types";
import { PROFILE_MESSAGES } from "@/lib/i18n/profile-messages";

export function completenessItemLabel(itemId: string, locale: AppLocale): string {
  const key = `profile.overview.readiness.item.${itemId}`;
  const m = PROFILE_MESSAGES[locale];
  return m[key] ?? PROFILE_MESSAGES.ru[key] ?? itemId;
}

export function kycStatusLabel(status: string, locale: AppLocale): string {
  const normalized = status.toLowerCase().replace(/_/g, "");
  const map: Record<string, string> = {
    notstarted: "profile.overview.badge.kyc.notStarted",
    pending: "profile.overview.badge.kyc.pending",
    inreview: "profile.overview.badge.kyc.pending",
    manualreviewrequired: "profile.overview.badge.kyc.pending",
    approved: "profile.overview.badge.kyc.approved",
    rejected: "profile.overview.badge.kyc.rejected",
    expired: "profile.overview.badge.kyc.rejected",
  };
  const key = map[normalized] ?? "profile.overview.badge.kyc.unknown";
  const m = PROFILE_MESSAGES[locale];
  return m[key] ?? PROFILE_MESSAGES.ru[key] ?? status;
}

export function securityLevelLabel(level: string, locale: AppLocale): string {
  const key = `profile.overview.badge.security.${level.toLowerCase()}`;
  const m = PROFILE_MESSAGES[locale];
  return m[key] ?? PROFILE_MESSAGES.ru[key] ?? level;
}

export function securityEventLabel(action: string, locale: AppLocale): string {
  const key = `profile.overview.activity.event.${action}`;
  const m = PROFILE_MESSAGES[locale];
  return m[key] ?? PROFILE_MESSAGES.ru[key] ?? action;
}

export function accessLabel(allowed: boolean | undefined, locale: AppLocale): string {
  const key = allowed
    ? "profile.overview.access.allowed"
    : "profile.overview.access.restricted";
  const m = PROFILE_MESSAGES[locale];
  return m[key] ?? PROFILE_MESSAGES.ru[key] ?? (allowed ? "OK" : "—");
}
