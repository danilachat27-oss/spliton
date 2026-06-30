import type { StaffRoleCode } from "@/features/admin/types/admin-roles";
import { resolvePrimaryStaffRole, STAFF_ROLE_CODES } from "@/features/admin/types/admin-roles";

export const ALL_STAFF_PANEL_ROLES: StaffRoleCode[] = [...STAFF_ROLE_CODES];

export function hasSuperAdminRole(roles: string[] | undefined): boolean {
  return roles?.includes("SUPER_ADMIN") ?? false;
}

export function canAssignUserRoles(roles: string[] | undefined): boolean {
  return hasSuperAdminRole(roles);
}

export function canRemoveUserRoles(roles: string[] | undefined): boolean {
  return hasSuperAdminRole(roles);
}

export function canBlockUsers(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return roles.includes("SUPER_ADMIN") || roles.includes("COMPLIANCE");
}

export function canPatchPlatformFees(roles: string[] | undefined): boolean {
  return hasSuperAdminRole(roles);
}

export function canMutatePaymentRequisites(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return roles.includes("SUPER_ADMIN") || roles.includes("ACCOUNTANT");
}

/** Aligns with backend FINANCE roles on /referrals/partners approve|reject. */
export function canApprovePartnerApplication(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return roles.some((r) => r === "SUPER_ADMIN" || r === "ADMIN" || r === "ACCOUNTANT");
}

/** Aligns with backend COMPLIANCE + SUPER_ADMIN on partner suspend. */
export function canSuspendPartnerApplication(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return roles.some((r) => r === "SUPER_ADMIN" || r === "COMPLIANCE");
}

export function isBusinessAnalyst(roles: string[] | undefined): boolean {
  return roles?.includes("BUSINESS_ANALYST") ?? false;
}

/** BUSINESS_ANALYST: all analytics zones read-only (aligned with backend assertAnalyticsArea). */
export function canAccessAllAnalyticsZones(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  if (roles.some((r) => r === "SUPER_ADMIN" || r === "ADMIN")) return true;
  return isBusinessAnalyst(roles);
}

export const CONTENT_MANAGER_REPORT_TYPES = new Set([
  "tracks_round_progress",
]);

export function canGenerateReportType(
  roles: string[] | undefined,
  reportType: string,
): boolean {
  if (!roles?.length) return false;
  if (roles.some((r) => r === "SUPER_ADMIN" || r === "ADMIN")) return true;
  if (roles.includes("ACCOUNTANT") || roles.includes("COMPLIANCE")) return true;
  if (roles.includes("BUSINESS_ANALYST")) {
    return [
      "withdrawals",
      "deposits",
      "platform_revenue",
      "platform_revenue_transactions",
      "finance_cashflow",
      "finance_fees",
      "users_funnel",
      "users",
      "wallet_transactions",
      "tracks_round_progress",
      "market_volume",
      "trades",
      "revenue_distributions",
      "risk_flags",
      "support_tickets",
      "audit_logs",
      "analytics_summary",
    ].includes(reportType);
  }
  if (roles.includes("CONTENT_MANAGER")) {
    return CONTENT_MANAGER_REPORT_TYPES.has(reportType);
  }
  if (roles.includes("SUPPORT_MANAGER")) {
    return reportType === "support_tickets";
  }
  return false;
}

export function canAccessReportsSection(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  if (roles.some((r) => r === "SUPER_ADMIN" || r === "ADMIN")) return true;
  return (
    roles.includes("ACCOUNTANT") ||
    roles.includes("COMPLIANCE") ||
    roles.includes("BUSINESS_ANALYST") ||
    roles.includes("CONTENT_MANAGER") ||
    roles.includes("SUPPORT_MANAGER")
  );
}

export type DashboardPersona =
  | "super"
  | "accountant"
  | "compliance"
  | "support"
  | "analyst"
  | "content";

export function resolveDashboardPersona(roles: string[] | undefined): DashboardPersona {
  const primary = resolvePrimaryStaffRole(roles);
  if (!primary) return "super";
  if (primary === "SUPER_ADMIN" || primary === "ADMIN") return "super";
  if (primary === "ACCOUNTANT") return "accountant";
  if (primary === "COMPLIANCE") return "compliance";
  if (primary === "SUPPORT_MANAGER" || primary === "SUPPORT") return "support";
  if (primary === "BUSINESS_ANALYST") return "analyst";
  if (primary === "CONTENT_MANAGER") return "content";
  return "super";
}
