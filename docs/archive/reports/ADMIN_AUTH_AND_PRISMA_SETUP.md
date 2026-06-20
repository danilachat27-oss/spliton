# Admin Auth & Prisma Setup

## Operator portal URLs

| URL | Назначение |
|-----|------------|
| `/admin/login` | Отдельный вход для сотрудников (staff) |
| `/admin` | Dashboard после успешного входа |
| `/admin/*` | Разделы панели (role-based nav) |

Публичный продукт **не содержит** кнопки «Admin» в общем хедере. Вход только по прямому URL `/admin/login`.

## Роли

| Prisma `UserRoleCode` | Доступ в `/admin` |
|----------------------|-------------------|
| `SUPER_ADMIN` | Полный доступ |
| `ACCOUNTANT` | Финансы, отчёты, audit read |
| `CONTENT_MANAGER` | Треки, раунды, отчёты read |
| `SUPPORT_MANAGER` | Users read, Support, wallets read |
| `COMPLIANCE` | Compliance, withdrawals, secondary market |
| `USER`, `INVESTOR`, `ARTIST` | **Нет** — Access Denied |

Legacy (временно): `ADMIN`, `SUPPORT` — трактуются как staff для совместимости.

## Как работает доступ

1. **Не авторизован** на `/admin/*` → redirect на `/admin/login` (не на `/login`).
2. **Вход** на `/admin/login` → тот же auth API (email/password, 2FA), затем:
   - `hasAdminAccess(roles)` по данным `/users/me`;
   - `GET /admin/access` (JWT + `RolesGuard` на backend).
3. **Нет staff-роли** → Access Denied (клиент + сервер).
4. **Публичный AuthGuard** не перехватывает `/admin/*` — у портала свои guards.

Файлы:

- `features/admin/components/admin-layout-client.tsx`
- `features/admin/components/admin-login-page.tsx`
- `apps/backend/src/modules/admin/admin-panel-roles.ts`

## Super Admin: danila.chat27@gmail.com

1. Зарегистрируйте аккаунт с этим email (обычная регистрация).
2. Выполните миграции и seed (см. ниже).
3. Seed **идемпотентно** назначает `SUPER_ADMIN` существующему пользователю.
4. Если пользователя ещё нет — seed создаёт только роли и выводит инструкцию.

Роль хранится в БД (`user_roles`), не в frontend hardcode.

## Prisma на Windows (EPERM)

### Причина

`npx prisma generate` перезаписывает  
`node_modules/.prisma/client/query_engine-windows.dll.node`.

Если **backend (Nest)** запущен, процесс держит DLL → **EPERM**.

Frontend можно **не** останавливать.

### Что делать

1. Остановите backend (`npm run backend:dev` / порт **3001**).
2. Windows — найти PID:

   ```powershell
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
   ```

   Не используйте `taskkill /F /IM node.exe` без необходимости — убьёт и frontend.

3. Запустите команды из корня репозитория:

   ```powershell
   cd d:\Projects\revshare-platform
   npm run prisma:generate
   npm run prisma:migrate:deploy
   npm run prisma:seed
   ```

   Или одной цепочкой:

   ```powershell
   npm run db:setup
   ```

`npm run prisma:generate` сначала запускает `scripts/check-backend-for-prisma.mjs` (предупреждение, если порт 3001 занят).

## npm scripts (корень `package.json`)

| Script | Действие |
|--------|----------|
| `prisma:check-backend` | Проверка порта 3001 |
| `prisma:generate` | check + `prisma generate` |
| `prisma:migrate:deploy` | `prisma migrate deploy` |
| `prisma:seed` | `prisma db seed` |
| `db:deploy` | migrate deploy |
| `db:seed` | seed |
| `db:setup` | generate + migrate + seed |

Prisma schema: `prisma/schema.prisma` (корень монорепо).

## Mock vs API

Большинство разделов `/admin/*` используют mock через `apps/frontend/services/admin/*`.  
Живой endpoint: `GET /admin/access`.

Список страниц и TODO API: `ADMIN_FRONTEND_STATUS.md`.

## Backend TODO

- CRUD `/admin/*` по разделам
- Отдельный audit для staff actions
- Опционально: отдельные refresh-cookie политики для operator portal
