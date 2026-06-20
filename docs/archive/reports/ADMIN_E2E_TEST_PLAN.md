# Admin E2E Test Plan

## Automated (implemented)

`apps/backend/test/admin-access.e2e-spec.ts`

- Unauthenticated `GET /api/admin/v1/access` → 401
- Holder (INVESTOR/USER) `GET /api/admin/v1/users` → 403
- Staff (`SUPPORT_MANAGER`) `GET /api/admin/v1/access` → 200 `{ ok, version: 'v1' }`

Run: `cd apps/backend && npm run test:e2e -- test/admin-access.e2e-spec.ts`

## Manual checklist

| # | Scenario | Expected |
|---|----------|----------|
| 1 | No session `/admin` | Redirect `/admin/login` |
| 2 | USER / INVESTOR / ARTIST | Access Denied |
| 3 | SUPER_ADMIN | Full nav |
| 4 | ACCOUNTANT | Finance nav only |
| 5 | CONTENT_MANAGER | Tracks/Rounds nav |
| 6 | SUPPORT_MANAGER | Users read-only |
| 7 | COMPLIANCE | Compliance + risk nav |
| 8 | Direct URL forbidden section | Access Denied or read-only banner |
| 9 | `NEXT_PUBLIC_ADMIN_DATA_SOURCE=mock` | Mock tables load |
| 10 | `NEXT_PUBLIC_ADMIN_DATA_SOURCE=live` | Live API (backend running) |

## Frontend E2E (not implemented)

Playwright/Cypress is not in the repo yet. Use manual checklist above.

### Role matrix (manual)

| Role | Expected nav |
|------|----------------|
| SUPER_ADMIN | Full operator nav |
| ACCOUNTANT | Finance: wallets, deposits, withdrawals, revenue, platform-revenue |
| CONTENT_MANAGER | Tracks, rounds only |
| SUPPORT_MANAGER | Users read-only, support |
| COMPLIANCE | Compliance, secondary-market actions |
| USER / INVESTOR / ARTIST | Access Denied on `/admin` |

Direct URL to forbidden section → Access Denied or read-only banner; API returns 403.
