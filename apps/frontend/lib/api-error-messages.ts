import { messageForApiError as localizedMessageForApiError } from "@/lib/i18n/dictionaries";
import type { AppLocale } from "@/lib/i18n/types";

/** @deprecated Use messageForApiError(code, locale, fallback) from lib/i18n/dictionaries */
export const API_ERROR_MESSAGES_RU: Record<string, string> = {};

export function messageForApiError(
  code: string | undefined,
  fallback: string,
  locale: AppLocale = "ru",
): string {
  return localizedMessageForApiError(code, locale, fallback);
}
