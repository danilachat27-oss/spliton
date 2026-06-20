# Analytics — Architecture

Operator portal analytics: `/admin/analytics/*` + `/api/admin/v1/analytics/*` + `apps/frontend/features/admin/analytics/`.

## Routes & API

| Route | Backend |
|-------|---------|
| `/admin/analytics` | `GET /analytics/overview` |
| `/admin/analytics/finance` | `/analytics/finance/*` |
| `/admin/analytics/users` | `/analytics/users/*` |
| `/admin/analytics/tracks` | `/analytics/tracks/*` |
| `/admin/analytics/market` | `/analytics/market/*` |
| `/admin/analytics/revenue` | `/analytics/revenue/*` |
| `/admin/analytics/risk` | `/analytics/risk/*` |
| `/admin/analytics/operations` | `/analytics/support/*` |

Executive dashboard (KPI): `/api/admin/v1/dashboard/summary`, `/dashboard/trends`.

## Frontend services

`apps/frontend/services/admin/`:

- `adminAnalytics.service.ts`
- `adminFinanceAnalytics.service.ts`, `adminUserAnalytics.service.ts`, …

Switch: `NEXT_PUBLIC_ADMIN_DATA_SOURCE` + `AdminApiClient`.

## RBAC

`assertAnalyticsArea()` in `admin-analytics.util.ts` — backend enforces per domain.

## Aggregation

In-process Prisma queries + date bucketing. При росте объёма — materialized views, reporting tables (см. [ANALYTICS_PERFORMANCE.md](ANALYTICS_PERFORMANCE.md)).

## Live vs mock

| Mode | Behavior |
|------|----------|
| live | Real API; empty/zero if no data |
| mock | Empty arrays — **no fake chart values** |

Исходник: `archive/reports/ADMIN_ANALYTICS_ARCHITECTURE.md`.
