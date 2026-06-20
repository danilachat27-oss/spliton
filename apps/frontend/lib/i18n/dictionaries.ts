import { mergeAppLocale } from "./locale-dictionary-merge";
import type { AppLocale } from "./types";
import { ADMIN_MESSAGES } from "./admin-messages";

export { CLIENT_DICTIONARIES } from "./client-dictionaries";

export const DICTIONARIES: Record<AppLocale, Record<string, string>> = {
  ru: mergeAppLocale("ru", ADMIN_MESSAGES.ru),
  en: mergeAppLocale("en", ADMIN_MESSAGES.en),
  es: mergeAppLocale("es", ADMIN_MESSAGES.es),
  pt: mergeAppLocale("pt", ADMIN_MESSAGES.pt),
};

export function looksTechnical(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("prisma") ||
    lower.includes("sql") ||
    lower.includes("stack") ||
    lower.includes("internal server error") ||
    lower.includes("undefined") ||
    lower.includes("[object object]") ||
    lower.includes("econnrefused") ||
    lower.includes("exception")
  );
}

export function messageForApiError(
  code: string | undefined,
  locale: AppLocale,
  fallback?: string,
): string {
  const dict = DICTIONARIES[locale];
  const ru = DICTIONARIES.ru;
  if (code && dict[code]) return dict[code];
  if (code && locale !== "ru" && ru[code]) return ru[code];
  if (code) return dict.UNKNOWN_ERROR ?? ru.UNKNOWN_ERROR;
  if (fallback && fallback.trim() && !looksTechnical(fallback)) return fallback;
  return dict.UNKNOWN_ERROR ?? ru.UNKNOWN_ERROR;
}
