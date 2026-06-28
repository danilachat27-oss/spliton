import { localeMessage } from "@/lib/i18n/normalize-locale";
import { PROFILE_MESSAGES } from "@/lib/i18n/profile-messages";
import type { AppLocale } from "@/lib/i18n/types";
import { securityEventLabel } from "@/lib/profile/overview-labels";

function t(locale: AppLocale, key: string): string {
  return localeMessage(PROFILE_MESSAGES, locale, key, key);
}

export function securityLevelBadgeLabel(level: string, locale: AppLocale): string {
  const key = `profile.security.level.${level.toLowerCase()}`;
  return t(locale, key);
}

export function securityLevelDescription(level: string, locale: AppLocale): string {
  const key = `profile.security.level.${level.toLowerCase()}.description`;
  return t(locale, key);
}

export function securityRecommendationText(
  code: string,
  locale: AppLocale,
): { title: string; description: string } {
  const base = `profile.security.recommendation.${code}`;
  return {
    title: t(locale, `${base}.title`),
    description: t(locale, `${base}.description`),
  };
}

export { securityEventLabel };

export function parseUserAgentShort(userAgent: string | null | undefined, locale: AppLocale): string {
  if (!userAgent?.trim()) return t(locale, "profile.security.events.deviceUnknown");
  const ua = userAgent;
  let browser = t(locale, "profile.security.session.browser");
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  let os = "";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  return os ? `${browser} · ${os}` : browser;
}
