# Admin E2E Tests

## Automated (backend)

### `admin-access.e2e-spec.ts`

- Unauthenticated → 401  
- Holder roles → 403 on admin APIs  
- Staff roles → 200 on permitted endpoints  
- Dashboard, search, tracks access by role  
- Platform fees: SUPER_ADMIN vs ACCOUNTANT  

### `admin-analytics-access.e2e-spec.ts`

Paths tested (sample):

- `GET /api/admin/v1/analytics/overview`
- `GET /api/admin/v1/analytics/finance/summary`
- … users, tracks, market, revenue, risk, support summaries  
- `GET /api/admin/v1/dashboard/summary`, `/dashboard/trends`  
- Period > 366d → 400  
- BUSINESS_ANALYST: analytics 200, withdrawal approve 403  

### `withdrawal-ledger.e2e-spec.ts`

- User withdrawal create + lock  
- Admin approve / complete / reject  
- Balance invariants, double-complete 409  

Run:

```powershell
cd apps/backend
npm run test:e2e -- test/admin-analytics-access.e2e-spec.ts
```

## Manual UI checklist

| # | Scenario | Expected |
|---|----------|----------|
| 1 | No session `/admin` | → `/admin/login` |
| 2 | USER / INVESTOR / ARTIST | Access Denied |
| 3 | SUPER_ADMIN | Full nav |
| 4 | ACCOUNTANT | Finance sections |
| 5 | CONTENT_MANAGER | Tracks / rounds |
| 6 | SUPPORT_MANAGER | Users read-only, support |
| 7 | COMPLIANCE | Compliance + market |
| 8 | BUSINESS_ANALYST | Analytics + reports; no approve buttons |
| 9 | Forbidden direct URL | Denied / read-only |
| 10 | `ADMIN_DATA_SOURCE=live` | Real API (backend up) |

## Role matrix (nav)

| Role | Expected nav |
|------|----------------|
| SUPER_ADMIN | Full |
| ACCOUNTANT | Finance + reports |
| CONTENT_MANAGER | Tracks, rounds |
| SUPPORT_MANAGER | Users read, support |
| COMPLIANCE | Compliance, withdrawals, market |
| BUSINESS_ANALYST | Overview, analytics, reports |

Архив: `archive/reports/ADMIN_E2E_TEST_PLAN.md`, `ADMIN_BACKEND_TESTING.md`.
