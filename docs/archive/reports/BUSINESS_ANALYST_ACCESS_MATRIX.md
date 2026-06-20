# BUSINESS_ANALYST — матрица доступа

## Роль

`BUSINESS_ANALYST` — staff-роль только для чтения аналитики и отчётов.

## Может

| Область | Доступ |
|---------|--------|
| `/admin` | Executive dashboard, trends |
| `/admin/analytics/*` | Все analytics endpoints (read) |
| `/admin/platform-revenue` | Просмотр, экспорт CSV |
| `/admin/reports` | Список jobs, generate/download |
| Platform fees | Только GET |

## Не может

| Действие | HTTP |
|----------|------|
| Approve/reject withdrawals | 403 (`assertAdminArea`) |
| Reconcile deposits | 403 |
| Assign roles | 403 |
| PATCH platform fees | 403 |
| Create/update tracks | 403 (`assertMutate`) |
| Compliance mutations | 403 |
| Support status changes | 403 |
| Revenue distribution run | 403 |

## Backend

- `ADMIN_PANEL_ROLE_CODES` включает `BUSINESS_ANALYST`
- `assertAnalyticsArea`: `readAll` для BUSINESS_ANALYST
- `AdminReportsService.assertView`: включён
- `AdminPlatformRevenueService.assertView`: включён
- Мутации: отдельные `assertMutate` / `assertAdminArea` без BUSINESS_ANALYST

## Frontend

- Sidebar: группа «Аналитика» + обзор + отчёты
- `getPermissionLevel`: read для всех разделов кроме Roles/Settings
- Кнопки approve/reject скрыты через `canPerformAdminAction`

## E2E

`test/admin-analytics-access.e2e-spec.ts` — analytics 200, approve 403, roles 403.
