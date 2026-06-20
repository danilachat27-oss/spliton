# Admin Charts and Metrics

## Chart components (`features/admin/analytics/components/`)

| Component | Purpose |
|-----------|---------|
| `AdminChartCard` | Title, description, loading/error/empty, export placeholder, drill-down |
| `AdminMetricTrendCard` | KPI + delta % + sparkline + tooltip |
| `AdminPeriodSelector` | 24h / 7d / 30d / 90d |
| `AdminLineChart` | Single-series SVG line |
| `AdminBarChart` | Horizontal bars with optional href |
| `AdminMultiLineChart` | Multi-series comparison |
| `AdminChartEmptyState` / `AdminChartSkeleton` | UX states |
| `AdminKpiTooltip` | Metric explanation |

## Formatting

- Money: `1 240 500,00 USDT` via `formatUsdtAmount()`
- Dates: `formatAdminDateShort()` / `formatAdminDate()`

## Dashboard live charts

When `NEXT_PUBLIC_ADMIN_DATA_SOURCE=live` and trends API returns data:

1. Deposits vs withdrawals
2. Platform revenue
3. New users
4. Risk flags vs support tickets

## Mock mode

Charts show empty states — no decorative fake series in analytics pages.
