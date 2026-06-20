# Launch rehearsal — GO / NO-GO (Spliton)

> **Дата отчёта:** 2026-06-03 (prompt 36/36, release engineer pass)  
> Публичный бренд — **Spliton**. Не симулировать успех внешних провайдеров без credentials.

## Executive verdict

| Gate | Verdict | Комментарий |
|------|---------|-------------|
| **Staging** | **NO-GO** | 54 миграции не применены на подключённой DB; backend build 45 TS errors; frontend build fails typecheck; full e2e money flow не пройден |
| **Production** | **NO-GO** | Staging gate не пройден; legal seed drafts; нет production TRON rehearsal |
| **Real money** | **NO-GO** | Нет on-chain withdrawal automation; lawyer sign-off; treasury hot wallet manual; первый real tx не подписан |

---

## Pre-flight (сессия 36/36)

| Check | Status | Evidence |
|-------|--------|----------|
| Git status | ⚠️ | Массовые uncommitted изменения (legal, treasury, platform) — нужен release branch + green CI |
| `prisma validate` | **PASS** | `The schema at prisma/schema.prisma is valid` |
| `prisma generate` | **PASS** | Client generated v6.19.3 |
| `migrate status` | **FAIL** | **54 migrations pending** on `DATABASE_URL` (Supabase pooler) |
| Backend build | **FAIL** | `Found 45 error(s)` — referrals, treasury Request import, user-analytics null Decimal, app.module UserAccountingModule, etc. |
| Frontend build | **FAIL** | Typecheck errors (исправлены artist/asChild, legal fetch types, partner null; остаются другие) |
| RevShare в UI | **PASS** | Только internal alias `RevShareLogo` → `SplitonLogo`; user copy — Spliton |
| Mock in production | **PASS (code)** | Joi: `ALLOW_DEV_DEPOSIT_ADDRESS=false` in prod; `TRON_PROVIDER_MODE=tron` if ingestion on |
| Kill switches | **PASS (code)** | `FeatureFlagsService` + `KILL_SWITCH_*` in `.env.example` |
| Finance unit tests | **PASS** | 14/14: treasury withdrawal/kill-switch, legal consents, eligibility |
| Full unit suite | **FAIL** | 4 failed / 52 total (user-analytics, market-abuse, release-data-room, deposits spec) |
| E2E specs exist | **PASS** | 44+ backend e2e files; Playwright role matrix documented |
| E2E executed | **NOT RUN** | Требует `TEST_DATABASE_URL` + `npm run test:db:setup` + `ci:e2e` |

### Команды (release engineer)

```powershell
cd d:\Projects\revshare-platform

git status -sb
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate:deploy          # staging DATABASE_URL — P0 перед любым rehearsal
npm run db:constraint-prechecks
npm run test:db:drift-check            # TEST_DATABASE_URL

npm run ci:backend                     # must be green
npm run ci:frontend
npm run ci:e2e

cd apps\frontend
npm run test:e2e
```

---

## Readiness table

| Area | Status | Evidence | Blocker | Risk | Owner / action |
|------|--------|----------|---------|------|----------------|
| DB / migrations | **FAIL** | 54 pending migrations | `migrate deploy` on staging | P0 | DBA / infra |
| Ledger | ✅ code | double-entry, reconciliation | e2e not run | P1 | `ledger-reconciliation.e2e-spec.ts` |
| Deposits | ⚠️ | mock provider + worker | prod TRON not rehearsed | P0 prod | Staging mock e2e |
| Withdrawals | ⚠️ | tier approvals + lifecycle guard | no chain send in app | P0 real money | Manual TRON + tx hash |
| Primary market | ✅ code | idempotency, eligibility | ACTIVE legal policies | P1 | Publish policies |
| Secondary market | ✅ code | depth, charts e2e exist | full UI consent partial | P1 | Staging buy/sell |
| Portfolio | ✅ code | e2e exists | not run | P2 | Run e2e |
| Reports / documents | ✅ code | PDF/XLSX Spliton theme | worker + storage env | P1 | Staging report job |
| Notifications / email | ⚠️ | outbox + Postmark | prod smoke manual | P1 | Verify email staging |
| KYC / legal | ⚠️ | foundation + consents | lawyer review | P0 real money | Publish policies |
| Treasury | ⚠️ | accounts, reconciliation API + UI | observed balance manual | P1 | `/admin/treasury` dry-run |
| Admin / RBAC | ✅ code | matrix + e2e hardening | manual role pass | P1 | Playwright matrix |
| Compliance | ✅ code | freeze, eligibility | env KYC flags | P1 | COMPLIANCE sign-off |
| Storage | ⚠️ | buckets documented | buckets on staging | P1 | `STORAGE_BUCKETS.md` |
| Observability | ✅ code | health, alerts, safety console | Sentry optional | P2 | `SENTRY_DSN` prod |
| Tests / CI | **FAIL** | ci.yml present | build + migrate | P0 | Green release branch |
| Performance | ✅ code | indexes, pagination caps | load test not done | P2 | `performance-hardening.e2e` |
| Docs | ✅ | checklists updated | — | — | This document |

---

## Full user money flow (staging script)

Выполнить **после** `migrate deploy` + seed + green build.  
Два test users: `investor-a@example.com`, `investor-b@example.com`.

| # | Step | API / page | Expected | Pass |
|---|------|------------|----------|------|
| 1 | Register | `POST /auth/register` + terms/privacy | 201, email verification | ☐ |
| 2 | Verify email | `POST /auth/email/verify` | user ACTIVE | ☐ |
| 3 | Accept policies | `POST /api/v1/legal/consents` | consents saved | ☐ |
| 4 | KYC approved | Admin KYC approve OR env KYC off | eligibility OK | ☐ |
| 5 | Profile | `/dashboard/profile?tab=legal` | legal center | ☐ |
| 6 | Deposit address | `GET /api/v1/wallet/deposit-address` | TRC20 address | ☐ |
| 7 | Mock deposit | mock provider / admin credit | deposit row | ☐ |
| 8 | Detected | `/admin/deposits` | DETECTED/CONFIRMING | ☐ |
| 9 | Credited | status CREDITED | wallet available ↑ | ☐ |
| 10 | Balance | `GET /api/v1/wallet/balance` | matches ledger | ☐ |
| 11 | Ledger | admin wallet tx | postings balanced | ☐ |
| 12 | Notification | in-app | deposit event | ☐ |
| 13 | Deposit receipt | documents download | PDF Spliton header | ☐ |
| 14 | Catalog | `/catalog` live | releases load | ☐ |
| 15 | Primary buy | consent modal → order API | order COMPLETED | ☐ |
| 16 | Ownership | admin holdings | position ↑ | ☐ |
| 17 | Portfolio | portfolio overview API | position visible | ☐ |
| 18 | Primary receipt | order receipt PDF | OK | ☐ |
| 19 | Listing | secondary create listing | ACTIVE | ☐ |
| 20 | Secondary buy | user B buys | trade settled | ☐ |
| 21 | Balances | both wallets | buyer ↓ seller ↑ | ☐ |
| 22 | Trade history | secondary market UI | trade row | ☐ |
| 23 | Trade receipt | documents PDF | OK | ☐ |
| 24 | Charts | market charts API | data or empty state | ☐ |
| 25 | Withdrawal | wallet withdrawals API | REQUESTED/LOCKED | ☐ |
| 26 | Approvals | ACCOUNTANT → COMPLIANCE (+ SUPER if large) | APPROVED | ☐ |
| 27 | Complete | tx hash OR manual override + reason | COMPLETED | ☐ |
| 28 | Withdrawal receipt | PDF | OK | ☐ |
| 29 | Treasury recon | `POST .../treasury/reconciliation/run?dryRun=true` | documented | ☐ |
| 30 | Ledger recon | admin ledger reconciliation | 0 critical | ☐ |
| 31 | Statement | user documents monthly | PDF | ☐ |
| 32 | Admin reports | queue XLSX | download RBAC | ☐ |
| 33 | Audit | admin audit log | mutations logged | ☐ |

**Статус:** не выполнено в этой сессии — заблокировано migrate + build.

---

## Admin / operator rehearsal

| Section | Route | Roles | Check |
|---------|-------|-------|-------|
| Treasury | `/admin/treasury` | ACCOUNTANT+ | console, recon, limits |
| Safety | `/admin/operator-tasks` | SUPER_ADMIN | flags visible |
| Legal | `/admin/legal` | COMPLIANCE | policies list |
| Withdrawals | `/admin/withdrawals` | ACCOUNTANT | tier approve in drawer |
| Compliance | `/admin/compliance` | COMPLIANCE | freeze user |
| Reports | `/admin/reports` | role-scoped | async job |

403: SUPPORT cannot approve withdrawal; BUSINESS_ANALYST cannot PATCH limits.

---

## Provider rehearsal (manual)

### TRON (staging mock)

```powershell
# Env: TRON_PROVIDER_MODE=mock, DEPOSIT_INGESTION_ENABLED=true
cd apps/backend
npm run test:e2e -- test/deposit-ingestion.e2e-spec.ts
```

**Production (credentials required — no mainnet send from CI):**

1. `GET /health/deep` + `HEALTH_DEEP_TOKEN`
2. `TRON_PROVIDER_URL` returns latest block
3. Testnet deposit to hot wallet (manual wallet app)
4. Ingestion logs — no duplicate credit

### Postmark

1. Staging: `EMAIL_PROVIDER=postmark` — verify + reset
2. Confirm tokens not in API logs

### Storage

1. Admin upload release cover
2. User receipt download — signed URL; 403 for other user

---

## Failure rehearsal (safe)

| Scenario | How | Expected |
|----------|-----|----------|
| Kill switch withdrawals | `KILL_SWITCH_DISABLE_WITHDRAWALS=true` | API blocked |
| Maintenance | `FEATURE_MAINTENANCE_MODE=true` | user message |
| User frozen | compliance freeze | trade/withdraw blocked |
| Report worker fail | stop worker | job FAILED + alert |
| Ledger discrepancy | treasury dry-run reconcile | CRITICAL alert |

Runbooks: [INCIDENT_RUNBOOKS.md](./INCIDENT_RUNBOOKS.md), [EMERGENCY_PAUSE_RUNBOOK.md](./EMERGENCY_PAUSE_RUNBOOK.md).

---

## P0 blockers

1. **54 migrations not applied** on target DB (`prisma migrate deploy`)
2. **Backend build fails** — 45 TypeScript errors
3. **Frontend build fails** — typecheck (partial fixes applied; not green)
4. **CI / e2e not green** on release branch
5. **Legal policy texts** — seed drafts; lawyer required before real money
6. **No production TRON withdrawal path** — complete requires tx hash or audited manual override
7. **Full money flow table** — 0/33 steps verified on staging

## P1 before public launch

- Playwright role matrix green
- Postmark production templates
- Treasury hot/cold + observed balance process
- KYC external provider (if policy requires)
- Staging money flow 33/33 ☑
- Fix remaining unit test failures (user-analytics, market-abuse)

## P2 polish

- Load testing catalog/market
- Rename `revshare-logo.tsx` → `spliton-logo.tsx`
- Runtime kill-switch API (env-only today)

---

## Launch day manual checklist

1. **T-24h:** CI green; staging table 100% ☑; sign-off SUPER_ADMIN + ACCOUNTANT + COMPLIANCE
2. **T-1h:** `migrate deploy` prod; kill switches OFF; backup verified
3. **T-0:** Deploy API + frontend; smoke `/health/ready`, staff login
4. **First deposit:** internal test user only; monitor ingestion 30 min
5. **First withdrawal:** small; ACCOUNTANT + COMPLIANCE; tx hash; treasury dry-run
6. **T+1h:** safety console green; no CRITICAL alerts

**Rollback:** previous artifact; `DEPOSIT_INGESTION_ENABLED=false`; forward-fix migrations only.

**Approvers:** SUPER_ADMIN (deploy), ACCOUNTANT (finance), COMPLIANCE (risk), legal counsel (policies).

**Emergency contacts:** _placeholder — ops on-call, compliance lead, infra lead_

**Logs:** API logs, Sentry, `GET /api/admin/v1/alerts`, treasury reconciliation runs.

---

## Related

- [STAGING_LIVE_CHECKLIST.md](./STAGING_LIVE_CHECKLIST.md)
- [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- [REAL_MONEY_OPERATIONS.md](./REAL_MONEY_OPERATIONS.md)
- [TESTING_OVERVIEW.md](../testing/TESTING_OVERVIEW.md)
