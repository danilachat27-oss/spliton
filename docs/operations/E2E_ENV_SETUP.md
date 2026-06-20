# E2E / staging environment variables

Do not commit real secrets. Copy from Supabase dashboard and a password manager.

## Database

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Backend runtime + Prisma pooler (`:6543`, `?pgbouncer=true`) |
| `DIRECT_URL` | Migrations only: `db.<project-ref>.supabase.co:5432` |
| `TEST_DATABASE_URL` | Jest e2e — **dedicated** project recommended |
| `TEST_DIRECT_URL` | Migrations on test DB |

`jest-e2e.setup.ts` maps `TEST_DATABASE_URL` → `DATABASE_URL` for the test process only.

Setup:

```powershell
cd d:\Projects\revshare-platform
npm run test:db:setup
npm run test:db:drift-check
```

## Backend secrets (non-placeholder)

| Variable | Notes |
|----------|--------|
| `JWT_SECRET` | Long random string (not `change_me_*`) |
| `JWT_REFRESH_SECRET` | Different long random string |

## Staging TRON (deposits)

| Variable | Staging | Production |
|----------|---------|------------|
| `DEPOSIT_INGESTION_ENABLED` | `true` when testing ingestion | per runbook |
| `TRON_PROVIDER_MODE` | `mock` for dry-run, `tron` for chain rehearsal | `tron` if ingestion on |
| `TRON_PROVIDER_URL` | TronGrid / provider URL | required when `tron` |
| `TRON_API_KEY` | optional per provider | optional |

## Supabase Storage (backend only)

| Variable | Notes |
|----------|--------|
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Never in frontend |
| `SUPABASE_STORAGE_RELEASE_COVERS_BUCKET` | create in dashboard |
| `SUPABASE_STORAGE_RELEASE_AUDIO_BUCKET` | create in dashboard |
| `SUPABASE_STORAGE_REPORTS_BUCKET` | create in dashboard |
| `SUPABASE_STORAGE_USER_DOCUMENTS_BUCKET` | create in dashboard |

## Frontend (staging build)

```env
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_API_BASE_URL=https://api.staging.example.com
NEXT_PUBLIC_ADMIN_DATA_SOURCE=live
NEXT_PUBLIC_WALLET_DATA_SOURCE=live
NEXT_PUBLIC_SUPPORT_DATA_SOURCE=live
NEXT_PUBLIC_CATALOG_DATA_SOURCE=live
NEXT_PUBLIC_NEWS_DATA_SOURCE=live
NEXT_PUBLIC_STATUS_DATA_SOURCE=live
```

## Legal seed (staging)

```env
SEED_LEGAL_POLICIES_ON_BOOT=true
```

Run once after `migrate deploy` on a clean DB, or use `npm run prisma:seed`.

## E2e-only (set in `create-e2e-app.ts`, not production)

- `REPORT_WORKER_ENABLED=false`
- `EVENT_OUTBOX_WORKER_ENABLED=false`
- `DEPOSIT_INGESTION_ENABLED=false`
- `SKIP_SCHEMA_BOOTSTRAP=true` — allows AppModule boot on legacy DB without closeout tables; **remove effect** once DB is fully migrated.
