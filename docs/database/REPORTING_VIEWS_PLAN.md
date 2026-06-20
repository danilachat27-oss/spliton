# Reporting Views Plan

**Principle:** Views only where they simplify **read-only** admin/analytics queries without duplicating write logic.

## Phase 1 — Regular views (optional, safe)

| View | Purpose | Source tables | Endpoints |
|------|---------|---------------|-----------|
| `admin_wallet_balances_view` | User + wallet + balances join | `users`, `wallets`, `wallet_balances` | Admin wallets list (future optimize) |
| `admin_platform_revenue_summary_view` | Daily fee totals by `fee_code` | `fees` | Platform revenue charts |
| `admin_user_financial_summary_view` | Deposits/withdrawals/payout sums per user | `wallet_transactions`, aggregates | User detail drawer |
| `admin_track_round_progress_view` | Round + release + sold % | `primary_raise_rounds`, `releases` | Analytics tracks |
| `admin_secondary_market_summary_view` | Active listings + 24h volume | `market_listings`, `trades` | Market admin |
| `admin_support_queue_view` | Open tickets sorted by priority | `support_tickets` | Support dashboard |
| `admin_risk_queue_view` | Open flags + aging | `risk_flags` | Compliance dashboard |

**Decision now:** Do **not** deploy SQL views in this phase — Prisma aggregation + CHECK/UNIQUE hardening prioritized. Revisit when p95 > 500ms on staging with production-like volume.

## Ordinary views — deferred

| View | Status |
|------|--------|
| `admin_wallet_balances_view` | Not created — use Prisma joins |
| `admin_platform_revenue_summary_view` | Not created |
| `admin_support_queue_view` | Not created |
| `admin_risk_queue_view` | Not created |

Creating views would require `$queryRaw` or separate read models; not worth complexity yet.

## Phase 2 — Materialized views (growth)

| MV | Refresh | Endpoints |
|----|---------|-----------|
| `analytics_daily_cashflow_mv` | Nightly + on-demand | `/analytics/finance/cashflow` |
| `analytics_daily_platform_revenue_mv` | Nightly | `/platform-revenue/by-period` |
| `analytics_user_funnel_mv` | Daily | `/analytics/users/funnel` |
| `analytics_track_performance_mv` | Daily | `/analytics/tracks/*` |
| `analytics_market_volume_mv` | Hourly | `/analytics/market/*` |

**Refresh:** `REFRESH MATERIALIZED VIEW CONCURRENTLY` via cron/worker (not in Nest request path).

## Phase 3 — Reporting tables

For CSV export at scale: `reporting_*` tables populated by worker, not `report_jobs.file_content`.

## Current state

- Analytics: in-process Prisma aggregation + indexes (`20260531210000`, `20260531320000`)
- Reports: `report_jobs` with TEXT `file_content` — dev/staging OK, production needs S3
