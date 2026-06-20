import { UserRoleCode } from '@prisma/client';
import { HttpStatus } from '@nestjs/common';
import { throwAdminError } from './admin-http.util';

const SUPER = new Set<string>([UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN]);

export function hasSuperAdminRole(roles: string[]): boolean {
  return roles.includes(UserRoleCode.SUPER_ADMIN);
}

export function hasStaffPanelRole(roles: string[]): boolean {
  const panel = new Set<string>([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.ADMIN,
    UserRoleCode.ACCOUNTANT,
    UserRoleCode.CONTENT_MANAGER,
    UserRoleCode.SUPPORT_MANAGER,
    UserRoleCode.COMPLIANCE,
    UserRoleCode.SUPPORT,
    UserRoleCode.BUSINESS_ANALYST,
    UserRoleCode.NEWS_MANAGER,
  ]);
  return roles.some((r) => panel.has(r));
}

/** Role assign/remove — strictly SUPER_ADMIN (not legacy ADMIN). */
export function assertSuperAdminRoleMutation(roles: string[]): void {
  if (!hasSuperAdminRole(roles)) {
    throwAdminError(
      'ADMIN_FORBIDDEN',
      'Only SUPER_ADMIN can change user roles',
      HttpStatus.FORBIDDEN,
    );
  }
}

/** User status / block — strictly SUPER_ADMIN. */
export function assertSuperAdminUserMutate(roles: string[]): void {
  assertSuperAdminRoleMutation(roles);
}

/** Platform fee PATCH — SUPER_ADMIN only. */
export function assertSuperAdminPlatformFees(roles: string[]): void {
  if (!hasSuperAdminRole(roles)) {
    throwAdminError(
      'ADMIN_FORBIDDEN',
      'Only SUPER_ADMIN can change platform fees',
      HttpStatus.FORBIDDEN,
    );
  }
}

export const CONTENT_MANAGER_REPORT_TYPES = new Set<string>([
  'tracks_round_progress',
]);

export const BUSINESS_ANALYST_REPORT_TYPES = new Set<string>([
  'withdrawals',
  'deposits',
  'platform_revenue',
  'platform_revenue_transactions',
  'finance_cashflow',
  'finance_fees',
  'users_funnel',
  'users',
  'wallet_transactions',
  'tracks_round_progress',
  'market_volume',
  'trades',
  'revenue_distributions',
  'risk_flags',
  'support_tickets',
  'audit_logs',
  'analytics_summary',
]);

const REPORT_VIEW_ROLES = new Set<string>([
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.ACCOUNTANT,
  UserRoleCode.COMPLIANCE,
  UserRoleCode.BUSINESS_ANALYST,
  UserRoleCode.CONTENT_MANAGER,
  UserRoleCode.SUPPORT_MANAGER,
]);

export const SUPPORT_MANAGER_REPORT_TYPES = new Set<string>([
  'support_tickets',
]);

export function assertReportListAccess(roles: string[]): void {
  if (roles.some((r) => REPORT_VIEW_ROLES.has(r))) return;
  throwAdminError(
    'ADMIN_FORBIDDEN',
    'Insufficient permissions for reports',
    HttpStatus.FORBIDDEN,
  );
}

export function assertReportGenerate(
  roles: string[],
  reportType: string,
): void {
  if (roles.some((r) => SUPER.has(r))) return;

  if (
    roles.includes(UserRoleCode.ACCOUNTANT) ||
    roles.includes(UserRoleCode.COMPLIANCE)
  ) {
    return;
  }

  if (roles.includes(UserRoleCode.BUSINESS_ANALYST)) {
    if (BUSINESS_ANALYST_REPORT_TYPES.has(reportType)) return;
    throwAdminError(
      'ADMIN_FORBIDDEN',
      'Report type not allowed for this role',
      HttpStatus.FORBIDDEN,
    );
  }

  if (roles.includes(UserRoleCode.CONTENT_MANAGER)) {
    if (CONTENT_MANAGER_REPORT_TYPES.has(reportType)) return;
    throwAdminError(
      'ADMIN_FORBIDDEN',
      'Report type not allowed for this role',
      HttpStatus.FORBIDDEN,
    );
  }

  if (roles.includes(UserRoleCode.SUPPORT_MANAGER)) {
    if (SUPPORT_MANAGER_REPORT_TYPES.has(reportType)) return;
    throwAdminError(
      'ADMIN_FORBIDDEN',
      'Report type not allowed for this role',
      HttpStatus.FORBIDDEN,
    );
  }

  throwAdminError(
    'ADMIN_FORBIDDEN',
    'Insufficient permissions to generate reports',
    HttpStatus.FORBIDDEN,
  );
}

export function canGenerateReportType(
  roles: string[],
  reportType: string,
): boolean {
  try {
    assertReportGenerate(roles, reportType);
    return true;
  } catch {
    return false;
  }
}

/** Report types visible in list/getById/retry; null = unrestricted (SUPER/ACCOUNTANT/COMPLIANCE). */
export function allowedReportTypesForRoles(roles: string[]): string[] | null {
  if (roles.some((r) => SUPER.has(r))) return null;
  if (
    roles.includes(UserRoleCode.ACCOUNTANT) ||
    roles.includes(UserRoleCode.COMPLIANCE)
  ) {
    return null;
  }

  const allowed = new Set<string>();
  if (roles.includes(UserRoleCode.BUSINESS_ANALYST)) {
    for (const t of BUSINESS_ANALYST_REPORT_TYPES) allowed.add(t);
  }
  if (roles.includes(UserRoleCode.CONTENT_MANAGER)) {
    for (const t of CONTENT_MANAGER_REPORT_TYPES) allowed.add(t);
  }
  if (roles.includes(UserRoleCode.SUPPORT_MANAGER)) {
    for (const t of SUPPORT_MANAGER_REPORT_TYPES) allowed.add(t);
  }
  return [...allowed];
}

export function assertReportViewAccess(
  roles: string[],
  reportType: string,
): void {
  assertReportListAccess(roles);
  assertReportGenerate(roles, reportType);
}
