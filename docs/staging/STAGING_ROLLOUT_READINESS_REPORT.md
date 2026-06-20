# Spliton Staging Rollout Readiness Report

> **Updated:** 2026-06-05 — known issues зафиксированы; production **blocked**.

## 1. Decision

| Environment | Verdict |
| ----------- | ------- |
| **Staging** | ✅ **Allowed** — deploy + manual QA |
| **Production** | ❌ **Blocked** — см. [POST_STAGING_PRODUCTION_BLOCKERS.md](./POST_STAGING_PRODUCTION_BLOCKERS.md) |

---

## 2. Backend e2e (honest status)

| Scope | Status | Notes |
| ----- | ------ | ----- |
| `wallet-read` + `portfolio` | ✅ **5/5** | Fixed: `registerE2eUser()` (`acceptedTerms` + `acceptedPrivacy`) |
| Financial subset (14 files) | ⚠️ **50/58** | **8 known failures** — не «всё зелёное» |
| Register 400 / user null | ✅ Fixed | Root cause: missing legal consent fields in old register payloads |

### 8 known failures (classified)

| Count | Suite | Issue |
| ----- | ----- | ----- |
| 5 | `compliance-enforcement` | Withdraw → 500, invalid UUID in ledger |
| 1 | `ledger-reconciliation` | Flaky `systemAlert` on shared DB |
| 1 | `secondary-market-depth` | Empty price history |
| 1 | *(included in suites above)* | — |

Детали: [STAGING_KNOWN_ISSUES.md](./STAGING_KNOWN_ISSUES.md)

---

## 3. Staging decision

**Can deploy to staging:** **yes**

Условия:

- Live env (`NEXT_PUBLIC_*_DATA_SOURCE=live`) — [STAGING_ENV.md](./STAGING_ENV.md)
- `migrate deploy` + `npm run prisma:seed:staging-qa` — [STAGING_SEED.md](./STAGING_SEED.md)
- Manual QA по [STAGING_MANUAL_QA.md](./STAGING_MANUAL_QA.md)
- Known backend e2e gaps **документированы**, не скрыты

---

## 4. Production decision

**Production blocked until:**

1. **Compliance withdraw invalid UUID** fixed (`compliance-enforcement` 5 tests green)
2. **Dedicated `TEST_DATABASE_URL`** in backend CI + financial subset green (target 58/58)
3. **`ledger-reconciliation`** stabilized on isolated DB
4. **`secondary-market-depth`** price history seed or empty-state contract
5. **Full staging manual QA** sign-off (buy, withdraw, secondary, cookies, errors, mobile)

План: [POST_STAGING_PRODUCTION_BLOCKERS.md](./POST_STAGING_PRODUCTION_BLOCKERS.md)

---

## 5. Env readiness

См. [STAGING_ENV.md](./STAGING_ENV.md), `apps/frontend/.env.staging.example`

Build guard: staging/prod **fails** on any `*_DATA_SOURCE=mock`.

---

## 6. Seed data

См. [STAGING_SEED.md](./STAGING_SEED.md) — `npm run prisma:seed:staging-qa`

---

## 7. Playwright staging coverage

| Area | Local dev | Staging (with credentials) |
| ---- | --------- | --------------------------- |
| Route guard | ✅ 15/15 | ✅ |
| Financial smoke | ✅ 10 passed, 12 skipped | Live auth/buy/secondary when `PLAYWRIGHT_*` set |

---

## 8. Manual QA checklist

[STAGING_MANUAL_QA.md](./STAGING_MANUAL_QA.md)

---

## 9. Final answer

**Можно выкатывать на staging.**

Production — только после закрытия blockers в [POST_STAGING_PRODUCTION_BLOCKERS.md](./POST_STAGING_PRODUCTION_BLOCKERS.md) и manual QA sign-off.
