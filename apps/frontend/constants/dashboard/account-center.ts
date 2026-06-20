import { ROUTES } from "@/constants/routes";

import {
  PROFILE_PAGE_TABS,
  profileDashboardHref,
  type ProfilePageTabId,
} from "./profile-page";

/** In-profile tabs (query `?tab=` on /dashboard/profile). */
export const ACCOUNT_CENTER_PROFILE_TABS = PROFILE_PAGE_TABS;

export type AccountCenterProfileTabId = ProfilePageTabId;

/** Satellite account pages linked from overview / nav (separate routes). */
export const ACCOUNT_CENTER_RELATED_ROUTES = {
  overview: profileDashboardHref("overview"),
  verification: profileDashboardHref("verification"),
  legal: profileDashboardHref("legal"),
  security: profileDashboardHref("security"),
  settings: profileDashboardHref("settings"),
  support: ROUTES.dashboardSupport,
  disputes: ROUTES.dashboardDisputes,
  notifications: ROUTES.dashboardNotifications,
  documents: ROUTES.dashboardDocuments,
  statements: ROUTES.dashboardStatements,
  activity: ROUTES.dashboardActivity,
  payouts: ROUTES.dashboardPayouts,
  payoutsHistory: ROUTES.dashboardPayoutsHistory,
  walletOverview: ROUTES.dashboardOverview,
} as const;

export type AccountCenterRelatedRouteKey = keyof typeof ACCOUNT_CENTER_RELATED_ROUTES;

/**
 * Full account center map for nav builders and implementation tracking.
 * Profile tabs use query routing; related sections are standalone pages.
 */
export const ACCOUNT_CENTER_SECTIONS = [
  { id: "overview" as const, kind: "profile-tab" as const, href: ACCOUNT_CENTER_RELATED_ROUTES.overview },
  { id: "verification" as const, kind: "profile-tab" as const, href: ACCOUNT_CENTER_RELATED_ROUTES.verification },
  { id: "legal" as const, kind: "profile-tab" as const, href: ACCOUNT_CENTER_RELATED_ROUTES.legal },
  { id: "security" as const, kind: "profile-tab" as const, href: ACCOUNT_CENTER_RELATED_ROUTES.security },
  { id: "settings" as const, kind: "profile-tab" as const, href: ACCOUNT_CENTER_RELATED_ROUTES.settings },
  { id: "support" as const, kind: "route" as const, href: ACCOUNT_CENTER_RELATED_ROUTES.support },
  { id: "disputes" as const, kind: "route" as const, href: ACCOUNT_CENTER_RELATED_ROUTES.disputes },
  { id: "activity" as const, kind: "route" as const, href: ACCOUNT_CENTER_RELATED_ROUTES.activity },
  { id: "notifications" as const, kind: "route" as const, href: ACCOUNT_CENTER_RELATED_ROUTES.notifications },
  { id: "documents" as const, kind: "route" as const, href: ACCOUNT_CENTER_RELATED_ROUTES.documents },
  { id: "statements" as const, kind: "route" as const, href: ACCOUNT_CENTER_RELATED_ROUTES.statements },
] as const;

export type AccountCenterSectionId = (typeof ACCOUNT_CENTER_SECTIONS)[number]["id"];

export { profileDashboardHref };
