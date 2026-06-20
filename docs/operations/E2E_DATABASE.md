# E2E database workflow

Backend e2e tests create real rows (users `@example.com`, wallets, orders, trades). Use a **dedicated** Supabase project or local Postgres — never production or shared staging.

## Variables

| Variable | Purpose |
|----------|---------|
| `TEST_DATABASE_URL` | Pooled URL for Jest + scripts (port 6543, `pgbouncer=true`) |
| `TEST_DIRECT_URL` | Direct URL for `prisma migrate deploy` (port 5432) |
| `ALLOW_E2E_CLEANUP` | Set to `1` only to override cleanup guards on a known-safe test DB |
| `ALLOW_E2E_SETUP` | Set to `1` only to run `test:db:setup` against production-looking URLs |
| `E2E_SKIP_GLOBAL_CLEANUP` | Skip Jest global teardown cleanup (`1`) |

`apps/backend/test/jest-e2e.setup.ts` maps `TEST_DATABASE_URL` → `DATABASE_URL` for the Jest process only (developer `.env` is not rewritten).

## 1. Create dedicated test DB

1. Create a Supabase project (e.g. `spliton-e2e`) or local Postgres instance.
2. Add to repo root `.env`:

```env
TEST_DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
TEST_DIRECT_URL=postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres
```

Do **not** point `TEST_DATABASE_URL` at production or staging unless you fully understand data loss risk.

## 2. Apply migrations

From repo root:

```powershell
npm run test:db:setup          # migrate deploy on TEST_DATABASE_URL
npm run test:db:setup:seed     # migrate + role seed (SUPER_ADMIN hint)
```

Uses `DIRECT_URL` / `TEST_DIRECT_URL` for DDL. Migration `20260604120000_deposit_ingestion_withdrawal_hardening` is idempotent and runs **outside a transaction** (`-- prisma:disable-transaction`) so enum `CREDITED` is visible before data UPDATE.

If `migrate deploy` fails on drift, check status:

```powershell
$env:DATABASE_URL=$env:TEST_DIRECT_URL
npx prisma migrate status
```

## 3. Verify drift

```powershell
npm run test:db:check          # connectivity + user count
npm run test:db:drift-check    # ledger_postings, operation_type, deposit ingestion, compliance, password_reset, report_jobs
npm run db:constraint-prechecks
```

Expected drift checks:

- `ledger_postings` + `operation_type`
- `deposit_watcher_states`, `deposit_ingestion_logs`
- `compliance_notes`
- `password_reset_tokens`
- `report_jobs.storage_key`
- enum `deposit_status` value `CREDITED`

If any check fails → run `npm run test:db:setup` on the dedicated project.

## 4. Run finance-critical e2e subset

```powershell
cd apps/backend
$env:TEST_DATABASE_URL="postgresql://..."   # if not in .env

npm run test:e2e -- `
  test/wallet-read.e2e-spec.ts `
  test/withdrawal-ledger.e2e-spec.ts `
  test/admin-withdrawals.e2e-spec.ts `
  test/deposit-ingestion.e2e-spec.ts `
  test/ledger-reconciliation.e2e-spec.ts `
  test/primary-order.e2e-spec.ts `
  test/secondary-market.e2e-spec.ts `
  test/secondary-market-depth.e2e-spec.ts `
  test/portfolio.e2e-spec.ts `
  test/wallet-activity.e2e-spec.ts `
  test/user-analytics.e2e-spec.ts `
  test/market-overview.e2e-spec.ts `
  test/admin-revenue-distribution.e2e-spec.ts `
  test/compliance-enforcement.e2e-spec.ts
```

Full suite from repo root:

```powershell
npm run ci:e2e    # test:db:check + all backend e2e
```

## 5. Cleanup (safe)

| Command | Scope |
|---------|--------|
| Jest global teardown | Deletes `*@example.com` after each e2e run |
| `npm run test:db:cleanup` | Same, manual |

**Guards** (refuse unless `ALLOW_E2E_CLEANUP=1`):

- URL contains `prod`, `production`, `staging`, `spliton-prod`, `spliton-staging`
- `ENVIRONMENT` / `NODE_ENV` is `production` or `staging`
- `TEST_DATABASE_URL` equals `DATABASE_URL` (shared dev without isolation)

Implemented in:

- `scripts/test-db-cleanup.mjs`
- `apps/backend/test/helpers/e2e-database-url.ts` (Jest teardown)

## Uniqueness helpers

- `apps/backend/test/helpers/e2e-unique.ts` — unique emails, symbols, tx hashes per run
- `apps/backend/test/helpers/cleanup-e2e-users.ts` — domain-scoped delete only

## CI

GitHub Actions (`.github/workflows/ci.yml`) should set `BACKEND_E2E_DATABASE_URL` / secrets and run `npm run test:db:setup` before `npm run backend:test:e2e`.

## Related

- [SUPABASE_DATABASE_WORKFLOW.md](./SUPABASE_DATABASE_WORKFLOW.md)
- [TESTING_OVERVIEW.md](../testing/TESTING_OVERVIEW.md)
- [STAGING_LIVE_CHECKLIST.md](./STAGING_LIVE_CHECKLIST.md)
- [MIGRATION_AUDIT.md](../database/MIGRATION_AUDIT.md)
