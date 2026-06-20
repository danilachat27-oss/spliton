export const SUPPORTED_LOCALES = ["ru", "en", "es", "pt"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "ru";

export const LOCALE_COOKIE = "spliton_locale";

export type LocaleMeta = {
  code: AppLocale;
  label: string;
  shortCode: string;
};

export const LOCALE_OPTIONS: LocaleMeta[] = [
  { code: "ru", label: "Русский", shortCode: "RU" },
  { code: "en", label: "English", shortCode: "EN" },
  { code: "es", label: "Español", shortCode: "ES" },
  { code: "pt", label: "Português", shortCode: "PT" },
];

export interface Dictionary {
  [key: string]: string | Dictionary;
}

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "ru" || value === "en" || value === "es" || value === "pt";
}
