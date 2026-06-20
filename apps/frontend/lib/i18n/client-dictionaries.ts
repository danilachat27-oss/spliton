import { mergeAppLocale } from "./locale-dictionary-merge";
import type { AppLocale } from "./types";

/** Client-side i18n without admin portal messages (see locale-dictionary-merge.ts). */
export const CLIENT_DICTIONARIES: Record<AppLocale, Record<string, string>> = {
  ru: mergeAppLocale("ru"),
  en: mergeAppLocale("en"),
  es: mergeAppLocale("es"),
  pt: mergeAppLocale("pt"),
};
