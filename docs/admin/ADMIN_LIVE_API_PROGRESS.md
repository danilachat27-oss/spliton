# Admin Live API Progress

**Phase 2026-05-31:** Operator portal foundation — search, dashboard, tracks/rounds, support, compliance, roles, platform revenue UI.

**Track analytics (2026-05-31):** `/admin/analytics/tracks` — expanded `tracks/summary`, `round-progress`, `revenue`, `holders`, `secondary-activity`; new `units`, `readiness`, `top`. Frontend Track & Round Intelligence dashboard + mock `admin-analytics-tracks.mock.ts`.

**Market analytics (2026-05-31):** `/admin/analytics/market` — expanded summary/volume/listings/trades/top-users/fees; new `depth`, `liquidity`, `prices`, `risk`. Frontend Secondary Market Intelligence + `admin-analytics-market.mock.ts`.

**Revenue analytics (2026-05-31):** `/admin/analytics/revenue` — expanded summary/events/distributions/by-track/payouts; new `pipeline`, `split`, `top-holders`, `failed`, `reconciliation`. Frontend Revenue Distribution Intelligence + `admin-analytics-revenue.mock.ts`.

**Risk analytics (2026-05-31):** `/admin/analytics/risk` — expanded `risk/summary`, `by-severity` (+ trend/status), `by-type` (+ byRule), `queue-aging`, `high-value-operations`; new `queue`, `rules-performance`, `repeat-offenders`, `freeze-impact`, `resolution-quality`. Frontend Risk Intelligence Dashboard + `admin-analytics-risk.mock.ts`. E2E: `admin-analytics-access.e2e-spec.ts` (COMPLIANCE risk paths).

**Operations analytics (2026-05-31):** `/admin/analytics/operations` — expanded `support/summary`, `by-status`, `by-category`, `response-time`; new `queue`, `sla`, `finance-related`, `escalations`, `workload`, `resolution-quality`, `product-pain-points`. Frontend Operations Intelligence + `admin-analytics-support.mock.ts`. E2E: SUPPORT_MANAGER support paths.

**Phase 2026-05-31 (analytics production):** Analytics layer, BUSINESS_ANALYST, async reports, indexes, platform revenue charts, roles live, SUPER_ADMIN double-confirm.

**Phase 2026-05-31 (general analytics UX):** `/admin/analytics` executive dashboard — KPI groups, insights panel, chart empty states, nav cards, mock trends in mock mode. Doc: [ANALYTICS_DASHBOARDS.md](../analytics/ANALYTICS_DASHBOARDS.md#general-analytics-dashboard-ux-adminanalytics).

| Module | Mock | Live API | Frontend Live | Permissions | Audit | Ledger | Tests | Status | Notes |
|--------|------|----------|---------------|-------------|-------|--------|-------|--------|-------|
| Access | ✓ | ✓ | ✓ | Staff | — | — | e2e | Done | |
| **Analytics** | — | ✓ | ✓ | Area matrix | — | — | e2e | **Live** | `/api/admin/v1/analytics/*`, period max 366d |
| **Global Search** | ✓ | ✓ | ✓ | Role-filtered | — | — | e2e | **Live** | `GET /api/admin/v1/search` |
| **Dashboard** | ✓ | ✓ | ✓ | Staff matrix | — | — | e2e | **Live** | summary/tasks/alerts/recent/trends |
| Users | ✓ | ✓ | ✓ | Matrix | ✓ | — | e2e | Done | List KPI, `/admin/users/[id]` tabs (wallet/audit/support/compliance) |
| Wallets | ✓ | ✓ | ✓ | Matrix | — | ✓ read detail | e2e | **Live UI** | KPI summary, tabbed drawer, `?include=` |
| Deposits | ✓ | ✓ | ✓ | Matrix | ✓ | ✓ settle | e2e | **Live UI** | KPI summary, filters, tabbed drawer, `?include=` |
| Withdrawals | ✓ | ✓ | ✓ | Matrix | ✓ | ✓ settle | e2e | **Live UI** | KPI summary, filters, tabbed drawer, `?include=` |
| Holdings | ✓ | ✓ | ✓ | Matrix | — | ✓ read detail | e2e | **Live UI** | KPI summary, filters, tabbed drawer, `?include=` |
| Revenue | ✓ | ✓ | ✓ | Matrix | ✓ | ✓ run | e2e | **Live UI** | KPI summary, filters, tabbed drawer, create flow, `?include=` |
| Secondary Market | ✓ | ✓ | ✓ | Compliance+ | ✓ | — | — | Live UI | |
| **Platform Revenue** | ✓ | ✓ | ✓ | Matrix | ✓ fees | — | e2e | **Live UI** | 8 tabs, color charts, drawer, by-release |
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
- `20260531190000_admin_portal_foundation`
- `20260531200000_business_analyst_role_enum` + `20260531200001_business_analyst_role_data`
- `20260531210000_analytics_indexes`

Deploy: `npx prisma migrate deploy` (no reset). Windows: [Prisma EPERM](../operations/PRISMA_WINDOWS_EPERM.md)

## Env

```
NEXT_PUBLIC_ADMIN_DATA_SOURCE=live
NEXT_PUBLIC_WALLET_DATA_SOURCE=live
```

## Frontend (2026-05-31 live audit)

- Catalog: `GET /releases` when wallet live — [FRONTEND_LIVE_AUDIT.md](../frontend/FRONTEND_LIVE_AUDIT.md)
- User wallet / orders / market: `wallet.service.ts`
- Admin: all section services use `getAdminDataSource() === 'live'` + `AdminApiClient`

## E2E

- `apps/backend/test/admin-access.e2e-spec.ts`
- `apps/backend/test/admin-holdings.e2e-spec.ts`
- `apps/backend/test/admin-wallets.e2e-spec.ts`
- `apps/backend/test/admin-analytics-access.e2e-spec.ts`
- `apps/backend/test/withdrawal-ledger.e2e-spec.ts`
- `apps/backend/test/admin-revenue-distribution.e2e-spec.ts`
- `apps/backend/test/admin-platform-revenue.e2e-spec.ts`
- Playwright: [PLAYWRIGHT_ROLE_MATRIX.md](../testing/PLAYWRIGHT_ROLE_MATRIX.md) (not installed)

## Related docs

- [Holdings admin flow](./HOLDINGS_ADMIN_FLOW.md)
- [Wallets admin flow](./WALLETS_ADMIN_FLOW.md)
- [Revenue admin flow](./REVENUE_ADMIN_FLOW.md)
- [Platform revenue admin flow](./PLATFORM_REVENUE_ADMIN_FLOW.md)
- [Global search (archive)](../archive/reports/ADMIN_GLOBAL_SEARCH.md)
- [Analytics](../analytics/ANALYTICS_OVERVIEW.md)
- [Business Analyst](../analytics/BUSINESS_ANALYST_ROLE.md)
