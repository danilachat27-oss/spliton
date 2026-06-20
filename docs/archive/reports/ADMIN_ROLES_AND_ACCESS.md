# Admin Roles & Access

## Staff roles (portal access)

| Role | Portal |
|------|--------|
| `SUPER_ADMIN` | Full |
| `ACCOUNTANT` | Finance sections |
| `CONTENT_MANAGER` | Tracks, rounds, reports (read) |
| `SUPPORT_MANAGER` | Users (read), Support, wallets (read) |
| `COMPLIANCE` | Compliance, withdrawals, secondary market |

## No portal access

| Role | Note |
|------|------|
| `USER` | Platform user only |
| `INVESTOR` | Holder — product role, not staff |
| `ARTIST` | Artist — product role |

Legacy: `ADMIN`, `SUPPORT` — treated as staff until removed.

## Super Admin bootstrap

Email: `danila.chat27@gmail.com`  
Assigned via: migration `20260530120001_staff_roles_data` + `prisma/seed.ts`

## Permission matrix UI

`/admin/roles` — config: `features/admin/config/admin-permissions.ts`

## Backend

`GET /admin/access` — `ADMIN_PANEL_ROLE_CODES` in `apps/backend/src/modules/admin/admin-panel-roles.ts`

## Frontend checks

1. `hasAdminAccess(roles)` — client pre-check  
2. `verifyAdminAccess(token)` — server confirmation  
3. `canAccessAdminSection()` — sidebar + `AdminSectionGuard`
