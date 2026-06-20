# Staging seed data

Идемпотентный скрипт: `apps/backend/scripts/seed-staging-qa.ts`  
Запуск (staging `DATABASE_URL` в `.env`):

```powershell
npm run prisma:seed:staging-qa
```

После `prisma migrate deploy` (financial migrations) на staging:

```powershell
npm run finance:ownership-ledger:backfill -- --dry-run
# при необходимости:
npm run finance:ownership-ledger:backfill -- --apply
```

QA seed с 2026-06-05 также пишет `PRIMARY_BUY` в `ownership_ledger` для investor/seller holdings (payout cutoff).

Пароль задаётся через `STAGING_QA_PASSWORD` (не коммитить). Если не задан — используется документированный placeholder `StagingQa2026!` **только для первичной настройки**; смените в password manager перед manual QA.

> **Не дублирует** `prisma/seed.ts` (роли/SUPER_ADMIN) и `prisma/seed-catalog-demo.ts` (dev demo). QA seed — отдельные сущности с префиксом `spliton-staging-qa-*`.

## Seed entities

| Purpose | Entity type | ID / email | Expected state | Used by |
|---------|-------------|------------|----------------|---------|
| Primary buy smoke | Release | slug: `spliton-staging-qa-release` | `ACTIVE`, LIVE round, units available, visible in catalog API | Playwright buy, manual QA catalog/buy |
| Primary buy smoke | PrimaryRaiseRound | per release id | `LIVE`, `soldUnits` < `totalUnits` | Buy preview, `createPrimaryOrder` |
| Test investor | User | `staging.qa.investor@spliton.test` | `ACTIVE`, email verified, INVESTOR role, **no admin** | Playwright live login, manual buy/withdraw/secondary |
| Test investor wallet | Wallet + balance | per user | `500 USDT` available | Buy with balance, withdraw validation |
| Secondary seller | User | `staging.qa.seller@spliton.test` | `ACTIVE`, holdings on QA release | Secondary listing owner (not test investor) |
| Secondary fixture | UserPosition (seller) | seller + release | 30 units (5 locked in listing) | Create/buy listing QA |
| Secondary fixture | MarketListing | created by seed | `ACTIVE`, 5 units @ 12 USDT, seller ≠ investor | Secondary buy smoke, manual QA |
| Investor holdings | UserPosition (investor) | investor + release | 20 units available | Create listing (investor) |
| Withdraw smoke | Wallet balance | investor | ≥ min withdrawal + fee | Withdraw validation / manual request |
| Support staff | User | `staging.qa.support@spliton.test` | `SUPPORT_MANAGER` role | `/dashboard/support` staff flows |

## Playwright env (после seed)

Скрипт печатает `PLAYWRIGHT_BUY_RELEASE_ID`. Добавьте в CI/staging secrets:

```env
PLAYWRIGHT_BUY_RELEASE_ID=<uuid-from-seed-output>
PLAYWRIGHT_TEST_USER_EMAIL=staging.qa.investor@spliton.test
PLAYWRIGHT_TEST_USER_PASSWORD=<STAGING_QA_PASSWORD>
PLAYWRIGHT_API_BASE_URL=https://api.staging.spliton.example
PLAYWRIGHT_BASE_URL=https://staging.spliton.example
# Optional — mutates balance, staging-only:
PLAYWRIGHT_ENABLE_LIVE_PURCHASE=1
```

## Playwright skipped tests (12 без credentials)

| Block | Tests skipped | Env required | Production blocker |
|-------|---------------|--------------|-------------------|
| Buy flow live auth | 2 | `PLAYWRIGHT_TEST_USER_*`, `PLAYWRIGHT_BUY_RELEASE_ID` | yes (live purchase path) |
| Wallet live withdraw | 2 | `PLAYWRIGHT_TEST_USER_*` | yes (financial validation) |
| Secondary market live | 2 | `PLAYWRIGHT_TEST_USER_*` | yes (market KPI/listings) |
| Withdraw wizard (mock) | 1 | intentionally deferred to live block | no (covered by mock shell tests) |
| Secondary mock KPI optional | 1 | flaky mock JWT — unit tests cover KPI | no |
| Buy flow release id | up to 4 | `PLAYWRIGHT_BUY_RELEASE_ID` or catalog API | staging only |

**Staging:** run `npm run prisma:seed:staging-qa`, set secrets from `.env.staging.example`, then `pnpm run test:e2e:financial` in `apps/frontend`.

**Limited production:** live financial Playwright must pass at least once on staging before sign-off.

## Withdraw manual QA

| Item | Value |
|------|-------|
| Test user | `staging.qa.investor@spliton.test` |
| Withdrawable balance | ~500 USDT (seed) |
| TRC20 smoke address | `TStagingQaWithdrawSmokeAddr001` (34 chars, T-prefix) |
| Min withdrawal | `MIN_WITHDRAWAL_USDT` backend env (default 50) |
| Fee | `WITHDRAWAL_FEE_USDT` backend env |

Автоматический **valid withdraw request** не запускается в CI — создаёт `REQUESTED/PENDING` и блокирует баланс. См. manual checklist.

## Reset / disposable strategy

| Flow | Strategy |
|------|----------|
| Playwright live purchase | Controlled: `PLAYWRIGHT_ENABLE_LIVE_PURCHASE=1`, 1 unit, disposable investor |
| Secondary trade E2E | Manual QA или re-run seed (listing idempotent) |
| Withdraw request | Manual QA only |
| Backend e2e CI | Отдельный `TEST_DATABASE_URL`, не staging DB |

## Related

- [STAGING_ROLLOUT_READINESS_REPORT.md](./STAGING_ROLLOUT_READINESS_REPORT.md)
- [STAGING_KNOWN_ISSUES.md](./STAGING_KNOWN_ISSUES.md)
- [POST_STAGING_PRODUCTION_BLOCKERS.md](./POST_STAGING_PRODUCTION_BLOCKERS.md)
- [STAGING_ENV.md](./STAGING_ENV.md)
- [STAGING_MANUAL_QA.md](./STAGING_MANUAL_QA.md)
- [../operations/E2E_DATABASE.md](../operations/E2E_DATABASE.md)
