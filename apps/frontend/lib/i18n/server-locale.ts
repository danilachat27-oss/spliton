import { cookies } from "next/headers";

import { localeFromCookieValue } from "@/lib/i18n/locale-storage";
import { normalizeLocale } from "@/lib/i18n/normalize-locale";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type AppLocale } from "@/lib/i18n/types";

/** Server-side locale from `spliton_locale` cookie (SSR metadata, `<html lang>`). */
export async function resolveServerLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (!rawLocale) return DEFAULT_LOCALE;
  return localeFromCookieValue(rawLocale) ?? normalizeLocale(rawLocale);
}
