import { UserRoleCode } from '@prisma/client';
import { HttpStatus } from '@nestjs/common';
import { throwAdminError } from './admin-http.util';

/** Source of truth for operator panel RBAC (keep in sync with frontend admin-role-matrix.ts). */
export type AdminMatrixSection =
  | 'dashboard'
  | 'operatorTasks'
  | 'users'
  | 'roles'
  | 'audit'
  | 'tracks'
  | 'rounds'
  | 'holdings'
  | 'news'
  | 'wallets'
  | 'deposits'
  | 'withdrawals'
  | 'revenue'
  | 'platformRevenue'
  | 'secondaryMarket'
  | 'support'
  | 'disputes'
  | 'compliance'
  | 'referrals'
  | 'legal'
  | 'treasury'
  | 'reports'
  | 'analytics'
  | 'settings'
  | 'systemStatus'
  | 'notifications'
  | 'updates'
  | 'helpCenter';

export type AdminMatrixLevel = 'full' | 'read' | 'limited' | 'none';

export type AdminMatrixAction =
  | 'view'
  | 'mutate'
  | 'approve'
  | 'export'
  | 'assign_roles'
  | 'patch_fees'
  | 'block_user';

export type StaffMatrixRole =
  | typeof UserRoleCode.SUPER_ADMIN
  | typeof UserRoleCode.ADMIN
  | typeof UserRoleCode.ACCOUNTANT
  | typeof UserRoleCode.CONTENT_MANAGER
  | typeof UserRoleCode.SUPPORT_MANAGER
  | typeof UserRoleCode.COMPLIANCE
  | typeof UserRoleCode.BUSINESS_ANALYST
  | typeof UserRoleCode.NEWS_MANAGER
  | typeof UserRoleCode.SUPPORT;

const STAFF_ROLES: StaffMatrixRole[] = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.ACCOUNTANT,
  UserRoleCode.CONTENT_MANAGER,
  UserRoleCode.SUPPORT_MANAGER,
  UserRoleCode.COMPLIANCE,
  UserRoleCode.BUSINESS_ANALYST,
  UserRoleCode.NEWS_MANAGER,
  UserRoleCode.SUPPORT,
];

const SUPER_ALIASES = new Set<string>([
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
]);

const LEVEL_ACTIONS: Record<
  AdminMatrixLevel,
  ReadonlySet<AdminMatrixAction>
> = {
  full: new Set([
    'view',
    'mutate',
    'approve',
    'export',
    'assign_roles',
    'patch_fees',
    'block_user',
  ]),
  read: new Set(['view', 'export']),
  limited: new Set(['view', 'mutate', 'approve']),
  none: new Set(),
};

function noneRow(): Record<StaffMatrixRole, AdminMatrixLevel> {
  return Object.fromEntries(STAFF_ROLES.map((r) => [r, 'none'])) as Record<
    StaffMatrixRole,
    AdminMatrixLevel
  >;
}

function row(
  overrides: Partial<Record<StaffMatrixRole, AdminMatrixLevel>>,
): Record<StaffMatrixRole, AdminMatrixLevel> {
  return { ...noneRow(), ...overrides };
}

/** Section × role permission levels. */
export const ADMIN_ROLE_MATRIX: Record<
  AdminMatrixSection,
  Record<StaffMatrixRole, AdminMatrixLevel>
> = {
  dashboard: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    ACCOUNTANT: 'read',
    CONTENT_MANAGER: 'read',
    SUPPORT_MANAGER: 'read',
    COMPLIANCE: 'read',
    BUSINESS_ANALYST: 'read',
    NEWS_MANAGER: 'read',
    SUPPORT: 'read',
  }),
  operatorTasks: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    ACCOUNTANT: 'read',
    SUPPORT_MANAGER: 'read',
    COMPLIANCE: 'read',
    SUPPORT: 'read',
  }),
  users: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    ACCOUNTANT: 'read',
    SUPPORT_MANAGER: 'read',
    COMPLIANCE: 'read',
    SUPPORT: 'read',
  }),
  roles: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'read',
  }),
  audit: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    ACCOUNTANT: 'read',
    COMPLIANCE: 'read',
    SUPPORT_MANAGER: 'limited',
  }),
  tracks: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    CONTENT_MANAGER: 'full',
    ACCOUNTANT: 'read',
    COMPLIANCE: 'read',
    BUSINESS_ANALYST: 'read',
  }),
  rounds: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    CONTENT_MANAGER: 'full',
    BUSINESS_ANALYST: 'read',
  }),
  holdings: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    ACCOUNTANT: 'read',
    CONTENT_MANAGER: 'read',
    SUPPORT_MANAGER: 'read',
    COMPLIANCE: 'limited',
    BUSINESS_ANALYST: 'read',
  }),
  news: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    NEWS_MANAGER: 'full',
    CONTENT_MANAGER: 'read',
  }),
  wallets: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    ACCOUNTANT: 'full',
    SUPPORT_MANAGER: 'read',
    COMPLIANCE: 'limited',
  }),
  deposits: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    ACCOUNTANT: 'full',
    SUPPORT_MANAGER: 'read',
    COMPLIANCE: 'limited',
  }),
  withdrawals: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    ACCOUNTANT: 'full',
    COMPLIANCE: 'limited',
    SUPPORT_MANAGER: 'read',
  }),
  revenue: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    ACCOUNTANT: 'full',
    BUSINESS_ANALYST: 'read',
  }),
  platformRevenue: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    ACCOUNTANT: 'read',
    BUSINESS_ANALYST: 'read',
  }),
  secondaryMarket: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    COMPLIANCE: 'full',
    ACCOUNTANT: 'read',
    SUPPORT_MANAGER: 'read',
    BUSINESS_ANALYST: 'read',
  }),
  support: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    SUPPORT_MANAGER: 'full',
    SUPPORT: 'full',
    BUSINESS_ANALYST: 'read',
  }),
  disputes: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    SUPPORT_MANAGER: 'full',
    SUPPORT: 'read',
    COMPLIANCE: 'read',
    BUSINESS_ANALYST: 'read',
  }),
  compliance: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'read',
    COMPLIANCE: 'full',
    BUSINESS_ANALYST: 'read',
  }),
  referrals: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    ACCOUNTANT: 'full',
    COMPLIANCE: 'full',
    BUSINESS_ANALYST: 'read',
    SUPPORT_MANAGER: 'read',
  }),
  legal: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'read',
    COMPLIANCE: 'full',
    CONTENT_MANAGER: 'read',
    BUSINESS_ANALYST: 'read',
  }),
  treasury: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    ACCOUNTANT: 'full',
    COMPLIANCE: 'read',
    BUSINESS_ANALYST: 'read',
  }),
  reports: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    ACCOUNTANT: 'full',
    COMPLIANCE: 'read',
    BUSINESS_ANALYST: 'read',
    CONTENT_MANAGER: 'read',
    SUPPORT_MANAGER: 'read',
  }),
  analytics: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    BUSINESS_ANALYST: 'read',
    ACCOUNTANT: 'read',
    CONTENT_MANAGER: 'read',
    COMPLIANCE: 'read',
    SUPPORT_MANAGER: 'read',
    SUPPORT: 'read',
  }),
  settings: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'read',
  }),
  systemStatus: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    NEWS_MANAGER: 'full',
    CONTENT_MANAGER: 'limited',
    COMPLIANCE: 'limited',
    ACCOUNTANT: 'limited',
    SUPPORT_MANAGER: 'read',
    BUSINESS_ANALYST: 'read',
  }),
  notifications: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    ACCOUNTANT: 'read',
    CONTENT_MANAGER: 'read',
    SUPPORT_MANAGER: 'read',
    COMPLIANCE: 'read',
    BUSINESS_ANALYST: 'read',
    NEWS_MANAGER: 'read',
    SUPPORT: 'read',
  }),
  updates: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    COMPLIANCE: 'limited',
    BUSINESS_ANALYST: 'read',
    CONTENT_MANAGER: 'read',
    SUPPORT_MANAGER: 'read',
    ACCOUNTANT: 'read',
    NEWS_MANAGER: 'read',
    SUPPORT: 'read',
  }),
  helpCenter: row({
    SUPER_ADMIN: 'full',
    ADMIN: 'full',
    CONTENT_MANAGER: 'full',
    SUPPORT_MANAGER: 'limited',
    SUPPORT: 'read',
    BUSINESS_ANALYST: 'read',
  }),
};

/** Maps legacy assertAdminArea keys to matrix sections. */
export const ADMIN_AREA_TO_SECTION: Record<string, AdminMatrixSection> = {
  users: 'users',
  deposits: 'deposits',
  withdrawals: 'withdrawals',
  wallets: 'wallets',
  holdings: 'holdings',
  audit: 'audit',
  revenue: 'revenue',
  secondary_market: 'secondaryMarket',
  reports: 'reports',
  settings: 'settings',
  referrals: 'referrals',
  legal: 'legal',
  treasury: 'treasury',
  notifications: 'notifications',
  updates: 'updates',
  help_center: 'helpCenter',
};

export const SUPER_ADMIN_ONLY_CAPABILITIES = [
  'assign_roles',
  'remove_roles',
  'patch_platform_fees',
  'patch_financial_rules',
  'user_status_change',
] as const;

export const DANGEROUS_AUDIT_ACTIONS = [
  'deposit.settle',
  'withdrawal.approve',
  'withdrawal.reject',
  'withdrawal.complete',
  'distribution.run',
  'user.role_assign',
  'user.role_remove',
  'user.status_change',
  'compliance.user.block',
  'platform_fees.update',
  'settings.fee.update',
  'track.publish',
] as const;

function staffRoles(roles: string[]): StaffMatrixRole[] {
  return roles.filter((r): r is StaffMatrixRole =>
    STAFF_ROLES.includes(r as StaffMatrixRole),
  );
}

export function matrixLevelForRole(
  section: AdminMatrixSection,
  role: string,
): AdminMatrixLevel {
  if (role === UserRoleCode.ADMIN) {
    return ADMIN_ROLE_MATRIX[section][UserRoleCode.ADMIN];
  }
  if (STAFF_ROLES.includes(role as StaffMatrixRole)) {
    return ADMIN_ROLE_MATRIX[section][role as StaffMatrixRole];
  }
  return 'none';
}

export function effectiveMatrixLevel(
  roles: string[],
  section: AdminMatrixSection,
): AdminMatrixLevel {
  const staff = staffRoles(roles);
  if (!staff.length) return 'none';

  const order: AdminMatrixLevel[] = ['full', 'limited', 'read', 'none'];
  let best: AdminMatrixLevel = 'none';
  for (const role of staff) {
    const level = matrixLevelForRole(section, role);
    if (order.indexOf(level) < order.indexOf(best)) {
      best = level;
    }
  }
  return best;
}

export function canMatrixAction(
  roles: string[],
  section: AdminMatrixSection,
  action: AdminMatrixAction,
): boolean {
  if (action === 'assign_roles' || action === 'patch_fees') {
    return roles.includes(UserRoleCode.SUPER_ADMIN);
  }
  if (action === 'block_user') {
    return (
      roles.includes(UserRoleCode.SUPER_ADMIN) ||
      roles.includes(UserRoleCode.COMPLIANCE)
    );
  }
  const level = effectiveMatrixLevel(roles, section);
  return LEVEL_ACTIONS[level].has(action);
}

export function assertMatrixSection(
  roles: string[],
  section: AdminMatrixSection,
  action: AdminMatrixAction = 'view',
): void {
  if (!canMatrixAction(roles, section, action)) {
    throwAdminError(
      'ADMIN_FORBIDDEN',
      'Insufficient permissions for this action',
      HttpStatus.FORBIDDEN,
    );
  }
}

export function assertMatrixArea(
  roles: string[],
  area: string,
  action: AdminMatrixAction = 'view',
): void {
  const section = ADMIN_AREA_TO_SECTION[area];
  if (!section) {
    if (roles.some((r) => SUPER_ALIASES.has(r))) return;
    throwAdminError(
      'ADMIN_FORBIDDEN',
      'Insufficient permissions for this action',
      HttpStatus.FORBIDDEN,
    );
  }
  assertMatrixSection(roles, section, action);
}

export function navSectionsForRoles(roles: string[]): AdminMatrixSection[] {
  return (Object.keys(ADMIN_ROLE_MATRIX) as AdminMatrixSection[]).filter(
    (section) => effectiveMatrixLevel(roles, section) !== 'none',
  );
}

export type AdminAccessCapabilities = {
  assignRoles: boolean;
  removeRoles: boolean;
  patchPlatformFees: boolean;
  patchFinancialRules: boolean;
  blockUsers: boolean;
  readOnly: boolean;
};

export function capabilitiesForRoles(roles: string[]): AdminAccessCapabilities {
  const readOnly =
    roles.includes(UserRoleCode.BUSINESS_ANALYST) &&
    !roles.some((r) => SUPER_ALIASES.has(r));
  return {
    assignRoles: roles.includes(UserRoleCode.SUPER_ADMIN),
    removeRoles: roles.includes(UserRoleCode.SUPER_ADMIN),
    patchPlatformFees: roles.includes(UserRoleCode.SUPER_ADMIN),
    patchFinancialRules: roles.includes(UserRoleCode.SUPER_ADMIN),
    blockUsers: canMatrixAction(roles, 'compliance', 'block_user'),
    readOnly,
  };
}

export function isBusinessAnalystReadOnly(roles: string[]): boolean {
  return (
    roles.includes(UserRoleCode.BUSINESS_ANALYST) &&
    !roles.some((r) => SUPER_ALIASES.has(r))
  );
}

export function assertBusinessAnalystReadOnly(
  roles: string[],
  action: AdminMatrixAction,
): void {
  if (!isBusinessAnalystReadOnly(roles)) return;
  if (action !== 'view' && action !== 'export') {
    throwAdminError(
      'ADMIN_FORBIDDEN',
      'Business analysts have read-only access',
      HttpStatus.FORBIDDEN,
    );
  }
}
