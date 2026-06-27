import { HttpStatus } from '@nestjs/common';
import { AdminUpdateType, UserRoleCode } from '@prisma/client';
import { throwAdminError } from '../admin/common/admin-http.util';
import { ADMIN_PANEL_ROLE_CODES } from '../admin/admin-panel-roles';

const MUTATE_ALL: UserRoleCode[] = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
];

const MUTATE_LEGAL: UserRoleCode[] = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.COMPLIANCE,
];

export function assertAdminUpdatesView(roles: string[]): void {
  const allowed = new Set<string>(ADMIN_PANEL_ROLE_CODES as readonly string[]);
  if (roles.some((r) => allowed.has(r))) return;
  throwAdminError('FORBIDDEN', 'Admin updates access denied', HttpStatus.FORBIDDEN);
}

export function canManageAdminUpdates(roles: string[], type?: AdminUpdateType): boolean {
  const set = new Set(roles);
  if (MUTATE_ALL.some((r) => set.has(r))) return true;
  if (type === AdminUpdateType.LEGAL && MUTATE_LEGAL.some((r) => set.has(r))) return true;
  return false;
}

export function assertAdminUpdatesMutate(
  roles: string[],
  type?: AdminUpdateType,
): void {
  assertAdminUpdatesView(roles);
  if (!canManageAdminUpdates(roles, type)) {
    throwAdminError(
      'FORBIDDEN',
      'Admin updates management denied for this role',
      HttpStatus.FORBIDDEN,
    );
  }
}

export function audienceMatchesUser(
  audienceRoles: string[],
  userRoles: string[],
): boolean {
  if (audienceRoles.length === 0) return true;
  const userSet = new Set(userRoles);
  return audienceRoles.some((r) => userSet.has(r));
}
