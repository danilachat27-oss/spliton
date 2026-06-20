# Roles & Access

## Staff roles

| Role | Portal access |
|------|----------------|
| `SUPER_ADMIN` | Full |
| `ACCOUNTANT` | Finance, reports, platform revenue (read/export) |
| `CONTENT_MANAGER` | Tracks, rounds, holdings (limited), reports read |
| `SUPPORT_MANAGER` | Users read, support, wallets/deposits/withdrawals read |
| `COMPLIANCE` | Compliance, withdrawals, secondary market |
| `NEWS_MANAGER` | News + system status (no finance) |
| `BUSINESS_ANALYST` | Dashboard + analytics + reports **read-only** |

## No portal access

`USER`, `INVESTOR`, `ARTIST` — только продуктовый кабинет.

Legacy (совместимость): `ADMIN`, `SUPPORT` → staff.

## Workspaces by role

### SUPER_ADMIN

Все группы sidebar. Назначение ролей, platform fees, revenue run, полный audit.

### ACCOUNTANT

**Видит:** финансы, platform revenue, revenue distribution, reports, audit read, holdings read.  
**Не видит:** roles assign, content publish, support mutations.

### CONTENT_MANAGER

**Видит:** tracks, rounds, holdings read, track analytics.  
**Не видит:** withdrawal approve, wallets mutate, fees.

### SUPPORT_MANAGER

**Видит:** overview, users read, support tickets, wallets/deposits/withdrawals read.  
**Не видит:** balance changes, withdrawal approve, roles.

### COMPLIANCE

**Видит:** compliance, risk analytics, secondary market actions, withdrawals (hold/review).  
**Не видит:** platform fees edit, content CRUD.

### BUSINESS_ANALYST

См. [BUSINESS_ANALYST_ROLE.md](../analytics/BUSINESS_ANALYST_ROLE.md).

## Enforcement

| Layer | Mechanism |
|-------|-----------|
| Backend | `RolesGuard`, `ADMIN_PANEL_ROLE_CODES`, `admin-role-matrix.ts` (`assertMatrixSection`, `capabilitiesForRoles`) |
| Frontend | `canAccessAdminSection` (nav), `canPerformAdminAction` (buttons — matrix-backed via `admin-action-permissions.ts`) |
| Portal gate | `GET /api/admin/v1/access` → `sections`, `capabilities`, `readOnly` |

Конфиг: `apps/backend/src/modules/admin/common/admin-role-matrix.ts` (source of truth), зеркало `apps/frontend/features/admin/config/admin-role-matrix.ts`.

Legacy `PERMISSION_MATRIX` в `admin-permissions.ts` — **deprecated** для action buttons; используйте matrix helpers.

## Security closeout (2026-06)

- Admin order detail (`GET /api/admin/v1/orders/:id`) — требует `rounds:view` (NEWS_MANAGER → 403)
- Report list/getById/retry — фильтр по whitelist типов отчёта для роли
- Compliance: listing create/cancel, primary purchase, secondary buy — `assertUserCanTransact`
- Ledger reconciliation POST (non-dry-run) — `wallets:mutate`
- Checklist: [SECURITY_CHECKLIST.md](../operations/SECURITY_CHECKLIST.md)

## Super Admin bootstrap

Email `danila.chat27@gmail.com` — идемпотентно через `prisma/seed.ts` + migration `20260530120001_staff_roles_data`. Роль в БД, не в frontend.

## Live roles UI (`/admin/roles`)

- `GET /api/admin/v1/roles` — роли + счётчики  
- `GET /api/admin/v1/roles/:code/users`  
- `POST /api/admin/v1/users/:id/roles` — assign (SUPER_ADMIN)  
- `DELETE /api/admin/v1/users/:id/roles/:code`  

**SUPER_ADMIN safeguards:**

- UI: обязательная фраза «Я понимаю, что назначаю полный доступ SUPER_ADMIN»  
- API: `confirmSuperAdmin: true`  
- Запрет снять / self-demote последнего SUPER_ADMIN  
- Audit before/after  

## Permission matrix page

UI matrix page reads from `admin-role-matrix.ts` (sync with backend). Action-level checks: `canMatrixAction` / `capabilitiesForRoles`.

## Архив

`archive/reports/ADMIN_ROLE_WORKSPACES.md`, `ADMIN_ROLES_LIVE_FLOW.md`, `ADMIN_ROLES_AND_ACCESS.md` (исходник).
