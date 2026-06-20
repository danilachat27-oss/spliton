import { UserRoleCode } from '@prisma/client';

/**
 * Роли, которым разрешён вход в операторскую панель (`/admin`).
 * `ADMIN` / `SUPPORT` — legacy-алиасы до полной миграции staff-ролей.
 */
export const ADMIN_PANEL_ROLE_CODES: readonly UserRoleCode[] = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.ACCOUNTANT,
  UserRoleCode.CONTENT_MANAGER,
  UserRoleCode.SUPPORT_MANAGER,
  UserRoleCode.COMPLIANCE,
  UserRoleCode.SUPPORT,
  UserRoleCode.BUSINESS_ANALYST,
  UserRoleCode.NEWS_MANAGER,
] as const;
