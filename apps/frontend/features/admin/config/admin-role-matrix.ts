/**
 * Operator RBAC matrix — keep in sync with
 * apps/backend/src/modules/admin/common/admin-role-matrix.ts
 */
import type { StaffRoleCode } from "@/features/admin/types/admin-roles";

export type AdminMatrixSection =
  | "dashboard"
  | "operatorTasks"
  | "users"
  | "roles"
  | "audit"
  | "tracks"
  | "rounds"
  | "holdings"
  | "news"
  | "wallets"
  | "deposits"
  | "withdrawals"
  | "revenue"
  | "platformRevenue"
  | "secondaryMarket"
  | "support"
  | "disputes"
  | "compliance"
  | "referrals"
  | "legal"
  | "treasury"
  | "reports"
  | "analytics"
  | "settings"
  | "systemStatus"
  | "notifications"
  | "updates"
  | "helpCenter";

export type AdminMatrixLevel = "full" | "read" | "limited" | "none";

export type AdminMatrixAction =
  | "view"
  | "mutate"
  | "approve"
  | "export"
  | "assign_roles"
  | "patch_fees"
  | "block_user";

const STAFF_ROLES: StaffRoleCode[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "ACCOUNTANT",
  "CONTENT_MANAGER",
  "SUPPORT_MANAGER",
  "COMPLIANCE",
  "BUSINESS_ANALYST",
  "NEWS_MANAGER",
  "SUPPORT",
];

const SUPER_ALIASES = new Set<StaffRoleCode>(["SUPER_ADMIN", "ADMIN"]);

const LEVEL_ACTIONS: Record<AdminMatrixLevel, ReadonlySet<AdminMatrixAction>> = {
  full: new Set([
    "view",
    "mutate",
    "approve",
    "export",
    "assign_roles",
    "patch_fees",
    "block_user",
  ]),
  read: new Set(["view", "export"]),
  limited: new Set(["view", "mutate", "approve"]),
  none: new Set(),
};

function noneRow(): Record<StaffRoleCode, AdminMatrixLevel> {
  return Object.fromEntries(STAFF_ROLES.map((r) => [r, "none"])) as Record<
    StaffRoleCode,
    AdminMatrixLevel
  >;
}

function row(
  overrides: Partial<Record<StaffRoleCode, AdminMatrixLevel>>,
): Record<StaffRoleCode, AdminMatrixLevel> {
  return { ...noneRow(), ...overrides };
}

export const ADMIN_ROLE_MATRIX: Record<
  AdminMatrixSection,
  Record<StaffRoleCode, AdminMatrixLevel>
> = {
  dashboard: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    ACCOUNTANT: "read",
    CONTENT_MANAGER: "read",
    SUPPORT_MANAGER: "read",
    COMPLIANCE: "read",
    BUSINESS_ANALYST: "read",
    NEWS_MANAGER: "read",
    SUPPORT: "read",
  }),
  operatorTasks: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    ACCOUNTANT: "read",
    SUPPORT_MANAGER: "read",
    COMPLIANCE: "read",
    SUPPORT: "read",
  }),
  users: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    ACCOUNTANT: "read",
    SUPPORT_MANAGER: "read",
    COMPLIANCE: "read",
    SUPPORT: "read",
  }),
  roles: row({
    SUPER_ADMIN: "full",
    ADMIN: "read",
  }),
  audit: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    ACCOUNTANT: "read",
    COMPLIANCE: "read",
    SUPPORT_MANAGER: "limited",
  }),
  tracks: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    CONTENT_MANAGER: "full",
    ACCOUNTANT: "read",
    COMPLIANCE: "read",
    BUSINESS_ANALYST: "read",
  }),
  rounds: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    CONTENT_MANAGER: "full",
    BUSINESS_ANALYST: "read",
  }),
  holdings: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    ACCOUNTANT: "read",
    CONTENT_MANAGER: "read",
    SUPPORT_MANAGER: "read",
    COMPLIANCE: "limited",
    BUSINESS_ANALYST: "read",
  }),
  news: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    NEWS_MANAGER: "full",
    CONTENT_MANAGER: "read",
  }),
  legal: row({
    SUPER_ADMIN: "full",
    ADMIN: "read",
    COMPLIANCE: "full",
    CONTENT_MANAGER: "read",
    BUSINESS_ANALYST: "read",
  }),
  treasury: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    ACCOUNTANT: "full",
    COMPLIANCE: "read",
    BUSINESS_ANALYST: "read",
  }),
  wallets: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    ACCOUNTANT: "full",
    SUPPORT_MANAGER: "read",
    COMPLIANCE: "limited",
  }),
  deposits: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    ACCOUNTANT: "full",
    SUPPORT_MANAGER: "read",
    COMPLIANCE: "limited",
  }),
  withdrawals: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    ACCOUNTANT: "full",
    COMPLIANCE: "limited",
    SUPPORT_MANAGER: "read",
  }),
  revenue: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    ACCOUNTANT: "full",
    BUSINESS_ANALYST: "read",
  }),
  platformRevenue: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    ACCOUNTANT: "read",
    BUSINESS_ANALYST: "read",
  }),
  secondaryMarket: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    COMPLIANCE: "full",
    ACCOUNTANT: "read",
    SUPPORT_MANAGER: "read",
    BUSINESS_ANALYST: "read",
  }),
  support: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    SUPPORT_MANAGER: "full",
    SUPPORT: "full",
    BUSINESS_ANALYST: "read",
  }),
  disputes: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    SUPPORT_MANAGER: "full",
    SUPPORT: "read",
    COMPLIANCE: "read",
    BUSINESS_ANALYST: "read",
  }),
  compliance: row({
    SUPER_ADMIN: "full",
    ADMIN: "read",
    COMPLIANCE: "full",
    BUSINESS_ANALYST: "read",
  }),
  referrals: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    ACCOUNTANT: "full",
    COMPLIANCE: "full",
    BUSINESS_ANALYST: "read",
    SUPPORT_MANAGER: "read",
  }),
  reports: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    ACCOUNTANT: "full",
    COMPLIANCE: "read",
    BUSINESS_ANALYST: "read",
    CONTENT_MANAGER: "read",
    SUPPORT_MANAGER: "read",
  }),
  analytics: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    BUSINESS_ANALYST: "read",
    ACCOUNTANT: "read",
    CONTENT_MANAGER: "read",
    COMPLIANCE: "read",
    SUPPORT_MANAGER: "read",
    SUPPORT: "read",
  }),
  settings: row({
    SUPER_ADMIN: "full",
    ADMIN: "read",
  }),
  systemStatus: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    NEWS_MANAGER: "full",
    CONTENT_MANAGER: "limited",
    COMPLIANCE: "limited",
    ACCOUNTANT: "limited",
    SUPPORT_MANAGER: "read",
    BUSINESS_ANALYST: "read",
  }),
  notifications: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    ACCOUNTANT: "read",
    CONTENT_MANAGER: "read",
    SUPPORT_MANAGER: "read",
    COMPLIANCE: "read",
    BUSINESS_ANALYST: "read",
    NEWS_MANAGER: "read",
    SUPPORT: "read",
  }),
  updates: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    COMPLIANCE: "limited",
    BUSINESS_ANALYST: "read",
    CONTENT_MANAGER: "read",
    SUPPORT_MANAGER: "read",
    ACCOUNTANT: "read",
    NEWS_MANAGER: "read",
    SUPPORT: "read",
  }),
  helpCenter: row({
    SUPER_ADMIN: "full",
    ADMIN: "full",
    CONTENT_MANAGER: "full",
    SUPPORT_MANAGER: "limited",
    SUPPORT: "read",
    BUSINESS_ANALYST: "read",
  }),
};

export const DANGEROUS_ACTION_PHRASES = {
  platformFees: "ИЗМЕНИТЬ КОМИССИИ",
  depositSettle: "ЗАЧИСЛИТЬ ДЕПОЗИТ",
  withdrawalComplete: "ЗАВЕРШИТЬ ВЫВОД",
  withdrawalReject: "ОТКЛОНИТЬ ВЫВОД",
  revenueRun: "ЗАПУСТИТЬ НАЧИСЛЕНИЕ",
  trackPublish: "ОПУБЛИКОВАТЬ РЕЛИЗ",
} as const;

function staffRoles(roles: string[]): StaffRoleCode[] {
  return roles.filter((r): r is StaffRoleCode => STAFF_ROLES.includes(r as StaffRoleCode));
}

export function matrixLevelForRole(section: AdminMatrixSection, role: string): AdminMatrixLevel {
  if (role === "ADMIN") return ADMIN_ROLE_MATRIX[section].ADMIN;
  if (STAFF_ROLES.includes(role as StaffRoleCode)) {
    return ADMIN_ROLE_MATRIX[section][role as StaffRoleCode];
  }
  return "none";
}

export function effectiveMatrixLevel(roles: string[], section: AdminMatrixSection): AdminMatrixLevel {
  const staff = staffRoles(roles);
  if (!staff.length) return "none";
  const order: AdminMatrixLevel[] = ["full", "limited", "read", "none"];
  let best: AdminMatrixLevel = "none";
  for (const role of staff) {
    const level = matrixLevelForRole(section, role);
    if (order.indexOf(level) < order.indexOf(best)) best = level;
  }
  return best;
}

export function canMatrixAction(
  roles: string[] | undefined,
  section: AdminMatrixSection,
  action: AdminMatrixAction,
): boolean {
  if (!roles?.length) return false;
  if (action === "assign_roles" || action === "patch_fees") {
    return roles.includes("SUPER_ADMIN");
  }
  if (action === "block_user") {
    return roles.includes("SUPER_ADMIN") || roles.includes("COMPLIANCE");
  }
  const level = effectiveMatrixLevel(roles, section);
  return LEVEL_ACTIONS[level].has(action);
}

export function isBusinessAnalystReadOnly(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return roles.includes("BUSINESS_ANALYST") && !roles.some((r) => SUPER_ALIASES.has(r as StaffRoleCode));
}

export type AdminAccessCapabilities = {
  assignRoles: boolean;
  removeRoles: boolean;
  patchPlatformFees: boolean;
  patchFinancialRules: boolean;
  blockUsers: boolean;
  readOnly: boolean;
};

export function capabilitiesForRoles(roles: string[] | undefined): AdminAccessCapabilities {
  if (!roles?.length) {
    return {
      assignRoles: false,
      removeRoles: false,
      patchPlatformFees: false,
      patchFinancialRules: false,
      blockUsers: false,
      readOnly: false,
    };
  }
  return {
    assignRoles: roles.includes("SUPER_ADMIN"),
    removeRoles: roles.includes("SUPER_ADMIN"),
    patchPlatformFees: roles.includes("SUPER_ADMIN"),
    patchFinancialRules: roles.includes("SUPER_ADMIN"),
    blockUsers: canMatrixAction(roles, "compliance", "block_user"),
    readOnly: isBusinessAnalystReadOnly(roles),
  };
}

export function navSectionsForRoles(roles: string[] | undefined): AdminMatrixSection[] {
  if (!roles?.length) return [];
  return (Object.keys(ADMIN_ROLE_MATRIX) as AdminMatrixSection[]).filter(
    (section) => effectiveMatrixLevel(roles, section) !== "none",
  );
}
