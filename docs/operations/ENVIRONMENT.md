# Environment Variables

**Never commit** `.env` with secrets. Use `.env.example` as template.

## Backend

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Pooled Postgres (Supabase) |
| `DIRECT_URL` | Direct connection for migrations |
| `TEST_DATABASE_URL` | Optional; e2e/CI only — Jest maps to `DATABASE_URL` in-process ([E2E_DATABASE.md](../testing/E2E_DATABASE.md)) |
| `TEST_DIRECT_URL` | Optional; `scripts/test-db-setup.mjs` migrate target |
| `JWT_SECRET` | Access/refresh tokens |
| `FRONTEND_ORIGIN` | CORS allowlist (comma-separated origins) |
| `TRON_PROVIDER_MODE` | `mock` \| `tron` — in **production** with `DEPOSIT_INGESTION_ENABLED=true`, only `tron` is allowed (Joi boot guard) |
| `DEPOSIT_INGESTION_ENABLED` | On-chain deposit watcher |
| `ALLOW_DEV_DEPOSIT_ADDRESS` | `true` only on staging/dev; forced `false` in production |
| `PASSWORD_RESET_TOKEN_TTL_HOURS` | Reset link TTL (default 1h) |

## Observability (backend)

| Variable | Purpose |
|----------|---------|
| `HEALTH_DEEP_TOKEN` | Optional bearer for `GET /health/deep` (internal probes) |
| `ERROR_TRACKING_PROVIDER` | `disabled` \| `console` \| `sentry` |
| `SENTRY_DSN` | Sentry DSN when provider is `sentry` |
| `ERROR_TRACKING_ENVIRONMENT` | Release environment tag |
| `ERROR_TRACKING_RELEASE` | Release/version tag |
| `LOG_LEVEL` | `debug` \| `log` \| `warn` \| `error` |

Health endpoints: `/health/live` (liveness), `/health/ready` (readiness, 503 on fail), `/health/deep` (workers/finance, token-protected). Operator API: `/api/admin/v1/operations/status`, `/api/admin/v1/alerts`. Runbooks: [INCIDENT_RUNBOOKS.md](./INCIDENT_RUNBOOKS.md).

## Frontend

Central config: `apps/frontend/lib/public-env.ts`. Build guard: `apps/frontend/lib/validate-public-env.ts` (runs on `next build` for staging/production).

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_ENV` | `development` \| `staging` \| `production` — controls strict build rules |
| `NEXT_PUBLIC_API_BASE_URL` | Backend origin (**required** for staging/production) |
| `NEXT_PUBLIC_ADMIN_API_BASE_URL` | Optional dedicated admin API |
| `NEXT_PUBLIC_ADMIN_DATA_SOURCE` | `mock` \| `live` (mock **blocked** on staging/prod build) |
| `NEXT_PUBLIC_WALLET_DATA_SOURCE` | `mock` \| `live` — root inheritance for portfolio/catalog/payouts |
| `NEXT_PUBLIC_CATALOG_DATA_SOURCE` | `mock` \| `live` — catalog/buy (inherits wallet if unset) |
| `NEXT_PUBLIC_MARKET_OVERVIEW_DATA_SOURCE` | `mock` \| `live` — `/catalog/market-overview` |
| `NEXT_PUBLIC_RELEASE_ANALYTICS_DATA_SOURCE` | `mock` \| `live` — `/analytics/releases` |
| `NEXT_PUBLIC_PORTFOLIO_DATA_SOURCE` | `mock` \| `live` — assets overview/metrics/positions |
| `NEXT_PUBLIC_PAYOUTS_DATA_SOURCE` | `mock` \| `live` — payouts section |
| `NEXT_PUBLIC_SERVICES_DATA_SOURCE` | `mock` \| `live` — calculator, partner gate |
| `NEXT_PUBLIC_AUTH_DATA_SOURCE` | `mock` \| `live` — **Account Center** (`/dashboard/profile` tabs, `/dashboard/documents`). Inherits `WALLET` if unset. Staging/prod build requires `live`. |
| `NEXT_PUBLIC_SUPPORT_DATA_SOURCE` | `mock` \| `live` — `/dashboard/support`, ticket detail |
| `NEXT_PUBLIC_NEWS_DATA_SOURCE` | `mock` \| `live` — public `/news` |
| `NEXT_PUBLIC_STATUS_DATA_SOURCE` | `mock` \| `live` — public `/system-status` |
| `NEXT_PUBLIC_TRON_EXPLORER_BASE_URL` | Optional TronScan links in admin deposits |
| `NEXT_PUBLIC_MIN_WITHDRAWAL_USDT` | Optional UI minimum withdrawal hint |

Local dev defaults API to `http://localhost:4001` when `NEXT_PUBLIC_API_BASE_URL` is unset.

## Report worker & storage (backend)

| Variable | Purpose |
|----------|---------|
| `REPORT_WORKER_ENABLED` | `true` only when background worker should poll; dev default **false** |
| `REPORT_WORKER_POLL_MS` | Poll interval when enabled (min 5000, default 15000) |
| `REPORT_STORAGE_MODE` | `db` \| `local` \| `object` \| `supabase` |
| `REPORT_STORAGE_BUCKET` | S3 bucket (object mode) |
| `REPORT_STORAGE_PUBLIC_URL` | CDN base (object mode only — reports should stay private) |
| `REPORT_STORAGE_ACCESS_KEY` | S3 access key |
| `REPORT_STORAGE_SECRET_KEY` | S3 secret |
| `REPORT_STORAGE_ENDPOINT` | S3 endpoint (R2 / Supabase S3-compatible) |
| `SUPABASE_URL` | Supabase project URL (Storage + API) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Backend only** — Storage upload/signed URLs |
| `SUPABASE_STORAGE_RELEASE_COVERS_BUCKET` | Default `release-covers` |
| `SUPABASE_STORAGE_RELEASE_AUDIO_BUCKET` | Default `release-audio` (private) |
| `SUPABASE_STORAGE_REPORTS_BUCKET` | Default `reports` (private) |
| `SUPABASE_STORAGE_USER_DOCUMENTS_BUCKET` | Default `user-documents` (reserved) |
| `ALLOW_DEV_DEPOSIT_ADDRESS` | `true` only on staging/dev |

## Local example

```env
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_API_BASE_URL=http://localhost:4001
PORT=4001
REPORT_WORKER_ENABLED=false
NEXT_PUBLIC_WALLET_DATA_SOURCE=live
NEXT_PUBLIC_CATALOG_DATA_SOURCE=live
NEXT_PUBLIC_MARKET_OVERVIEW_DATA_SOURCE=live
NEXT_PUBLIC_RELEASE_ANALYTICS_DATA_SOURCE=live
NEXT_PUBLIC_PORTFOLIO_DATA_SOURCE=live
NEXT_PUBLIC_PAYOUTS_DATA_SOURCE=live
NEXT_PUBLIC_SERVICES_DATA_SOURCE=live
NEXT_PUBLIC_AUTH_DATA_SOURCE=live
NEXT_PUBLIC_SUPPORT_DATA_SOURCE=live
NEXT_PUBLIC_NEWS_DATA_SOURCE=live
NEXT_PUBLIC_STATUS_DATA_SOURCE=live
NEXT_PUBLIC_ADMIN_DATA_SOURCE=live
```

**Staging / production:** set `NEXT_PUBLIC_APP_ENV=staging` or `production`, `NEXT_PUBLIC_API_BASE_URL`, and **all** `*_DATA_SOURCE=live` (see `apps/frontend/.env.staging.example`). `next build` fails if any resolved source is mock or API URL is missing. Unset flags may inherit `live` from `WALLET`, but deploy env should set all flags explicitly.

**Account Center closed beta:** minimum `NEXT_PUBLIC_AUTH_DATA_SOURCE=live`, `NEXT_PUBLIC_SUPPORT_DATA_SOURCE=live`, `NEXT_PUBLIC_WALLET_DATA_SOURCE=live` (holdings/balance on overview). Prototype query params (`?verifyStatus=`, `?securityState=`) are blocked in strict deploy builds via `isAccountCenterPrototypeAllowed()`.

Backend default port: **4001** (`PORT` in `.env`). See [DEV_PROCESS_MANAGEMENT.md](./DEV_PROCESS_MANAGEMENT.md).
