# Spliton Staging Execution Report

> **Scope:** Local playbook rehearsal against configured `DATABASE_URL` (Supabase pooler).  
> **Not deployed** to staging frontend/API hostnames. Manual QA on staging URLs **pending**.

## 1. Deploy info

| Field | Value |
|-------|-------|
| Date (UTC) | 2026-06-05 |
| Git commit | `774c7a2` |
| Backend image/tag | local build (`apps/backend`, nest build) |
| Frontend image/tag | local build (`apps/frontend`, Next.js 16.2.4) |
| Executor | Cursor agent (automated rehearsal) |

### DB migration status

| Migration | Applied (Y/N) | Notes |
|-----------|---------------|-------|
| `20260605140000_earning_period_holder_snapshots` | Y | schema up to date |
| `20260605150000_ownership_ledger_legacy_backfill_enum` | Y | schema up to date |
| `20260605160000_ownership_ledger_backfill_batch_id` | Y | schema up to date |

`prisma migrate deploy`: **No pending migrations** (61 total).

---

## 2. Env verification

> Local rehearsal env — **not** staging hostnames. Secrets not printed.

| Variable | Set (Y/N) | Value / note |
|----------|-----------|--------------|
| `NEXT_PUBLIC_APP_ENV` | Y | `development` (local `.env.local`) — staging deploy must use `staging` |
| `NEXT_PUBLIC_API_BASE_URL` | Y | `http://localhost:4000` |
| `NEXT_PUBLIC_WALLET_DATA_SOURCE` | Y | `live` |
| `NEXT_PUBLIC_CATALOG_DATA_SOURCE` | Y | `live` |
| `NEXT_PUBLIC_ADMIN_DATA_SOURCE` | Y | `live` |
| `NEXT_PUBLIC_SUPPORT_DATA_SOURCE` | Y | `live` |
| `NEXT_PUBLIC_NEWS_DATA_SOURCE` | Y | `live` |
| `NEXT_PUBLIC_STATUS_DATA_SOURCE` | Y | `live` |
| `FRONTEND_ORIGIN` | Y | `http://localhost:3000` |
| `AUTH_COOKIE_SECURE` | Y | `false` (local) — staging must be `true` |
| `AUTH_COOKIE_DOMAIN` | Y | empty (local) — set parent domain on staging |
| `DATABASE_URL` (staging) | Y | configured (Supabase pooler), not printed |
| `DIRECT_URL` | Y | configured, not printed |

CORS / cookies manual test: **Not performed** — requires staging HTTPS domains.

---

## 3. Migration result

```text
Command:
npx prisma migrate deploy --schema prisma/schema.prisma

Result:
61 migrations found. No pending migrations to apply.
Database schema is up to date.
```

Applied migrations list: all 61 including financial fixes above.

Issues: none.

---

## 4. Backfill result

### Dry-run (before apply)

```text
Command:
npx tsx scripts/finance/backfill-ownership-ledger.ts --dry-run

Positions missing: 53
Users: 53
Releases: 53
@example.com count: 53 (all candidates are e2e junk)

Command (staging filter):
npx tsx scripts/finance/backfill-ownership-ledger.ts --dry-run --exclude-email-pattern=@example.com

Positions missing: 0
Users: 0
Releases: 0
Approved earning periods without holder snapshot: 0 / 3
```

**Decision:** No real missing holders after `@example.com` exclude → **apply not run**.

Note: `npm run finance:ownership-ledger:backfill -- --dry-run` does not forward args on Windows PowerShell; use `npx tsx` directly or fix npm invocation.

### Apply

| Field | Value |
|-------|-------|
| Apply run? | **No** |
| Reason if No | 0 real holders after `--exclude-email-pattern=@example.com` |
| batchId | — |
| exclude filter | `@example.com` (recommended on staging) |
| Rows created | 0 |

### Dry-run (after apply)

```text
Positions missing: 0 (with exclude filter)
```

### Risks noted

- 53 e2e `@example.com` positions still lack ledger rows; harmless for staging QA if excluded from backfill.
- On production, run dry-run without exclude first and review real holders before apply.

---

## 5. Automated checks

| Suite | Command | Result |
|-------|---------|--------|
| Backend build | `npm run build` (apps/backend) | ✅ PASS |
| Frontend typecheck | `pnpm run typecheck:all` | ✅ PASS (after `.next/dev` fix) |
| Frontend unit | `pnpm run test:unit` | ✅ 59/59 |
| Frontend i18n | `pnpm run test:unit:i18n` | ✅ 3 checks |
| Frontend build | `pnpm run build` | ✅ PASS |
| Playwright route-guard | `pnpm run test:e2e:route-guard` | ✅ 15/15 |
| Playwright financial | `pnpm run test:e2e:financial` | ✅ 10 passed, **12 skipped** (no `PLAYWRIGHT_TEST_USER_*` / live purchase flags) |
| Staging QA seed | `npm run prisma:seed:staging-qa` | ✅ idempotent |

### Typecheck fix (pre-rollout)

- Removed reliance on corrupt `.next/dev/types/validator.ts`:
  - `tsconfig.json`: exclude `.next/dev`; drop dev types from intentional include
  - `pretypecheck`: `scripts/clean-next-dev-types.cjs` removes `.next/dev` before `tsc`

---

## 6. Manual QA

Reference: [STAGING_MANUAL_QA.md](./STAGING_MANUAL_QA.md)

| Section | Pass (Y/N) | Tester | Notes |
|---------|------------|--------|-------|
| Auth | **N** | — | Not run on staging URLs |
| Catalog / buy | **N** | — | Playwright live buy skipped (no creds) |
| Wallet / withdraw | **N** | — | Live withdraw validation skipped |
| Secondary | **N** | — | Live secondary smoke skipped |
| Payouts §10 financial correctness | **N** | — | Requires staging manual pass |
| Admin cancel §11 | **N** | — | Requires admin session on staging |
| Price history §12 | **N** | — | Requires 2 trades on staging |
| Support | **N** | — | — |
| Mobile ~390px | **N** | — | — |
| Cookies/domains (login, refresh, `?next=`) | **N** | — | Local dev cookies only |
| Live env (no mock fallback / demo KPI) | **Partial** | agent | Unit tests confirm live policy; staging host not verified |

---

## 7. Bugs found

| Severity | Route | Steps | Expected | Actual | Owner |
|----------|-------|-------|----------|--------|-------|
| P3 | tooling | `npm run finance:ownership-ledger:backfill -- --dry-run` on Windows | Args forwarded to script | Usage error, no mode flag | backend |
| P3 | tooling | `next build` | Stable tsconfig | Re-adds `.next/dev/types` to include | frontend |
| — | process | Staging rollout | Deploy + manual QA on staging host | Only local rehearsal completed | ops |

No application regressions found in automated suites.

---

## 8. Go/no-go decision

| Decision | Yes / No |
|----------|----------|
| **Staging accepted** | **No** |
| **Production candidate** | **No** |

**Decision:** **Staging failed / incomplete — blockers found** for sign-off (automated rehearsal passed locally).

Blockers:

1. **Manual QA not signed** on staging URLs ([STAGING_MANUAL_QA.md](./STAGING_MANUAL_QA.md) §10–12).
2. **No deploy** to staging frontend/API hostnames with staging env (`NEXT_PUBLIC_APP_ENV=staging`, `AUTH_COOKIE_SECURE=true`, cookie domain).
3. **Playwright live auth** skipped — set `PLAYWRIGHT_TEST_USER_EMAIL`, `PLAYWRIGHT_TEST_USER_PASSWORD`, optional `PLAYWRIGHT_ENABLE_LIVE_PURCHASE=1`.
4. **Production** remains blocked until prod playbook after staging sign-off.

Approvers:

| Role | Name | Date |
|------|------|------|
| QA | — | pending |
| Backend | — | pending |
| Product | — | pending |
