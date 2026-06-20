# Staging live checklist

> **Release gate:** [LAUNCH_REHEARSAL_GO_NO_GO.md](./LAUNCH_REHEARSAL_GO_NO_GO.md) — staging verdict must be **GO**.  
> **As of 2026-06-03:** **NO-GO** — 54 migrations pending on linked DB; `ci:backend` / `ci:frontend` not green.

Run after deploying to staging (Vercel preview + Hetzner staging API + Supabase staging).

## Environment

```env
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_API_BASE_URL=https://api-staging.example.com
NEXT_PUBLIC_ADMIN_DATA_SOURCE=live
NEXT_PUBLIC_WALLET_DATA_SOURCE=live
NEXT_PUBLIC_SUPPORT_DATA_SOURCE=live
NEXT_PUBLIC_CATALOG_DATA_SOURCE=live
ALLOW_DEV_DEPOSIT_ADDRESS=true
REPORT_WORKER_ENABLED=true
TRON_PROVIDER_MODE=mock
```

Production: `ALLOW_DEV_DEPOSIT_ADDRESS=false`, `TRON_PROVIDER_MODE=tron`, no mock data sources.

Isolated e2e database (recommended):

```env
TEST_DATABASE_URL=postgresql://...staging-e2e...
TEST_DIRECT_URL=postgresql://...staging-e2e...
```

## Automated gates (before manual QA)

From repo root:

```powershell
npm run prisma:validate
npm run prisma:migrate:diff
npm run ci:backend          # lint:ci + build + unit tests
npm run ci:frontend
```

With **dedicated** test DB in `.env`:

```powershell
npm run test:db:setup
npm run test:db:drift-check   # ledger_postings, CREDITED, deposit ingestion, compliance
npm run db:constraint-prechecks
npm run ci:e2e                # full backend e2e
cd apps/frontend
npm run test:e2e
```

Finance-critical subset (faster gate): see [TESTING_OVERVIEW.md](../testing/TESTING_OVERVIEW.md).

Expected: `lint:ci` green, `test:db:drift-check` zero failures, finance e2e subset green on `TEST_DATABASE_URL`.

## Manual smoke

| Route | Check |
|-------|--------|
| `/admin/login` | Staff login, roles |
| `/admin` | Dashboard KPIs |
| `/admin/reports` | Generate, worker status, download |
| `/admin/rounds` | CRUD, RBAC read-only roles |
| `/admin/analytics` | Charts load |
| `/admin/platform-revenue` | Fees from purchases/withdrawals/secondary |
| `/login` → «Забыли пароль?» | `/forgot-password` opens, POST `/auth/forgot-password` |
| `/terms`, `/privacy` | Static legal pages load (no 404) |
| `/assets/payouts/deposit` | Address or unavailable message |
| `/dashboard/profile` | Wallet summary + transactions |
| `/catalog/buy/[uuid]` | Primary purchase |
| `/dashboard/secondary-market` | Listings, create, buy, history |

## Role matrix (manual or Playwright)

Playwright: `cd apps/frontend && npm run test:e2e` — see [PLAYWRIGHT_ROLE_MATRIX.md](../testing/PLAYWRIGHT_ROLE_MATRIX.md).

- [ ] SUPER_ADMIN — settings, roles, fee PATCH
- [ ] BUSINESS_ANALYST — analytics only, settings blocked
- [ ] ACCOUNTANT — finance, no track publish
- [ ] CONTENT_MANAGER — tracks, no withdrawal settle
- [ ] COMPLIANCE — compliance + risk nav
- [ ] SUPPORT_MANAGER — users + support
- [ ] NEWS_MANAGER — news section

## Backend smoke (subset)

```powershell
cd apps/backend
npm run test:e2e -- test/admin-access.e2e-spec.ts test/admin-analytics-access.e2e-spec.ts test/withdrawal-ledger.e2e-spec.ts test/wallet-read.e2e-spec.ts test/primary-order.e2e-spec.ts test/secondary-market.e2e-spec.ts
```

## Sign-off

- [ ] CI workflow green on release branch
- [ ] `npm run prisma:generate` + API boots (no `ConsentSource` crash)
- [ ] Migrations through `20260622120000_treasury_operations_foundation` applied
- [ ] No P1 errors in Sentry (staging project)
- [ ] [LAUNCH_REHEARSAL_GO_NO_GO.md](./LAUNCH_REHEARSAL_GO_NO_GO.md) — staging verdict **GO**
- [ ] [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md) reviewed for prod-only deltas

## Full money flow rehearsal

Complete the 33-step table in [LAUNCH_REHEARSAL_GO_NO_GO.md](./LAUNCH_REHEARSAL_GO_NO_GO.md) on staging with two test users.

Additional admin routes (prompt 36):

| Route | Check |
|-------|--------|
| `/admin/treasury` | Hot wallet, queues, reconciliation |
| `/admin/legal` | Active policies |
| `/admin/compliance` | Risk flags, freeze |
| Safety API | `GET /api/admin/v1/safety/console` — kill switches |

Treasury dry-run:

```http
POST /api/admin/v1/treasury/reconciliation/run?dryRun=true
Authorization: Bearer <ACCOUNTANT token>
```
