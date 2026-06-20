# Backend Architecture

NestJS monolith in `apps/backend/src`.

## Layout

- `main.ts`, `app.module.ts` — bootstrap  
- `config/` — env validation  
- `common/` — filters, guards, pipes  
- `prisma/` — PrismaModule  
- `modules/` — feature modules (`auth`, `users`, `wallets`, `admin`, …)  

## Module rules

- **Controller** — HTTP only  
- **Service** — use-case orchestration  
- **Repository** (optional) — persistence  
- **DTO** — validation contracts  

No Prisma in controllers.

## Admin module

`modules/admin/` — operator API, audit, ledger helpers, analytics aggregation.

Progress: [Admin Live API Progress](../admin/ADMIN_LIVE_API_PROGRESS.md).

## Full guide

See [architecture.md](architecture.md) for detailed conventions and examples.
