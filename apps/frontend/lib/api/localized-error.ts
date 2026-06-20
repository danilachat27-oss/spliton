import { formatApiError } from "@/lib/i18n/format-api-error";
import { readStoredLocale } from "@/lib/i18n/locale-storage";
import type { AppLocale } from "@/lib/i18n/types";
import { DEFAULT_LOCALE } from "@/lib/i18n/types";

/** User-safe localized API error message (no stack / Prisma / SQL). */
export function localizedApiError(err: unknown, locale?: AppLocale): string {
  const resolved =
    locale ??
    (typeof window !== "undefined" ? readStoredLocale() : DEFAULT_LOCALE);
  return formatApiError(err, resolved);
}
