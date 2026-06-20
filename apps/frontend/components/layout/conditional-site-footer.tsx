"use client";

import { usePathname } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { SiteFooter } from "@/components/layout/site-footer";

function hideFooterForPath(pathname: string | null) {
  if (!pathname) return false;
  if (pathname === ROUTES.login) return true;
  if (pathname === ROUTES.register) return true;
  if (pathname === ROUTES.verifyEmail) return true;
  if (pathname === ROUTES.adminLogin) return true;
  if (pathname === ROUTES.admin) return true;
  if (pathname.startsWith(`${ROUTES.admin}/`)) return true;
  if (pathname === ROUTES.dashboardCatalog) return true;
  if (pathname.startsWith(`${ROUTES.dashboardCatalog}/`)) return true;
  if (pathname === ROUTES.analyticsReleases) return true;
  if (pathname.startsWith(`${ROUTES.analyticsReleases}/`)) return true;
  if (pathname === ROUTES.guideSelection) return true;
  if (pathname.startsWith(`${ROUTES.guideSelection}/`)) return true;
  if (pathname.startsWith(`${ROUTES.dashboardSecondaryMarket}/book/`)) return true;
  return false;
}

export function ConditionalSiteFooter() {
  const pathname = usePathname();
  if (hideFooterForPath(pathname)) return null;
  return <SiteFooter />;
}
