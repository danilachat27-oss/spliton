import { ROUTES } from "@/constants/routes";
import { canAccessAllAnalyticsZones } from "@/features/admin/config/admin-rbac";
import type { StaffRoleCode } from "@/features/admin/types/admin-roles";

export type AnalyticsSectionId =
  | "analyticsOverview"
  | "analyticsFinance"
  | "analyticsUsers"
  | "analyticsTracks"
  | "analyticsMarket"
  | "analyticsRevenue"
  | "analyticsRisk"
  | "analyticsOperations";

export type AnalyticsNavItem = {
  id: AnalyticsSectionId;
  label: string;
  href: string;
  roles?: StaffRoleCode[];
};

export const ANALYTICS_NAV_ITEMS: AnalyticsNavItem[] = [
  {
    id: "analyticsOverview",
    label: "Общая аналитика",
    href: ROUTES.adminAnalytics,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "BUSINESS_ANALYST",
      "ACCOUNTANT",
      "CONTENT_MANAGER",
      "COMPLIANCE",
      "SUPPORT_MANAGER",
      "SUPPORT",
    ],
  },
  {
    id: "analyticsFinance",
    label: "Финансовая",
    href: ROUTES.adminAnalyticsFinance,
    roles: ["SUPER_ADMIN", "ADMIN", "BUSINESS_ANALYST", "ACCOUNTANT"],
  },
  {
    id: "analyticsUsers",
    label: "Пользователи",
    href: ROUTES.adminAnalyticsUsers,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "BUSINESS_ANALYST",
      "ACCOUNTANT",
      "CONTENT_MANAGER",
      "COMPLIANCE",
      "SUPPORT_MANAGER",
    ],
  },
  {
    id: "analyticsTracks",
    label: "Треки и раунды",
    href: ROUTES.adminAnalyticsTracks,
    roles: ["SUPER_ADMIN", "ADMIN", "BUSINESS_ANALYST", "CONTENT_MANAGER"],
  },
  {
    id: "analyticsMarket",
    label: "Вторичный рынок",
    href: ROUTES.adminAnalyticsMarket,
    roles: ["SUPER_ADMIN", "ADMIN", "BUSINESS_ANALYST", "ACCOUNTANT", "COMPLIANCE", "SUPPORT_MANAGER"],
  },
  {
    id: "analyticsRevenue",
    label: "Начисления",
    href: ROUTES.adminAnalyticsRevenue,
    roles: ["SUPER_ADMIN", "ADMIN", "BUSINESS_ANALYST", "ACCOUNTANT"],
  },
  {
    id: "analyticsRisk",
    label: "Риск-аналитика",
    href: ROUTES.adminAnalyticsRisk,
    roles: ["SUPER_ADMIN", "ADMIN", "BUSINESS_ANALYST", "COMPLIANCE", "ACCOUNTANT", "SUPPORT_MANAGER"],
  },
  {
    id: "analyticsOperations",
    label: "Операционная",
    href: ROUTES.adminAnalyticsOperations,
    roles: ["SUPER_ADMIN", "ADMIN", "BUSINESS_ANALYST", "SUPPORT_MANAGER", "SUPPORT", "COMPLIANCE"],
  },
];

export function getVisibleAnalyticsNav(userRoles: string[] | undefined): AnalyticsNavItem[] {
  if (!userRoles?.length) return [];
  if (canAccessAllAnalyticsZones(userRoles)) return ANALYTICS_NAV_ITEMS;
  return ANALYTICS_NAV_ITEMS.filter((item) =>
    item.roles?.some((r) => userRoles.includes(r)),
  );
}

export function canAccessAnalyticsSection(
  sectionId: AnalyticsSectionId,
  userRoles: string[] | undefined,
): boolean {
  const item = ANALYTICS_NAV_ITEMS.find((n) => n.id === sectionId);
  if (!item) return false;
  if (!userRoles?.length) return false;
  if (canAccessAllAnalyticsZones(userRoles)) return true;
  return item.roles?.some((r) => userRoles.includes(r)) ?? false;
}
