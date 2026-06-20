# Admin Auth & Access

## URLs

| URL | Назначение |
|-----|------------|
| `/admin/login` | Staff sign-in (отдельно от `/login`) |
| `/admin` | Dashboard после входа |
| `/admin/*` | Разделы по RBAC |

Публичный хедер **не** содержит ссылку на админку.

## Flow

1. Не авторизован на `/admin/*` → redirect `/admin/login`.  
2. Login → тот же auth API (email/password, 2FA).  
3. Client: `hasAdminAccess(roles)` из `/users/me`.  
4. Server: `GET /api/admin/v1/access` + `RolesGuard`.  
5. Нет staff-роли → Access Denied.  
6. `AuthGuard` продукта **не** обрабатывает `/admin/*`.

Ключевые файлы: `admin-layout-client.tsx`, `admin-login-page.tsx`, `admin-panel-roles.ts`.

## Security principles

- **Backend — источник истины** для RBAC; frontend только UX (hide/disable).  
- Прямой URL без прав → 403 / forbidden screen.  
- Финансовые мутации: confirm dialogs + `AdminAuditService`.  
- Withdrawal/deposit settlement только через `WalletLedgerService` в транзакции.  
- Staff actions в audit log (`ledgerMutation` при изменении баланса).  
- Секреты только в backend env; admin API не использует user endpoints для settle.

Подробнее в архиве: `archive/reports/ADMIN_SECURITY_NOTES.md`.

## Super Admin

1. Регистрация `danila.chat27@gmail.com` (обычный flow).  
2. `npm run db:setup` или migrate + seed.  
3. Seed назначает `SUPER_ADMIN` идемпотентно.

Prisma / миграции: [PRISMA_SETUP.md](../operations/PRISMA_SETUP.md), [PRISMA_WINDOWS_EPERM.md](../operations/PRISMA_WINDOWS_EPERM.md).

## Mock vs Live

`NEXT_PUBLIC_ADMIN_DATA_SOURCE=mock|live` — см. [ADMIN_LIVE_API_PROGRESS.md](ADMIN_LIVE_API_PROGRESS.md).

Архив: `archive/reports/ADMIN_AUTH_AND_PRISMA_SETUP.md`.
