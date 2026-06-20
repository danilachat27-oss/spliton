import { AppLocale } from '@prisma/client';

import {
  DEFAULT_APP_LOCALE,
  normalizeAppLocale,
  SUPPORTED_APP_LOCALES,
} from '../../common/i18n/app-locale';

export type HelpTranslationsMap = Partial<Record<string, string>>;

export function resolveHelpLocale(value: string | undefined): AppLocale {
  return normalizeAppLocale(value);
}

export function parseHelpTranslations(raw: unknown): HelpTranslationsMap {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const result: HelpTranslationsMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string') {
      result[key] = value;
    }
  }
  return result;
}

const LOCALE_FALLBACK_CHAIN: readonly AppLocale[] = [
  AppLocale.ru,
  AppLocale.en,
  AppLocale.es,
  AppLocale.pt,
];

export function resolveLocalizedHelpText(
  translations: unknown,
  locale: AppLocale,
): { text: string; resolvedLocale: AppLocale | null } {
  const map = parseHelpTranslations(translations);
  const chain = uniqueLocales([locale, ...LOCALE_FALLBACK_CHAIN]);

  for (const loc of chain) {
    const text = map[loc]?.trim();
    if (text) {
      return { text, resolvedLocale: loc };
    }
  }

  for (const value of Object.values(map)) {
    const text = value?.trim();
    if (text) {
      return { text, resolvedLocale: null };
    }
  }

  return { text: '', resolvedLocale: null };
}

function uniqueLocales(locales: AppLocale[]): AppLocale[] {
  const seen = new Set<string>();
  const result: AppLocale[] = [];
  for (const locale of locales) {
    const code = locale as string;
    if (seen.has(code)) continue;
    seen.add(code);
    if ((SUPPORTED_APP_LOCALES as readonly string[]).includes(code)) {
      result.push(locale);
    }
  }
  return result;
}

export { DEFAULT_APP_LOCALE as HELP_DEFAULT_LOCALE };
