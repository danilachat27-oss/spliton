# Spliton Backend Architecture

> Index: [API Overview](API_OVERVIEW.md) · [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md) · [docs/README.md](../README.md)

## Structure

Backend lives in `apps/backend/src` and is organized as:

- `main.ts`, `app.module.ts` - app bootstrap and root wiring.
- `config/` - environment schema and app-level config factory.
- `common/` - shared cross-cutting concerns (filters/interceptors/guards/pipes/decorators/types).
- `prisma/` - Prisma module and service (single DB access entrypoint).
- `modules/` - feature modules (`health`, `auth`, `users`, `releases`, `wallets`, `orders`, `trades`).

## Module Rules

- Keep modules small and explicit.
- Split responsibilities into:
  - `controller` - HTTP contract only.
  - `service` - use-case orchestration.
  - `repository` - persistence logic only.
  - `dto` - input/output contracts.
- Avoid giant files; split when files become hard to scan.

## Responsibility Boundaries

- **Controller**
  - Receives request parameters.
  - Delegates to service.
  - No business logic and no direct Prisma usage.
- **Service**
  - Coordinates use-case flow.
  - Calls repository and composes response.
  - No HTTP-specific concerns.
- **Repository**
  - Encapsulates Prisma queries and DB access details.
  - Keeps query logic centralized per module.

## Prisma Placement

- Prisma is centralized in:
  - `apps/backend/src/prisma/prisma.module.ts`
  - `apps/backend/src/prisma/prisma.service.ts`
- Feature modules use repositories instead of scattering raw Prisma calls.

## Config Placement

- `config/env.validation.ts` validates required env variables.
- `config/app.config.ts` defines app-level config (port, cors, env).
- `ConfigModule` is global and loaded in `app.module.ts`.

## Common Layer

- Global exception filter lives in `common/filters`.
- Shared types live in `common/types`.
- Other common folders are reserved for future cross-module reuse.

## Current Endpoints

- `GET /health`
- `GET /health/db`
- `GET /releases`

## Guardrails (Do Not)

- Do not place business logic in controllers.
- Do not spread raw SQL/Prisma calls across unrelated files.
- Do not create huge monolithic files.
- Do not change frontend/UI from backend tasks.
- Do not run `prisma db push` in this workflow.
- Do not modify applied migrations unless there is a critical issue.
