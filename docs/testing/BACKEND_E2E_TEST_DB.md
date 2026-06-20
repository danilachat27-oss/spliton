# Backend financial e2e — isolated test database

> Release gate after financial fixes. Shared Supabase dev DB flakes are **not** production blockers, but **CI must use isolated DB**.

See also: [E2E_DATABASE.md](./E2E_DATABASE.md) (setup commands).

## Problem (shared DB)

| Suite | Symptom on shared DB |
|-------|----------------------|
| `compliance-enforcement` | `riskFlag` pool empty response; freeze 400; suspend 401 |
| `ledger-reconciliation` | `systemAlert` race |
| `withdrawal-ledger` | complete step 409 |
| Global teardown | FK `orders_user_id_fkey` on `@example.com` cleanup |

Root cause: parallel e2e + manual QA data on one database.

## Target state

- `TEST_DATABASE_URL` → dedicated Supabase project or local Postgres
- CI: `npm run test:db:setup` then `npm run backend:test:e2e`
- Financial subset green on isolated DB

## Create test DB

### Option A — Supabase project `spliton-e2e`

1. New project (empty).
2. Copy pooler URL → `TEST_DATABASE_URL`
3. Copy direct host URL → `TEST_DIRECT_URL`

### Option B — Local Postgres

```bash
createdb spliton_e2e
# TEST_DATABASE_URL=postgresql://localhost:5432/spliton_e2e
# TEST_DIRECT_URL same as TEST_DATABASE_URL
```

## Configure `.env` (never commit)

```env
TEST_DATABASE_URL=postgresql://...
TEST_DIRECT_URL=postgresql://...
JWT_SECRET=local-test-jwt-min-32-chars-long!!
JWT_REFRESH_SECRET=local-test-refresh-min-32-chars!!
```

`jest-e2e.setup.ts` maps `TEST_DATABASE_URL` → `DATABASE_URL` for the Jest process only.

## Migrations + seed

```powershell
npm run test:db:setup:seed
```

Runs `prisma migrate deploy` + role seed (safe, no business wipe).

Financial migrations required:

- `20260605140000_earning_period_holder_snapshots`
- `20260605150000_ownership_ledger_legacy_backfill_enum`

## Run financial e2e subset

```powershell
cd apps/backend
$env:TEST_DATABASE_URL="postgresql://..."
npm run test:e2e -- test/compliance-enforcement.e2e-spec.ts test/withdrawal-ledger.e2e-spec.ts test/secondary-market.e2e-spec.ts test/secondary-market-depth.e2e-spec.ts test/admin-revenue-distribution.e2e-spec.ts test/admin-revenue-payout-cutoff.e2e-spec.ts test/admin-secondary-market.e2e-spec.ts test/ledger-reconciliation.e2e-spec.ts
```

## Cleanup

| Command | When |
|---------|------|
| Automatic teardown | After full `test:e2e` suite (`@example.com` users) |
| `npm run test:db:cleanup` | Manual reset |
| `E2E_SKIP_GLOBAL_CLEANUP=1` | Debug single spec |

**Known teardown gap:** users with `orders` FK may fail delete — prefer isolated DB + periodic `test:db:cleanup` or fresh project.

## CI (GitHub Actions)

Secrets (see E2E_DATABASE.md):

- `BACKEND_E2E_TEST_DATABASE_URL` → `TEST_DATABASE_URL`
- `BACKEND_E2E_DIRECT_URL` → `DIRECT_URL`

Job order:

1. `npm run test:db:check`
2. `npm run test:db:setup`
3. `npm run backend:test:e2e`

## Before / after (financial fixes, shared DB)

| Suite | Shared DB (observed) | Isolated DB (expected) |
|-------|----------------------|-------------------------|
| `compliance-enforcement` | 1/5 | 5/5 after fixtures stable |
| `withdrawal-ledger` | 1/2 | 2/2 |
| `secondary-market*` | pass | pass |
| `admin-revenue-*` | pass (after migrate) | pass |
| Financial subset 8 files | ~20/24 shared | target 24/24 isolated |

## Ownership backfill on test DB

E2e seeds that create `userPosition` without ledger must add `PRIMARY_BUY` events (see `admin-revenue-distribution.e2e-spec.ts`) **or** run:

```bash
npm run finance:ownership-ledger:backfill -- --apply
```

on test DB after heavy manual seeding.

## Production gate

- Shared Supabase flakes → document as CI blocker, not code blocker
- Production blocked until CI uses `TEST_DATABASE_URL` and financial subset is green
