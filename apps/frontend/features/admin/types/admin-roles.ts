/** Staff-роли операторской панели (синхронизировать с Prisma `UserRoleCode`). */
export const STAFF_ROLE_CODES = [
  "SUPER_ADMIN",
  "ADMIN",
  "ACCOUNTANT",
  "CONTENT_MANAGER",
  "SUPPORT_MANAGER",
  "COMPLIANCE",
  "SUPPORT",
  "BUSINESS_ANALYST",
  "NEWS_MANAGER",
] as const;

export type StaffRoleCode = (typeof STAFF_ROLE_CODES)[number];

/** Роли конечных пользователей платформы (не staff). */
export const PLATFORM_USER_ROLE_CODES = ["INVESTOR", "ARTIST", "USER"] as const;

export type PlatformUserRoleCode = (typeof PLATFORM_USER_ROLE_CODES)[number];

export type AdminRoleCode = StaffRoleCode | PlatformUserRoleCode;

export const ADMIN_PANEL_ROLE_CODES = new Set<string>(STAFF_ROLE_CODES);

/** Приоритет для badge в шапке (выше = важнее для отображения). */
const STAFF_ROLE_PRIORITY: Record<StaffRoleCode, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 90,
  COMPLIANCE: 80,
  ACCOUNTANT: 70,
  CONTENT_MANAGER: 60,
  SUPPORT_MANAGER: 50,
  SUPPORT: 40,
  BUSINESS_ANALYST: 55,
  NEWS_MANAGER: 45,
};

export function resolvePrimaryStaffRole(
  roles: string[] | undefined,
): StaffRoleCode | null {
  if (!roles?.length) return null;
  let best: StaffRoleCode | null = null;
  let bestScore = -1;
  for (const code of roles) {
    if (!(code in STAFF_ROLE_PRIORITY)) continue;
    const staff = code as StaffRoleCode;
    const score = STAFF_ROLE_PRIORITY[staff];
    if (score > bestScore) {
      bestScore = score;
      best = staff;
    }
  }
  return best;
}

export function isStaffPanelRole(code: string): code is StaffRoleCode {
  return ADMIN_PANEL_ROLE_CODES.has(code);
}
