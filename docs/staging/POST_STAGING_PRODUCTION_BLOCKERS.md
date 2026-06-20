# Post-staging production blockers

> Отдельный тикет-план после staging rollout. Staging deploy **разрешён** с known issues. Production — **заблокирован** до закрытия P0/P1 ниже.

См. также: [STAGING_KNOWN_ISSUES.md](./STAGING_KNOWN_ISSUES.md)

---

## P0 — before production decision

### 1. Fix `compliance-enforcement` invalid UUID / withdraw 500

- **Symptoms:** withdraw → 500, `invalid UUID in ledger` (`sourceEntityId`)
- **Acceptance:**
  - Controlled API error (4xx + RU message), never 500 on valid-shaped bad input
  - `compliance-enforcement.e2e-spec.ts` — 5/5 green on dedicated test DB
- **Files to inspect:** `user-withdrawals.service.ts`, `ledger-posting.service.ts`, withdrawal create path

### 2. Dedicated `TEST_DATABASE_URL` for backend CI

- **Symptoms:** flaky e2e on shared dev DB (`systemAlert`, FK cleanup, register collisions)
- **Acceptance:**
  - GitHub Actions: `BACKEND_E2E_TEST_DATABASE_URL` + `test:db:setup` before `backend:test:e2e`
  - Financial subset ≥ 58/58 green in CI (or documented skip only for non-financial specs)
- **Docs:** [E2E_DATABASE.md](../operations/E2E_DATABASE.md)

### 3. Stabilize `ledger-reconciliation`

- **Symptoms:** 1 flaky test — `systemAlert.create` empty engine response
- **Acceptance:** 4/4 green in CI on isolated DB; no shared-DB dependency

---

## P1 — before production decision

### 4. Fix/seed `secondary-market-depth` price history

- **Symptoms:** price history returns 0 points
- **Acceptance:** e2e seed creates trades/price rows OR test asserts empty state + staging UI verified

### 5. Full staging manual QA (sign-off required)

Чеклист: [STAGING_MANUAL_QA.md](./STAGING_MANUAL_QA.md)

Обязательные сценарии:

| Scenario | Why |
| -------- | --- |
| Real buy with balance | Primary money path |
| Real withdraw request | REQUESTED/PENDING, locked balance — не автоматизировано в CI |
| Secondary create / buy / cancel | Secondary money path |
| Cookies / domains (frontend + API) | Auth refresh cross-subdomain |
| Live API errors | No raw English, no undefined/NaN |

**Production gate:** все критичные строки ☑ в manual QA + automated CI green for financial e2e.

---

## Staging vs production summary

| Gate | Staging | Production |
| ---- | ------- | ---------- |
| `wallet-read` + `portfolio` e2e | ✅ 5/5 | Required green in CI |
| Financial subset | ⚠️ 50/58 known | **58/58** or explicit waiver with sign-off |
| Manual QA | In progress after deploy | **Complete** |
| Compliance withdraw 500 | Known issue | **Fixed** |
| Isolated test DB | Recommended | **Required** |

---

## Suggested execution order

1. Deploy staging + `prisma:seed:staging-qa`
2. Run [STAGING_MANUAL_QA.md](./STAGING_MANUAL_QA.md)
3. Fix P0 #1 (compliance UUID) + P0 #2 (CI test DB) in parallel
4. P0 #3 + P1 #4 (e2e stability)
5. Re-run full financial e2e in CI → production go/no-go
