# Analytics performance plan

## Heavy endpoints

| Endpoint | Risk | Mitigation |
|----------|------|------------|
| `dashboard/trends` | Loads tx rows for period | Max 366d; indexes on `happened_at` |
| `analytics/overview` | 7 parallel summaries | Role-gated partial execution |
| `analytics/finance/cashflow` | Full tx scan | Period cap + indexes |
| `reports/generate` | Up to 5000 rows | Async job; future worker |

## Implemented guards

- `resolveAnalyticsPeriod`: max 366 days, invalid range → 400
- Report row cap: 5000

## Future

- Materialized views: `daily_cashflow`, `daily_platform_revenue`
- Reporting tables refreshed nightly
- Redis cache for dashboard summary (TTL 60s)
- Dedicated export worker + object storage

## Load testing (manual)

```powershell
# Example: 20 sequential requests (dev only)
1..20 | ForEach-Object { curl -H "Authorization: Bearer $token" "http://localhost:3001/api/admin/v1/dashboard/summary?period=30d" }
```

Formal k6/Artillery — next phase.
