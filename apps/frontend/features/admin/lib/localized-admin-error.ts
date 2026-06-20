import { localizedApiError } from "@/lib/api/localized-error";
import type { AppLocale } from "@/lib/i18n/types";

/** User-safe localized admin API error (no Prisma/SQL/internal). */
export function localizedAdminError(err: unknown, locale?: AppLocale): string {
  return localizedApiError(err, locale);
}
