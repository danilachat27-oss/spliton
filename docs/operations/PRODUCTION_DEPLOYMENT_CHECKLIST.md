# Production deployment checklist

> **Release gate:** [LAUNCH_REHEARSAL_GO_NO_GO.md](./LAUNCH_REHEARSAL_GO_NO_GO.md) must show **GO** for production before deploy.  
> **As of 2026-06-03:** **NO-GO** — migrations pending, build red.

Use this before every production release. Staging should pass the same checks first ([STAGING_LIVE_CHECKLIST.md](./STAGING_LIVE_CHECKLIST.md)).

## Environment & secrets

- [ ] `.env` never committed; rotate any secret that touched a dev machine or CI log
- [ ] `DATABASE_URL` / `DIRECT_URL` → Supabase **production** pooler (`:6543?pgbouncer=true`) + direct (`db.*.supabase.co:5432`)
- [ ] Optional isolated CI/e2e DB via `TEST_DATABASE_URL` — **never** production ([TESTING_OVERVIEW.md](../testing/TESTING_OVERVIEW.md))
- [ ] `JWT_SECRET`, `JWT_REFRESH_SECRET` — strong, unique, not reused from staging
- [ ] `NODE_ENV=production` on API
- [ ] `FRONTEND_ORIGIN` / `CORS_ORIGIN` list exact Vercel production host(s)
- [ ] No `ALLOW_DEV_DEPOSIT_ADDRESS=true` in production
- [ ] No mock providers: `TRON_PROVIDER_MODE=tron` when `DEPOSIT_INGESTION_ENABLED=true` (Joi boot guard in production)
- [ ] `NEXT_PUBLIC_*_DATA_SOURCE=live` on frontend build; `next build` must not allow mock ([ENVIRONMENT.md](./ENVIRONMENT.md))

## Frontend (Vercel)

- [ ] `NEXT_PUBLIC_API_BASE_URL` → production API (Hetzner)
- [ ] `NEXT_PUBLIC_APP_ENV=production`
- [ ] `NEXT_PUBLIC_ADMIN_DATA_SOURCE=live`
- [ ] `NEXT_PUBLIC_WALLET_DATA_SOURCE=live`
- [ ] `NEXT_PUBLIC_SUPPORT_DATA_SOURCE=live`
- [ ] Build: `cd apps/frontend && npm run build`
- [ ] No Supabase service role or storage secrets in client env
- [ ] Security headers / CSP as required by your Vercel config
- [ ] Smoke: `/forgot-password`, `/terms`, `/privacy` (no 404); reset link opens `/reset-password?token=…`

## Backend (Hetzner)

- [ ] Report worker: `REPORT_WORKER_ENABLED=true`
- [ ] Report storage: `REPORT_STORAGE_MODE=supabase` + buckets ([SUPABASE_STORAGE.md](./SUPABASE_STORAGE.md), [REPORT_WORKER_AND_STORAGE.md](./REPORT_WORKER_AND_STORAGE.md))
- [ ] `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` backend-only
- [ ] Tron: `TRON_PROVIDER_URL`, `TRON_API_KEY`, `TRON_USDT_CONTRACT`, confirmations — see [TRON_DEPOSIT_AUTOMATION.md](../finance/TRON_DEPOSIT_AUTOMATION.md)
- [ ] `DEPOSIT_INGESTION_ENABLED` only when provider is verified
- [ ] `MIN_WITHDRAWAL_USDT`, withdrawal fee aligned with `platform_fee_settings`
- [ ] Helmet + Throttler enabled (default in `main.ts`)

## Database

- [ ] Supabase backup / PITR enabled
- [ ] `npm run db:constraint-prechecks` → 0 violations
- [ ] `npm run prisma:migrate:deploy` on staging, then production
- [ ] `npm run prisma:seed` on staging only (roles); production role grants via controlled process
- [ ] Rollback plan: **forward-fix migrations only** (no `migrate reset` on prod)

## Monitoring & observability

- [ ] `ERROR_TRACKING_PROVIDER=sentry` + `SENTRY_DSN` (or documented console-only with risk acceptance)
- [ ] `HEALTH_DEEP_TOKEN` set for internal deep health probes
- [ ] Uptime checks: `GET /health/live`, `GET /health/ready`, `/admin/login`
- [ ] Operator runbooks reviewed: [INCIDENT_RUNBOOKS.md](./INCIDENT_RUNBOOKS.md)
- [ ] Admin operations status: `/api/admin/v1/operations/status` (RBAC)
- [ ] Alerts pipeline: `/api/admin/v1/alerts` — CRITICAL finance/worker alerts monitored
- [ ] Log shipping (API + report worker)
- [ ] Alert: report jobs `processing` > 15 minutes
- [ ] Alert: deposit ingestion worker errors / lag

## Security

- [ ] Staff roles via `user_roles`; no shared admin passwords
- [ ] Rate limits (Throttler) enabled in production
- [ ] Audit on financial and admin mutations
- [ ] Report downloads role-scoped
- [ ] 2FA encryption key `TWO_FACTOR_ENCRYPTION_KEY` set and backed up securely

## Pre-flight automation

- [ ] GitHub Actions [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) green on release branch
- [ ] Backend e2e against dedicated test DB (repository secrets)
- [ ] Playwright smoke + role matrix (`apps/frontend` `npm run test:e2e`)

## Treasury & real-money

- [ ] Migration `20260622120000_treasury_operations_foundation` deployed
- [ ] `SEED_TREASURY_ACCOUNTS_ON_BOOT` with public hot/cold addresses (no keys)
- [ ] `ALLOW_DEV_DEPOSIT_ADDRESS=false` in production
- [ ] `deposit_network_settings`: USDT TRC20 token contract, min deposit, timings configured ([DEPOSIT_NETWORK_SETTINGS.md](../admin/DEPOSIT_NETWORK_SETTINGS.md))
- [ ] `deposit_address_pool` has available addresses (or TRON provider assigns per-user)
- [ ] Smoke: `/assets/payouts/deposit` shows live address + QR (not demo); admin treasury pool count > 0
- [ ] Referral: migration `20260603140000_referral_partner_program`; smoke `/referral-program` (link + rewards tab)
- [ ] Partner: smoke `/partner-program` apply + admin `/admin/referrals` approve flow on staging
- [ ] Withdrawal approval tiers tested (medium/large)
- [ ] Dry-run treasury reconciliation reviewed
- [ ] Kill switches default off; runbook linked

## Legal & compliance

- [ ] Migration `20260621140000_legal_compliance_foundation` deployed
- [ ] Active legal policies published (lawyer-reviewed texts, not seed drafts)
- [ ] `SEED_LEGAL_POLICIES_ON_BOOT` **off** in production (use controlled publish)
- [ ] `COMPLIANCE_KYC_REQUIRED_*` env aligned with go-live policy
- [ ] Country restrictions reviewed by legal ([COUNTRY_RESTRICTIONS.md](../compliance/COUNTRY_RESTRICTIONS.md))
- [ ] Smoke: register consents, primary buy consent gate, withdrawal eligibility

## Platform engineering

- [ ] Migration `20260620120000_platform_engineering` deployed
- [ ] `EVENT_OUTBOX_WORKER_ENABLED=true` (notifications via outbox)
- [ ] `GET /api/admin/v1/safety/console` — data quality green, outbox DLQ = 0
- [ ] Kill switches documented and default off
- [ ] `RETENTION_CLEANUP_ENABLED=true` on production (optional nightly)

## Documents & branding

- [ ] User PDF receipts contain Spliton header (deposit, trade, primary order)
- [ ] Admin report export: PDF/XLSX/DOCX via `ReportRendererService` (Summary + Data + Metadata sheets)
- [ ] No `RevShare` in public frontend copy (`rg RevShare apps/frontend`)
- [ ] Email: Postmark templates use Spliton HTML layout; dev outbox for staging
- [ ] Storage buckets created per [STORAGE_BUCKETS.md](./STORAGE_BUCKETS.md)

## Post-deploy smoke (15 min)

- [ ] Staff login `/admin/login`
- [ ] User login, wallet summary
- [ ] Catalog + primary buy (small amount on staging)
- [ ] Secondary market list
- [ ] Admin: users list, one withdrawal read, one report export queued
- [ ] Analytics dashboard loads for BUSINESS_ANALYST (read-only)

## Rollback

- [ ] Redeploy previous API + frontend artifacts
- [ ] If migration already applied: ship forward-fix migration; do not reset production DB
- [ ] Disable `DEPOSIT_INGESTION_ENABLED` / worker if chain ingestion is suspect

## Launch sign-off (real money)

- [ ] [LAUNCH_REHEARSAL_GO_NO_GO.md](./LAUNCH_REHEARSAL_GO_NO_GO.md) — all areas green or accepted risk
- [ ] SUPER_ADMIN — deploy approval
- [ ] ACCOUNTANT — treasury + reconciliation approval
- [ ] COMPLIANCE — KYC/AML + withdrawal tiers approval
- [ ] Legal counsel — published policies (not seed drafts)
- [ ] First transaction procedure documented and scheduled (internal canary only)
