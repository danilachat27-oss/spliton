# Backend testing

## What runs where

| Suite | Command | Scope |
| --- | --- | --- |
| Unit | `npm run backend:test` | Jest in `apps/backend/src` (`*.spec.ts`). Passes with no tests via `--passWithNoTests`. |
| E2E | `npm run backend:test:e2e` | Jest config `apps/backend/test/jest-e2e.json`; files `*.e2e-spec.ts`. |

E2E boots the full Nest `AppModule` (same global pipes, exception filter, and Helmet as production), disables the `ThrottlerGuard` so rate limits do not flake multi-step auth flows, and exercises HTTP against a real PostgreSQL database via Prisma.

## Environment variables

Required for any run that touches the database (e2e, local dev):

- `DATABASE_URL` — Prisma connection string (required by app config validation).
- `DIRECT_URL` — Prisma direct connection (required by validation; used by CLI/migrations, not overridden in the Nest client).
- `JWT_SECRET` — access token signing.
- `JWT_REFRESH_SECRET` — refresh token signing.

Optional for tests:

- `NODE_ENV` — set to `test` automatically by `test/jest-e2e.setup.ts` for e2e runs.
- `TEST_DATABASE_URL` — when set, `jest-e2e.setup.ts` assigns it to `process.env.DATABASE_URL` for the Jest process only (your `.env` file on disk is unchanged). Prisma and the Nest app therefore connect to the test database without a custom `PrismaClient` constructor. The cleanup helper uses the same effective URL.

Never commit `.env`. Do not paste secrets into issues or CI logs.

## Local e2e

From the monorepo root (with `.env` at repo root or `apps/backend/.env` as configured by `ConfigModule`):

```bash
npm run backend:test:e2e
```

Prisma Client is generated via `apps/backend` **postinstall**: `prisma generate --schema ../../prisma/schema.prisma` then `scripts/sync-prisma-generated.cjs`, which copies the generated client into `node_modules/@prisma/client/.prisma/client` and removes a stray `apps/backend/node_modules/.prisma` folder. That removal matters because Node can resolve the bare specifier `.prisma/...` from `@prisma/client` to the wrong folder if the stray tree exists (symptom: `@prisma/client did not initialize yet`). After schema changes, run `npm install` in `apps/backend` (or `npm run postinstall` there).

## Test data and cleanup

Auth regression tests create users whose emails match:

- prefix: `test-auth-regression-`
- domain: `@example.com`  
  Example: `test-auth-regression-1714528800000@example.com`

After the suite, `cleanupAuthRegressionUsers()` runs `deleteMany` on `users` with that `startsWith` / `endsWith` filter. Related rows with `onDelete: Cascade` / `SetNull` are handled by the database; the cleanup does **not** truncate the database and does not target any other email pattern.

If cleanup fails (for example, a foreign key from unrelated business data pointing at such a user), the suite surfaces the error; that situation should not occur for freshly registered regression users.

## Why CI needs a separate test database

E2E tests **create and delete real rows**. Running them against a shared production or staging Supabase project risks:

- data loss or collisions with real accounts,
- audit noise and session churn,
- accidental coupling to production-like data.

For production-grade CI, provision a **dedicated** Postgres database (or Supabase project) and store its URL in GitHub Actions secrets. Optionally set `TEST_DATABASE_URL` to that database and keep `DATABASE_URL` aligned or use the same secret for both in CI only.

**Do not** run e2e against a production database. Treat `DATABASE_URL` in developer machines as dev-only unless you explicitly accept the risk documented here.

## GitHub Actions

Workflow: `.github/workflows/backend-ci.yml`.

- **Always:** `npm ci`, `prisma generate`, `npm run build`, `npm run lint:ci`, `npm run test` in `apps/backend`.
- **E2E job:** runs only when all of the following repository secrets are non-empty: `BACKEND_E2E_DATABASE_URL`, `BACKEND_E2E_DIRECT_URL`, `BACKEND_E2E_JWT_SECRET`, `BACKEND_E2E_JWT_REFRESH_SECRET`. Optional: `BACKEND_E2E_TEST_DATABASE_URL` maps to `TEST_DATABASE_URL` for an isolated DB.

If secrets are missing, the workflow still passes the build/lint/unit gate; the e2e job is skipped so forks and new repos do not fail CI.

## Commands not used here

- `prisma db push` — not used in tests or CI.
- Applying migrations from CI — not automated in this workflow; migrate your test DB out-of-band as per your release process.
