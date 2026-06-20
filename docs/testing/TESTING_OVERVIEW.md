# Testing Overview

## Backend unit / integration

```powershell
cd apps/backend
npm run test
npm run lint:ci
npm run build
```

From monorepo root: `npm run ci:backend` (generate + lint + build + unit tests).

### Platform engineering (idempotency, feature flags, outbox)

- Unit: `src/common/platform/idempotency/idempotency.service.spec.ts`
- Unit: `src/common/platform/feature-flags/feature-flags.service.spec.ts`
- Migration: `20260620120000_platform_engineering` (`idempotency_records`, `event_outbox`)
- Apply on e2e DB: `npm run test:db:setup`

### Treasury / real-money controls

- Unit: `src/modules/treasury/treasury-withdrawal.spec.ts` (approval tiers, provider lifecycle)
- Unit: `src/modules/treasury/treasury-kill-switches.spec.ts`
- Unit: `src/modules/treasury/treasury-reconciliation.service.spec.ts`
- Unit: `src/modules/treasury/deposit-network-settings.service.spec.ts`
- Unit: `src/modules/treasury/deposit-address-pool.service.spec.ts` (invalid TRON address, reason on disable)
- Unit: `src/modules/wallets/user-deposits.service.spec.ts` (QR payload = address, `DEPOSIT_DISABLED`)
- Targeted deposit: `npm test -- src/modules/wallets/user-deposits.service.spec.ts src/modules/treasury/deposit-network-settings.service.spec.ts src/modules/treasury/deposit-address-pool.service.spec.ts`

### Referral & partner program

- Unit: `src/modules/referrals/referrals.service.spec.ts` (self-referral, duplicate, partner code)
- Unit: `src/modules/referrals/referral-rewards.service.spec.ts` (attribution, suspended partner)
- Migration: `20260603140000_referral_partner_program`
- Targeted: `npm test -- src/modules/referrals/referrals.service.spec.ts src/modules/referrals/referral-rewards.service.spec.ts src/modules/referrals/referral-code.util.spec.ts`

### User navigation closeout

- Vitest: `apps/frontend/constants/routes.navigation.spec.ts` (nav dropdown hrefs + page.tsx existence)
- Manual: all mega-menu links, header balance in live, guest vs auth profile dropdown
- Migration: `20260622120000_treasury_operations_foundation`
- Targeted: `npm test -- --testPathPattern="treasury|withdrawal-approval|kill-switch"`

## Launch rehearsal (prompt 36)

Full GO/NO-GO matrix and 33-step money flow: [LAUNCH_REHEARSAL_GO_NO_GO.md](../operations/LAUNCH_REHEARSAL_GO_NO_GO.md).

Finance-critical unit tests (no DB):

```powershell
cd apps/backend
npm test -- src/modules/treasury/treasury-withdrawal.spec.ts src/modules/treasury/treasury-kill-switches.spec.ts src/modules/legal/legal-consents.service.spec.ts src/modules/compliance/eligibility.service.spec.ts
```

Expected: 14 passed (verified 2026-06-03).

### I18N / UX closeout (prompt 37)

- Unit: `apps/frontend/lib/i18n/format-api-error.spec.ts` (run via frontend jest if configured)
- Unit: `apps/backend/src/modules/announcements/system-announcements.util.spec.ts`
- Unit: `apps/backend/src/common/platform/feature-flags/feature-flags.service.spec.ts`
- E2E: `test/public-system-status.e2e-spec.ts`, `test/admin-system-status.e2e-spec.ts`
- Manual: language selector RU/EN/KA; publish maintenance announcement; verify banner on `/catalog`

### Legal / compliance / eligibility

- Unit: `src/modules/legal/legal-consent-requirements.spec.ts`
- Unit: `src/modules/legal/legal-consents.service.spec.ts`
- Unit: `src/modules/compliance/eligibility.service.spec.ts`
- Migration: `20260621140000_legal_compliance_foundation`
- Targeted: `npm test -- --testPathPattern="eligibility|legal|consent|kyc"`

### Observability

- Unit: `src/common/observability/log-sanitizer.spec.ts`
- E2e: `test/health-observability.e2e-spec.ts` — `/health/live`, `/health/ready`, `/health/deep`
- Full alert/incident RBAC e2e requires migrated DB with `system_alerts` (`npm run test:db:setup`)

## Isolated test database (`TEST_DATABASE_URL`)

E2E creates real rows. Use a **dedicated** Postgres / Supabase project — not production or shared staging.

| Variable | Purpose |
|----------|---------|
| `TEST_DATABASE_URL` | Jest + scripts; mapped to `DATABASE_URL` in `jest-e2e.setup.ts` |
| `TEST_DIRECT_URL` | `prisma migrate deploy` for e2e project |
| `ALLOW_E2E_CLEANUP` | Override cleanup guard (dedicated DB only) |

### Setup flow

```powershell
# From repo root (.env with TEST_DATABASE_URL)
npm run test:db:setup          # migrate deploy
npm run test:db:setup:seed     # migrate + role seed
npm run test:db:check          # connectivity
npm run test:db:drift-check    # ledger, deposits, compliance, etc.
npm run db:constraint-prechecks
npm run test:db:cleanup        # delete *@example.com (guarded)
```

Full guide: [E2E_DATABASE.md](../operations/E2E_DATABASE.md)

### Finance-critical e2e subset

Run after `test:db:setup` + `test:db:drift-check` green:

```powershell
cd apps/backend
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

Full suite: `npm run ci:e2e` from repo root.

### Cleanup safety

Jest global teardown and `test:db:cleanup` delete only `*@example.com`. Both refuse staging/production URLs unless `ALLOW_E2E_CLEANUP=1`.

Unique data: `apps/backend/test/helpers/e2e-unique.ts`.

## Backend E2E (security subset)

```powershell
cd apps/backend
npm run test:e2e -- test/admin-rbac-hardening.e2e-spec.ts test/admin-access.e2e-spec.ts test/admin-role-mutations.e2e-spec.ts test/compliance-enforcement.e2e-spec.ts test/admin-reports.e2e-spec.ts test/withdrawal-ledger.e2e-spec.ts test/password-reset.e2e-spec.ts
```

See [SECURITY_CHECKLIST.md](../operations/SECURITY_CHECKLIST.md).

## Backend E2E (all specs)

```powershell
cd apps/backend
npm run test:e2e
npm run test:e2e -- test/admin-access.e2e-spec.ts
```

| Spec | Covers |
|------|--------|
| `wallet-read.e2e-spec.ts` | User wallet summary, transactions |
| `withdrawal-ledger.e2e-spec.ts` | User lock, admin settle, ledger |
| `ledger-reconciliation.e2e-spec.ts` | Admin reconciliation dry-run |
| `deposit-ingestion.e2e-spec.ts` | Mock provider, CREDITED status |
| `primary-order.e2e-spec.ts` | Primary buy, idempotency, oversell |
| `secondary-market*.e2e-spec.ts` | Listings, trades, depth |
| `admin-revenue-distribution.e2e-spec.ts` | Revenue lifecycle + ledger |
| `compliance-enforcement.e2e-spec.ts` | Freeze blocks trade/withdraw |

## Frontend

```powershell
cd apps/frontend
npm run build
npm run test:e2e          # Playwright: smoke + admin role matrix
```

See [PLAYWRIGHT_ROLE_MATRIX.md](./PLAYWRIGHT_ROLE_MATRIX.md).

## CI

Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

- Prisma validate + migrate diff
- Backend lint, build, unit tests
- Frontend production-like build
- Backend e2e when `TEST_DATABASE_URL` / CI secrets configured
- Playwright (mocked admin API on PR)

Local CI subset:

```powershell
npm run prisma:validate
npm run prisma:migrate:diff
npm run ci:backend
npm run ci:frontend
```

## Related

- [E2E_DATABASE.md](../operations/E2E_DATABASE.md)  
- [STAGING_LIVE_CHECKLIST.md](../operations/STAGING_LIVE_CHECKLIST.md)  
- [LAUNCH_REHEARSAL_GO_NO_GO.md](../operations/LAUNCH_REHEARSAL_GO_NO_GO.md)  
- [ADMIN_E2E_TESTS.md](./ADMIN_E2E_TESTS.md)

## Final launch rehearsal (prompt 36)

Before production / real money:

```powershell
npm run prisma:generate
npm run test:db:setup
npm run test:db:drift-check
npm run db:constraint-prechecks
npm run ci:backend
npm run ci:frontend
npm run ci:e2e
cd apps/frontend && npm run test:e2e
```

Record results in [LAUNCH_REHEARSAL_GO_NO_GO.md](../operations/LAUNCH_REHEARSAL_GO_NO_GO.md).  
**Do not claim GO** until API boots and finance e2e subset is green on dedicated DB.
