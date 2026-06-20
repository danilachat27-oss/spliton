# Roles & Access — Live Flow

## Route

`/admin/roles` — матрица ролей и пользователи по роли.

## Live

- `GET /api/admin/v1/roles` — список ролей с количеством пользователей
- `GET /api/admin/v1/roles/:code/users` — пользователи с ролью
- `POST /api/admin/v1/users/:id/roles` — назначение (только SUPER_ADMIN)
- `DELETE /api/admin/v1/users/:id/roles/:code` — снятие роли

## SUPER_ADMIN safeguards

- UI: фраза «Я понимаю, что назначаю полный доступ SUPER_ADMIN» обязательна для назначения SUPER_ADMIN
- Backend: `confirmSuperAdmin: true` в теле запроса
- Нельзя снять последнего SUPER_ADMIN
- Нельзя self-demote последнего SUPER_ADMIN
- Audit: before/after в admin audit log

## BUSINESS_ANALYST

- Страница `/admin/roles` скрыта или forbidden (нет прав mutation/view roles list)

## Mock mode

При `NEXT_PUBLIC_ADMIN_DATA_SOURCE=mock` — прежние mock-данные из `admin-roles.mock.ts` не используются на roles-section (live API client с fallback по конфигу).
