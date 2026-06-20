# Analytics exports flow

## API

| Method | Path |
|--------|------|
| POST | `/api/admin/v1/reports/generate?type=&dateFrom=&dateTo=` |
| GET | `/api/admin/v1/reports` |
| GET | `/api/admin/v1/reports/:id` |
| GET | `/api/admin/v1/reports/:id/download` |

## Job lifecycle

1. `PENDING` → UI status **queued**
2. `PROCESSING` — фоновая обработка (in-process, без отдельного worker)
3. `COMPLETED` / `FAILED`

## Report types

- `withdrawals`, `deposits`, `platform_revenue`, `platform_revenue_transactions`
- `finance_cashflow`, `finance_fees`
- `users_funnel`, `tracks_round_progress`, `market_volume`
- `revenue_distributions`, `risk_flags`, `support_tickets`

## UI

- `AdminAnalyticsExportButton` на analytics / platform-revenue
- `/admin/reports` — полный список jobs + CSV download
- XLSX — placeholder (disabled)

## Limits

- До 5000 строк на отчёт (sync build в worker-процессе)
- TODO: dedicated worker + S3/R2 для больших объёмов
