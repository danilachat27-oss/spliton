import { AppLocale } from '@prisma/client';

/** Production locales accepted by API and persisted in the database. */
export const SUPPORTED_APP_LOCALES: readonly AppLocale[] = [
  AppLocale.ru,
  AppLocale.en,
  AppLocale.es,
  AppLocale.pt,
] as const;

export const SUPPORTED_APP_LOCALE_CODES = SUPPORTED_APP_LOCALES.map(
  (locale) => locale as string,
);

export const DEFAULT_APP_LOCALE = AppLocale.ru;

const LEGACY_LOCALE_ALIASES: Record<string, AppLocale> = {
  ka: AppLocale.ru,
  ge: AppLocale.ru,
};

/**
 * Maps cookie/profile/query values to a supported production locale.
 * Legacy `ka` / `ge` resolve to `ru`.
 */
export function normalizeAppLocale(
  value: string | null | undefined,
): AppLocale {
  if (!value?.trim()) return DEFAULT_APP_LOCALE;

  const lower = value.trim().toLowerCase();
  if (LEGACY_LOCALE_ALIASES[lower]) {
    return LEGACY_LOCALE_ALIASES[lower]!;
  }

  const base = lower.split('-')[0];
  if (LEGACY_LOCALE_ALIASES[base]) {
    return LEGACY_LOCALE_ALIASES[base]!;
  }

  if ((SUPPORTED_APP_LOCALE_CODES as string[]).includes(lower)) {
    return lower as AppLocale;
  }
  if ((SUPPORTED_APP_LOCALE_CODES as string[]).includes(base)) {
    return base as AppLocale;
  }

  return DEFAULT_APP_LOCALE;
}

export function isSupportedAppLocale(
  value: string | null | undefined,
): value is AppLocale {
  if (!value?.trim()) return false;
  const normalized = normalizeAppLocale(value);
  const lower = value.trim().toLowerCase();
  const base = lower.split('-')[0];
  return lower === normalized || base === normalized;
}

/** Resolves deposit-info `lang` query (legacy `ka` → `ru`). */
export function normalizeDepositLang(
  lang: string | null | undefined,
): AppLocale {
  return normalizeAppLocale(lang);
}
