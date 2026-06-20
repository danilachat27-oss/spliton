import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale } from "./types";

const LEGACY_LOCALE_ALIASES: Record<string, AppLocale> = {
  ka: "ru",
  ge: "ru",
};

/** Maps cookie/profile/navigator values to a supported production locale. */
export function normalizeLocale(value: string | null | undefined): AppLocale {
  if (!value) return DEFAULT_LOCALE;
  const lower = value.trim().toLowerCase();
  if ((SUPPORTED_LOCALES as readonly string[]).includes(lower)) {
    return lower as AppLocale;
  }
  const base = lower.split("-")[0];
  if ((SUPPORTED_LOCALES as readonly string[]).includes(base)) {
    return base as AppLocale;
  }
  if (LEGACY_LOCALE_ALIASES[lower] || LEGACY_LOCALE_ALIASES[base]) {
    return LEGACY_LOCALE_ALIASES[lower] ?? LEGACY_LOCALE_ALIASES[base]!;
  }
  if (base === "pt") return "pt";
  if (base === "es") return "es";
  if (base === "en") return "en";
  return DEFAULT_LOCALE;
}

export function isSupportedLocale(value: string | null | undefined): value is AppLocale {
  if (!value) return false;
  return (SUPPORTED_LOCALES as readonly string[]).includes(value.trim().toLowerCase());
}
