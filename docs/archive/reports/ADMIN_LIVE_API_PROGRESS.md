# Admin Live API Progress

**Phase 2026-05-31:** Operator portal foundation — search, dashboard, tracks/rounds, support, compliance, roles, platform revenue UI.

**Phase 2026-05-31 (analytics production):** Analytics layer, BUSINESS_ANALYST, async reports, indexes, platform revenue charts, roles live, SUPER_ADMIN double-confirm.

| Module | Mock | Live API | Frontend Live | Permissions | Audit | Ledger | Tests | Status | Notes |
|--------|------|----------|---------------|-------------|-------|--------|-------|--------|-------|
| Access | ✓ | ✓ | ✓ | Staff | — | — | e2e | Done | |
| **Analytics** | — | ✓ | ✓ | Area matrix | — | — | e2e | **Live** | `/api/admin/v1/analytics/*`, period max 366d |
| **Global Search** | ✓ | ✓ | ✓ | Role-filtered | — | — | e2e | **Live** | `GET /api/admin/v1/search` |
| **Dashboard** | ✓ | ✓ | ✓ | Staff matrix | — | — | e2e | **Live** | summary/tasks/alerts/recent/trends |
| Users | ✓ | ✓ | ✓ | Matrix | ✓ | — | e2e | Done | Role assign SUPER_ADMIN confirm |
| Wallets | ✓ | ✓ | ✓ | Matrix | — | ✓ read | — | Done | |
| Deposits | ✓ | ✓ | ✓ | Matrix | ✓ | ✓ settle | — | Done | |
| Withdrawals | ✓ | ✓ | ✓ | Matrix | ✓ | ✓ settle | e2e | Done | |
| Holdings | ✓ | ✓ | ✓ | Matrix | — | — | — | Live | |
| Revenue | ✓ | ✓ | ✓ | Accountant | ✓ | ✓ run | — | Live UI | |
| Secondary Market | ✓ | ✓ | ✓ | Compliance+ | ✓ | — | — | Live UI | |
| **Platform Revenue** | ✓ | ✓ | ✓ | Accountant read | — | — | — | **Live UI** | summary/by-period/transactions |
| Platform Fees | ✓ | ✓ persist | ✓ settings | SUPER_ADMIN | ✓ | — | e2e | Done | |
| Reports | ✓ | ✓ async jobs | ✓ | Finance+BA read | ✓ | — | — | **Live** | 12 CSV types, poll queued |
| **Tracks** | ✓ | ✓ | ✓ | CONTENT_MANAGER | ✓ | — | e2e | **Live** | Release model + CRUD |
| **Rounds** | ✓ | ✓ | ✓ | CONTENT_MANAGER | ✓ | — | e2e | **Live** | `primary_raise_rounds` |
| **Support** | ✓ | ✓ | ✓ | SUPPORT_MANAGER | ✓ | — | — | **Live** | `support_tickets` + notes |
| **Compliance** | ✓ | ✓ | ✓ | COMPLIANCE | ✓ | — | — | **Live** | RiskFlag + freezes |
| **Roles** | ✓ | ✓ | ✓ live list | SUPER_ADMIN | ✓ assign | — | e2e | **Live** | SUPER_ADMIN phrase confirm |
| Settings | ✓ | ✓ fees | ✓ | SUPER_ADMIN | ✓ | — | — | Partial | Other tabs mock |
| Audit Log | ✓ | ✓ | ✓ | Staff read | — | — | — | Done | client wired |

## Migrations

- `20260531120000_financial_status_enums`
- `20260531180000_platform_fees_and_report_jobs`
- **`20260531190000_admin_portal_foundation`** — tracks metadata, rounds, support, compliance extensions
- **`20260531200000_business_analyst_role_enum`** + **`20260531200001_business_analyst_role_data`**
- **`20260531210000_analytics_indexes`** — wallet_transactions, deposits, withdrawals, fees

Deploy: `npx prisma migrate deploy` (no reset). Windows: см. `PRISMA_WINDOWS_EPERM.md`

## Env

```
NEXT_PUBLIC_ADMIN_DATA_SOURCE=live
NEXT_PUBLIC_WALLET_DATA_SOURCE=live
```

## E2E

- `test/admin-access.e2e-spec.ts` — role matrix + dashboard/search/tracks
- `test/admin-analytics-access.e2e-spec.ts` — analytics areas, BUSINESS_ANALYST read-only, period guard
- `test/withdrawal-ledger.e2e-spec.ts` — ledger flow
- Playwright UI matrix: **not installed** — manual QA in `ADMIN_PLAYWRIGHT_ROLE_MATRIX.md`

## Docs

- `ADMIN_GLOBAL_SEARCH.md`
- `ADMIN_DASHBOARD_LIVE.md`
- `BUSINESS_ANALYST_ACCESS_MATRIX.md`
- `ANALYTICS_EXPORTS_FLOW.md`
- `ANALYTICS_INDEX_AUDIT.md`
- `ANALYTICS_PERFORMANCE_PLAN.md`
- `PRISMA_WINDOWS_EPERM.md`
