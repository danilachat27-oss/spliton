# Prisma generate на Windows (EPERM)

## Проблема

При запущенном backend NestJS файл `query_engine-windows.dll.node` заблокирован процессом Node.  
`prisma generate` падает с:

```text
EPERM: operation not permitted, rename ... query_engine-windows.dll.node.tmp... -> query_engine-windows.dll.node
```

## Безопасный порядок (локально)

1. Остановить backend (`npm run backend:dev` в корне или процесс на порту **3001**).
2. Проверить порт:
   ```powershell
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
   ```
   Не используйте `taskkill /F /IM node.exe` — это убьёт и frontend.
3. Из корня репозитория:
   ```powershell
   npm run prisma:generate
   npm run prisma:migrate:deploy
   npm run prisma:seed
   ```
4. Запустить backend снова.

Скрипт `npm run prisma:generate` вызывает `scripts/check-backend-for-prisma.mjs` и предупреждает, если порт 3001 занят.

## CI

В CI backend не держит DLL открытым — `prisma generate` выполняется до `nest build`.

## BUSINESS_ANALYST

После изменения enum в `schema.prisma` обязательны:

- `20260531200000_business_analyst_role_enum`
- `20260531200001_business_analyst_role_data`
- успешный `prisma generate` (client с `UserRoleCode.BUSINESS_ANALYST`)

См. также `ADMIN_AUTH_AND_PRISMA_SETUP.md`, `BUSINESS_ANALYST_ROLE.md`.
