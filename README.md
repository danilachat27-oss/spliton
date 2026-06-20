# Spliton

FinTech / revenue-share platform: investor dashboard, catalog, wallets (USDT/TRC20), and an internal **Operator Portal** for finance, compliance, content, and analytics teams.

## Monorepo

| App | Path | Stack |
|-----|------|--------|
| Backend | `apps/backend` | NestJS, Prisma |
| Frontend | `apps/frontend` | Next.js |
| Database | `prisma/` | PostgreSQL (Supabase) |

## Quick start

```powershell
# From repository root
cp .env.example .env   # configure DATABASE_URL, JWT_SECRET, etc.

npm install
npm run db:setup       # generate + migrate + seed (stop backend on Windows first)
npm run dev            # backend :4001 + frontend :3000
```

- Operator portal: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- API (default `PORT=4001`): `http://localhost:4001/health`

Dev process hygiene: [docs/operations/DEV_PROCESS_MANAGEMENT.md](docs/operations/DEV_PROCESS_MANAGEMENT.md)

See [Environment](docs/operations/ENVIRONMENT.md) and [Prisma setup](docs/operations/PRISMA_SETUP.md). On Windows, if `prisma generate` fails with EPERM, see [Prisma Windows EPERM](docs/operations/PRISMA_WINDOWS_EPERM.md).

**Frontend live mode:** copy `NEXT_PUBLIC_*` from `apps/frontend/.env.example` into `apps/frontend/.env.local`. Use `NEXT_PUBLIC_API_BASE_URL=http://localhost:4001` and all `*_DATA_SOURCE=live` for real API data. Mock is allowed only in `NEXT_PUBLIC_APP_ENV=development`; staging/production builds fail if any resolved data source is mock (see `lib/validate-public-env.ts` and `apps/frontend/.env.staging.example`).

## Documentation

**Full index:** [docs/README.md](docs/README.md)

| Area | Start here |
|------|------------|
| Operator portal | [docs/admin/ADMIN_OVERVIEW.md](docs/admin/ADMIN_OVERVIEW.md) |
| Analytics / BI | [docs/analytics/ANALYTICS_OVERVIEW.md](docs/analytics/ANALYTICS_OVERVIEW.md) |
| Finance & ledger | [docs/finance/WALLET_LEDGER.md](docs/finance/WALLET_LEDGER.md) |
| Production backlog | [docs/operations/TODO_PRODUCTION.md](docs/operations/TODO_PRODUCTION.md) |

## Scripts (root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Backend + frontend (one each) |
| `npm run dev:clean` | Free ports 3000 / 4001 |
| `npm run ports:check` | List listeners on dev ports |
| `npm run worker:dev` | Backend with report worker enabled |
| `npm run db:setup` | Prisma generate, migrate, seed |
| `npm run backend:test:e2e` | Backend E2E tests |
