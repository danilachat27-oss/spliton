# Business Analyst Role (`BUSINESS_ANALYST`)

## Purpose

Read-only analytics workspace for business analysts: dashboards, analytics sections, reports — without financial mutations or role management.

## Database

Additive migrations:

- `20260531200000_business_analyst_role_enum` — enum value
- `20260531200001_business_analyst_role_data` — seed row in `user_roles`

## Permissions

- Dashboard read
- All `/admin/analytics/*` read
- Reports read/export (when enabled)
- No: approve/reject, settlement, settings, roles assign, wallet mutations

## Sidebar (Business Analyst)

- Обзор
- Аналитика (all visible sub-sections)
- Отчёты (read-only)

## Frontend

Role code in `STAFF_ROLE_CODES`, nav in `admin-sections.ts` analytics group, priority badge in `admin-roles.ts`.
