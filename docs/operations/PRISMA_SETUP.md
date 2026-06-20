# Prisma Setup

Prisma schema: `prisma/schema.prisma` (корень монорепо).

## npm scripts (корень)

| Script | Действие |
|--------|----------|
| `prisma:check-backend` | Проверка порта 3001 |
| `prisma:generate` | check + `prisma generate` |
| `prisma:migrate:deploy` | `prisma migrate deploy` |
| `prisma:seed` | `prisma db seed` |
| `db:setup` | generate + migrate + seed |

## Typical local setup

```powershell
cd d:\Projects\revshare-platform
# Остановить backend (порт 3001)
npm run db:setup
npm run backend:dev
```

**Never** `migrate reset` on shared/staging DB.

## Super Admin seed

После seed пользователь `danila.chat27@gmail.com` получает `SUPER_ADMIN` идемпотентно. См. [Admin Auth](../admin/ADMIN_AUTH_AND_ACCESS.md).

## Windows EPERM

Если `prisma generate` падает с EPERM — [PRISMA_WINDOWS_EPERM.md](PRISMA_WINDOWS_EPERM.md).

## Migrations log

Исторический отчёт прогона: `archive/reports/PRISMA_MIGRATION_REPORT.md`.

Актуальный список для admin: [ADMIN_LIVE_API_PROGRESS.md](../admin/ADMIN_LIVE_API_PROGRESS.md).
