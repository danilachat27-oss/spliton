# Admin Analytics Architecture

## Overview

Operator portal analytics is a dedicated layer under `/admin/analytics/*` with backend aggregation (`/api/admin/v1/analytics/*`) and reusable frontend chart components in `apps/frontend/features/admin/analytics/`.

## Routes

| Route | Domain | Backend prefix |
|-------|--------|----------------|
| `/admin/analytics` | Overview | `GET /analytics/overview` + dashboard trends |
| `/admin/analytics/finance` | Finance | `/analytics/finance/*` |
| `/admin/analytics/users` | Users | `/analytics/users/*` |
| `/admin/analytics/tracks` | Tracks/Rounds | `/analytics/tracks/*` |
| `/admin/analytics/market` | Secondary market | `/analytics/market/*` |
| `/admin/analytics/revenue` | Revenue distribution | `/analytics/revenue/*` |
| `/admin/analytics/risk` | Compliance/Risk | `/analytics/risk/*` |
| `/admin/analytics/operations` | Support ops | `/analytics/support/*` |

## Service layer

Frontend services (`apps/frontend/services/admin/`):

- `adminAnalytics.service.ts` — shared fetch + overview
- `adminFinanceAnalytics.service.ts`
- `adminUserAnalytics.service.ts`
- `adminTrackAnalytics.service.ts`
- `adminMarketAnalytics.service.ts`
- `adminRevenueAnalytics.service.ts`
- `adminRiskAnalytics.service.ts`
- `adminSupportAnalytics.service.ts`

Live/mock switch: `NEXT_PUBLIC_ADMIN_DATA_SOURCE=live` + `AdminApiClient`.

## RBAC

Backend: `assertAnalyticsArea()` in `admin-analytics.util.ts`.

- `SUPER_ADMIN` / `ADMIN`: all areas
- `BUSINESS_ANALYST`: all analytics read-only
- `ACCOUNTANT`: finance, revenue, market (read)
- `CONTENT_MANAGER`: tracks
- `COMPLIANCE`: risk, market
- `SUPPORT_MANAGER` / `SUPPORT`: users (limited), operations

## Performance notes

Current implementation aggregates in-process via Prisma queries with date bucketing. For large volumes TODO:

- materialized views / reporting tables
- scheduled aggregates
- composite indexes on `(happenedAt)`, `(createdAt)`, `(status)`
- async CSV export jobs

## Live vs mock

| Area | Live when `NEXT_PUBLIC_ADMIN_DATA_SOURCE=live` |
|------|--------------------------------------------------|
| Dashboard KPIs/trends | Yes |
| All analytics endpoints | Yes (backend implemented) |
| Mock mode | Empty arrays / zero KPIs (no fake chart values) |
