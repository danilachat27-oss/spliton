import {
  ADMIN_PANEL_ROLE_CODES,
  resolvePrimaryStaffRole,
  type StaffRoleCode,
} from "@/features/admin/types/admin-roles";

/**
 * Доступ к operator portal (`/admin`, не `/admin/login`):
 * любая staff-роль из {@link ADMIN_PANEL_ROLE_CODES}.
 * Проверка дублируется на бэкенде (`GET /admin/access`, RolesGuard).
 */
export function hasAdminAccess(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return roles.some((r) => ADMIN_PANEL_ROLE_CODES.has(r));
}

export function getPrimaryStaffRole(roles: string[] | undefined): StaffRoleCode | null {
  return resolvePrimaryStaffRole(roles);
}
