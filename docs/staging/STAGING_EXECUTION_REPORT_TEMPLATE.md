# Spliton Staging Execution Report

> Copy this file per rollout: `STAGING_EXECUTION_REPORT_YYYY-MM-DD.md`

## 1. Deploy info

| Field | Value |
|-------|-------|
| Date (UTC) | |
| Git commit | |
| Backend image/tag | |
| Frontend image/tag | |
| Executor | |

### DB migration status

| Migration | Applied (Y/N) | Notes |
|-----------|---------------|-------|
| `20260605140000_earning_period_holder_snapshots` | | |
| `20260605150000_ownership_ledger_legacy_backfill_enum` | | |
| `20260605160000_ownership_ledger_backfill_batch_id` | | |

---

## 2. Env verification

> **No secrets** — names and non-sensitive values only.

| Variable | Set (Y/N) | Value / note |
|----------|-----------|--------------|
| `NEXT_PUBLIC_APP_ENV` | | `staging` |
| `NEXT_PUBLIC_API_BASE_URL` | | |
| `NEXT_PUBLIC_WALLET_DATA_SOURCE` | | `live` |
| `NEXT_PUBLIC_CATALOG_DATA_SOURCE` | | `live` |
| `FRONTEND_ORIGIN` | | |
| `AUTH_COOKIE_SECURE` | | `true` |
| `AUTH_COOKIE_DOMAIN` | | |
| `DATABASE_URL` (staging) | | configured, not printed |
| `DIRECT_URL` | | configured, not printed |

CORS / cookies manual test: Pass / Fail — notes:

---

## 3. Migration result

```text
Command:
npx prisma migrate deploy --schema prisma/schema.prisma

Result:
```

Applied migrations list:

---

## 4. Backfill result

### Dry-run (before apply)

```text
Command:
npm run finance:ownership-ledger:backfill -- --dry-run [--exclude-email-pattern=...]

Positions missing:
Users:
Releases:
@example.com count:
```

### Apply

| Field | Value |
|-------|-------|
| Apply run? | Yes / No |
| Reason if No | |
| batchId | |
| exclude filter | |
| Rows created | |

### Dry-run (after apply)

```text
Positions missing:
```

### Risks noted

---

## 5. Automated checks

| Suite | Command | Result |
|-------|---------|--------|
| Backend build | `npm run build` (apps/backend) | |
| Frontend typecheck | `pnpm run typecheck:all` | |
| Frontend unit | `pnpm run test:unit` | |
| Frontend i18n | `pnpm run test:unit:i18n` | |
| Frontend build | `pnpm run build` | |
| Playwright route-guard | `pnpm run test:e2e:route-guard` | |
| Playwright financial | `pnpm run test:e2e:financial` | |

---

## 6. Manual QA

Reference: [STAGING_MANUAL_QA.md](./STAGING_MANUAL_QA.md)

| Section | Pass (Y/N) | Tester | Notes |
|---------|------------|--------|-------|
| Auth | | | |
| Catalog / buy | | | |
| Wallet / withdraw | | | |
| Secondary | | | |
| Payouts §10 financial correctness | | | |
| Admin cancel §11 | | | |
| Price history §12 | | | |
| Support | | | |
| Mobile ~390px | | | |

---

## 7. Bugs found

| Severity | Route | Steps | Expected | Actual | Owner |
|----------|-------|-------|----------|--------|-------|
| | | | | | |

---

## 8. Go/no-go decision

| Decision | Yes / No |
|----------|----------|
| **Staging accepted** | |
| **Production candidate** | |

Blockers (if any):

Approvers:

| Role | Name | Date |
|------|------|------|
| QA | | |
| Backend | | |
| Product | | |
