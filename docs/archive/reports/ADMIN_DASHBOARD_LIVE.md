# Admin Dashboard (Live)

## Endpoints

- `GET /api/admin/v1/dashboard/summary?period=30d`
- `GET /api/admin/v1/dashboard/trends?period=30d`
- `GET /api/admin/v1/dashboard/tasks`
- `GET /api/admin/v1/dashboard/risk-alerts`
- `GET /api/admin/v1/dashboard/recent-actions`
- `GET /api/admin/v1/dashboard/recent-deposits`
- `GET /api/admin/v1/dashboard/recent-withdrawals`

## Executive KPIs (live)

Period-aware summary with deltas vs previous period:

- Users (total, active, new)
- Tracks / rounds
- Deposits / withdrawals / pending withdrawals
- Available / locked balance
- Payouts / platform revenue
- Listings / trades
- Risk flags / support tickets

## Charts (live when trends API returns data)

- Deposits vs withdrawals
- Platform revenue
- New users
- Risk flags vs support tickets

Period selector: 24h / 7d / 30d / 90d.

## UI

`apps/frontend/features/admin/sections/dashboard-section.tsx` — `AdminMetricTrendCard`, `AdminChartCard`, drill-down links.
