"use client";



import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { MobileTabBarShell } from "@/components/layout/mobile-tab-bar-shell";
import { AuthProvider, useAuth } from "@/components/providers/auth-provider";

import { I18nProvider } from "@/components/providers/i18n-provider";

import { BackendAvailabilityProvider } from "@/components/providers/backend-availability-provider";
import { LiveDataPolicyGuard } from "@/components/providers/live-data-policy-guard";
import { PublicEnvDevBanner } from "@/components/providers/public-env-dev-banner";

import { SystemAnnouncementBanners } from "@/components/system-announcements/system-announcement-banners";

import { normalizeLocale } from "@/lib/i18n/normalize-locale";
import type { AppLocale } from "@/lib/i18n/types";

import { getAppRuntimeMode } from "@/lib/public-env";

import { ROUTES } from "@/constants/routes";
import { updateUserLocale } from "@/services/system-announcements.service";

function hideGlobalChromeForPath(pathname: string | null): boolean {
  return pathname === ROUTES.adminLogin;
}

function LocaleBridge({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: AppLocale;
}) {

  const pathname = usePathname();
  const { accessToken, user } = useAuth();
  const hideGlobalChrome = hideGlobalChromeForPath(pathname);

  const rawUserLocale =
    (user as { preferredLocale?: string; profile?: { preferredLocale?: string } } | null)
      ?.preferredLocale ??
    (user as { profile?: { preferredLocale?: string } } | null)?.profile?.preferredLocale ??
    null;
  const userLocale = rawUserLocale ? normalizeLocale(rawUserLocale) : null;



  const onLocaleChange = async (locale: AppLocale) => {

    if (accessToken) {

      try {

        await updateUserLocale(accessToken, locale);

      } catch {

        /* guest/local persistence still works */

      }

    }

  };



  return (

    <I18nProvider
      initialLocale={initialLocale}
      userLocale={userLocale}
      onLocaleChange={onLocaleChange}
    >

      {hideGlobalChrome ? null : <SystemAnnouncementBanners surface="app" />}

      <MobileTabBarShell>{children}</MobileTabBarShell>

    </I18nProvider>

  );

}

function ConditionalPublicEnvDevBanner() {
  const pathname = usePathname();
  if (hideGlobalChromeForPath(pathname)) return null;
  return <PublicEnvDevBanner />;
}

export function AppProviders({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: AppLocale;
}) {

  const showEnvBanner = getAppRuntimeMode() === "development";

  return (
    <AuthProvider>
      <LocaleBridge initialLocale={initialLocale}>
        <BackendAvailabilityProvider>
          <LiveDataPolicyGuard />
          {showEnvBanner ? <ConditionalPublicEnvDevBanner /> : null}

          {children}
        </BackendAvailabilityProvider>
      </LocaleBridge>

    </AuthProvider>

  );

}

