import { SetMetadata } from '@nestjs/common';
import type { UserRoleCode } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Требуемые роли (достаточно одной совпавшей). */
export const Roles = (...roles: UserRoleCode[]) =>
  SetMetadata(ROLES_KEY, roles);
