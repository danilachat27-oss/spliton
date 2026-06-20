"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { CLIENT_DICTIONARIES } from "@/lib/i18n/client-dictionaries";
import { persistLocale, readStoredLocale, resolveInitialLocale } from "@/lib/i18n/locale-storage";
import { normalizeLocale } from "@/lib/i18n/normalize-locale";
import { DEFAULT_LOCALE, type AppLocale } from "@/lib/i18n/types";

type I18nContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: string, fallback?: string) => string;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  children: React.ReactNode;
  initialLocale?: AppLocale;
  userLocale?: string | null;
  onLocaleChange?: (locale: AppLocale) => void | Promise<void>;
};

export function I18nProvider({
  children,
  initialLocale,
  userLocale,
  onLocaleChange,
}: I18nProviderProps) {
  const pathname = usePathname();
  const [locale, setLocaleState] = React.useState<AppLocale>(
    initialLocale ? normalizeLocale(initialLocale) : DEFAULT_LOCALE,
  );
  const [adminMessages, setAdminMessages] = React.useState<
    Partial<Record<AppLocale, Record<string, string>>>
  >({});

  React.useEffect(() => {
    if (!pathname?.startsWith("/admin")) return;
    let cancelled = false;
    void import("@/lib/i18n/admin-messages").then((mod) => {
      if (cancelled) return;
      setAdminMessages({
        ru: mod.ADMIN_MESSAGES.ru,
        en: mod.ADMIN_MESSAGES.en,
        es: mod.ADMIN_MESSAGES.es,
        pt: mod.ADMIN_MESSAGES.pt,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  React.useEffect(() => {
    const resolved = resolveInitialLocale({
      userLocale,
      cookieLocale: initialLocale,
      navigatorLanguage: navigator.language,
    });
    setLocaleState(resolved);
    document.documentElement.lang = resolved;
  }, [initialLocale, userLocale]);

  const setLocale = React.useCallback(
    (next: AppLocale) => {
      const normalized = normalizeLocale(next);
      setLocaleState(normalized);
      persistLocale(normalized);
      document.documentElement.lang = normalized;
      void onLocaleChange?.(normalized);
    },
    [onLocaleChange],
  );

  React.useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = React.useCallback(
    (key: string, fallback?: string) => {
      const value =
        adminMessages[locale]?.[key] ??
        CLIENT_DICTIONARIES[locale][key] ??
        adminMessages[DEFAULT_LOCALE]?.[key] ??
        CLIENT_DICTIONARIES[DEFAULT_LOCALE][key] ??
        (fallback !== undefined ? fallback : undefined);
      if (value) return value;
      if (process.env.NODE_ENV === "development") {
        console.warn(`[i18n] missing key: ${key} (${locale})`);
      }
      return CLIENT_DICTIONARIES[DEFAULT_LOCALE].UNKNOWN_ERROR ?? "—";
    },
    [adminMessages, locale],
  );

  const value = React.useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

export function useOptionalI18n(): I18nContextValue | null {
  return React.useContext(I18nContext);
}

export function useLocaleBootstrap(): AppLocale {
  return React.useMemo(() => readStoredLocale(), []);
}
