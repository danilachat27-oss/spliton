import { normalizeLocale } from "./normalize-locale";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type AppLocale } from "./types";

export function readStoredLocale(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const fromStorage = window.localStorage.getItem(LOCALE_COOKIE);
    if (fromStorage) return normalizeLocale(fromStorage);
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") {
    const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
    if (match?.[1]) return normalizeLocale(match[1]);
  }
  return DEFAULT_LOCALE;
}

export function persistLocale(locale: AppLocale): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCALE_COOKIE, locale);
  } catch {
    /* ignore */
  }
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function localeFromCookieValue(value: string | undefined | null): AppLocale | null {
  if (!value) return null;
  const normalized = normalizeLocale(value);
  return normalized;
}

export function resolveInitialLocale(params?: {
  userLocale?: string | null;
  cookieLocale?: string | null;
  navigatorLanguage?: string | null;
}): AppLocale {
  if (params?.userLocale) {
    const fromUser = normalizeLocale(params.userLocale);
    if (fromUser) return fromUser;
  }
  if (params?.cookieLocale) {
    return normalizeLocale(params.cookieLocale);
  }
  const stored = readStoredLocale();
  if (stored !== DEFAULT_LOCALE || !params?.navigatorLanguage) return stored;
  return normalizeLocale(params.navigatorLanguage);
}
