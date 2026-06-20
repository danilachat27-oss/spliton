# Analytics — Performance & Indexes

## Heavy endpoints

| Endpoint | Risk | Mitigation |
|----------|------|------------|
| `dashboard/trends` | Many wallet tx rows | 366d cap; indexes on `happened_at` |
| `analytics/overview` | 7 parallel summaries | Role-gated areas |
| `analytics/finance/cashflow` | Full tx scan | Period cap + indexes |
| `reports/generate` | Large CSV | Async job; 5000 row cap |

## Implemented guards

- `resolveAnalyticsPeriod`: max **366 days**, invalid range → 400  
- Report generation: max **5000** rows  
- Default pagination limits on list endpoints  

## Indexes (migration `20260531210000_analytics_indexes`)

| Table | Index purpose |
|-------|----------------|
| `wallet_transactions` | `happened_at`, `(tx_type, status, happened_at)` |
| `deposits` | `(status, created_at)` |
| `withdrawals` | `(status, created_at)` |
| `fees` | `(created_at)` |

Аудит полный: `archive/reports/ANALYTICS_INDEX_AUDIT.md`.

## Future

- Materialized views: `daily_cashflow`, `daily_platform_revenue`  
- Nightly reporting tables  
- Redis cache for dashboard summary (TTL ~60s)  
- Dedicated export worker  

## Manual load check (dev)

```powershell
1..20 | ForEach-Object {
  curl -H "Authorization: Bearer $token" "http://localhost:3001/api/admin/v1/dashboard/summary?period=30d"
}
```

Formal k6/Artillery — next phase. Исходник: `archive/reports/ANALYTICS_PERFORMANCE_PLAN.md`.
