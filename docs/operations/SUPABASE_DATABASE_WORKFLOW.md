# Supabase Database Workflow

**Primary database:** Supabase PostgreSQL only (no Docker DB as source of truth).

## Environments

| Environment | Supabase project | Data | Migrations | Seed |
|-------------|------------------|------|------------|------|
| **Production** | `spliton-prod` (dedicated) | Real users, money, audit | CI/CD after staging | Roles upsert only |
| **Staging** | `spliton-staging` | Sanitized or test copy | First target for every release | Full idempotent seed OK |
| **Dev / Test** | `spliton-dev` or team shared | Dev + e2e | Local `migrate deploy` | Full seed |
| **E2E only** | `spliton-e2e` (recommended) | Disposable test rows | `npm run test:db:setup` | Optional seed |

**Rule:** Never point local `.env` at production unless doing a read-only emergency. Use separate project refs in connection strings.

## Connection strings

| Variable | Host / port | When |
|----------|-------------|------|
| `DATABASE_URL` | Pooler `:6543` + `?pgbouncer=true` | NestJS runtime, e2e, scripts |
| `DIRECT_URL` | `db.<ref>.supabase.co:5432` | `prisma migrate deploy`, DDL |
| `TEST_DATABASE_URL` | Dedicated e2e pooler | Jest + `scripts/test-db-*.mjs` only |
| `TEST_DIRECT_URL` | Dedicated e2e direct | E2e migrate deploy |

Prisma schema:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Pooler:** Use for app queries (many short connections).  
**Direct:** Required for migrations — pooler can break DDL/long transactions.

## Local development

```powershell
npm run prisma:check-backend   # port 3001 free (Windows EPERM)
npm run db:constraint-prechecks  # before CHECK migrations
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
npm run dev
```

## Dedicated test database

See [E2E_DATABASE.md](./E2E_DATABASE.md). Summary:

```powershell
# .env: TEST_DATABASE_URL + TEST_DIRECT_URL
npm run test:db:setup
npm run test:db:drift-check
npm run test:db:check
```

Cleanup scripts refuse staging/production URLs unless `ALLOW_E2E_CLEANUP=1`.

## Migration deploy (staging / production)

1. [ ] `npm run db:constraint-prechecks` on target (zero violations on required checks)
2. [ ] Supabase backup / PITR confirmed for **production**
3. [ ] `npx prisma migrate status` — note pending migrations
4. [ ] `npm run prisma:migrate:deploy` on **staging** (uses `DIRECT_URL`)
5. [ ] `npm run test:db:drift-check` or manual smoke on finance tables
6. [ ] Deploy backend → smoke + finance e2e subset on `TEST_DATABASE_URL`
7. [ ] Repeat deploy on **production**
8. [ ] Verify `prisma migrate status` → up to date

### Enum migration note (`20260604120000`)

Deposit ingestion adds `deposit_status` value `CREDITED` and updates historical rows in the same migration. The migration file uses:

- `-- prisma:disable-transaction` — each statement commits separately (required: new enum labels must be visible before UPDATE)
- `ADD VALUE IF NOT EXISTS` — safe re-run
- `DO $$ … EXCEPTION duplicate_object` — idempotent CREATE TYPE / FK

Do **not** use manual `prisma db execute` as the primary path; `prisma migrate deploy` must succeed cleanly.

## Drift detection

Symptoms:

- Finance e2e 500 on wallet/ledger endpoints
- `migrate status` shows pending migrations but app “works” (schema applied manually)
- Missing `_prisma_migrations` table

Checks:

```powershell
npx prisma migrate status
npm run test:db:drift-check
npm run db:constraint-prechecks
```

Fix: `npm run test:db:setup` on dedicated DB, or `prisma migrate deploy` on staging with `DIRECT_URL`.

## Production deploy checklist

1. [ ] Prechecks on staging  
2. [ ] Backup on production  
3. [ ] Staging migrate + e2e subset green  
4. [ ] Staging app deploy + manual smoke ([STAGING_LIVE_CHECKLIST.md](./STAGING_LIVE_CHECKLIST.md))  
5. [ ] Production migrate  
6. [ ] Production app deploy  

## Rollback strategy

| Change type | Rollback |
|-------------|----------|
| Additive indexes / columns | Leave in place; deploy previous app binary |
| CHECK constraints | **Hard** — need new migration to DROP CONSTRAINT |
| Bad data migration | Forward-fix SQL + audit; no reset |

We do **not** use `migrate reset` on shared environments.

## Seed policy

| Env | `npm run prisma:seed` |
|-----|------------------------|
| Production | Only if runbook says so — roles upsert, SUPER_ADMIN idempotent |
| Staging / Dev / E2E | Safe — idempotent `skipDuplicates` |

## Security

- Service role key: backend only, never in Next.js `NEXT_PUBLIC_*`  
- See [SUPABASE_SECURITY_REVIEW.md](../database/SUPABASE_SECURITY_REVIEW.md)

## Related

- [E2E_DATABASE.md](./E2E_DATABASE.md)  
- [MIGRATION_AUDIT.md](../database/MIGRATION_AUDIT.md)  
- [DB_CONSTRAINT_PRECHECKS.md](../database/DB_CONSTRAINT_PRECHECKS.md)  
- [REPORT_WORKER_AND_STORAGE.md](./REPORT_WORKER_AND_STORAGE.md)
