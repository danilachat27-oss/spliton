# E2E test database workflow

## Why a separate database

Backend e2e registers users, posts ledger entries, and deletes `@example.com` users in teardown. Running against a shared dev Supabase causes:

- unique constraint flakes (email, symbol),
- pooler timeouts under parallel load,
- accidental coupling to manual QA data.

Use `TEST_DATABASE_URL` pointing at a dedicated project (or local Postgres).

## Setup

1. Create Supabase project `spliton-e2e` (or local Postgres).
2. Add to root `.env` (never commit):

```env
TEST_DATABASE_URL=postgresql://...pooler.../postgres?pgbouncer=true
TEST_DIRECT_URL=postgresql://...db.host...:5432/postgres
JWT_SECRET=local-test-jwt-min-32-chars-long!!
JWT_REFRESH_SECRET=local-test-refresh-min-32-chars!!
```

3. Apply schema:

```powershell
npm run test:db:setup:seed
```

## Run e2e

```powershell
# Jest reads TEST_DATABASE_URL via apps/backend/test/jest-e2e.setup.ts
npm run backend:test:e2e
```

Or explicit:

```powershell
$env:TEST_DATABASE_URL="postgresql://..."
cd apps/backend
npm run test:e2e
```

## Cleanup

- Automatic: `jest-e2e.global-teardown.ts` after full suite (`deleteMany` where `email` ends with `@example.com`).
- Manual: `npm run test:db:cleanup`
- Skip teardown (debug): `E2E_SKIP_GLOBAL_CLEANUP=1`

## CI secrets (GitHub)

| Secret | Maps to |
|--------|---------|
| `BACKEND_E2E_DATABASE_URL` | `DATABASE_URL` |
| `BACKEND_E2E_DIRECT_URL` | `DIRECT_URL` |
| `BACKEND_E2E_TEST_DATABASE_URL` | optional `TEST_DATABASE_URL` |
| `BACKEND_E2E_JWT_SECRET` | `JWT_SECRET` |
| `BACKEND_E2E_JWT_REFRESH_SECRET` | `JWT_REFRESH_SECRET` |

E2e job runs `npm run test:db:setup` then `apps/backend` `npm run test:e2e`.

## Safe seed

`prisma db seed` only upserts roles and optionally grants SUPER_ADMIN to a known email — it does not wipe business data. Safe on empty e2e DB via `npm run test:db:setup:seed`.
