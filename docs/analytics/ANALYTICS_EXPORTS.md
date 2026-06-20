# Analytics & Reports — CSV Export

Async export через **report jobs** — запрос не блокируется на больших выборках.

## API

| Method | Path |
|--------|------|
| POST | `/api/admin/v1/reports/generate` |
| GET | `/api/admin/v1/reports` |
| GET | `/api/admin/v1/reports/:id` |
| GET | `/api/admin/v1/reports/:id/download` |

## Job lifecycle

`queued` (PENDING) → `processing` → `completed` | `failed`

`ReportWorkerService` polls every 5s (`FOR UPDATE SKIP LOCKED`). `POST .../retry` for failed jobs. Storage: `db` | `local` | `object` (S3-compatible). See `docs/operations/REPORT_WORKER_AND_STORAGE.md`.

## Report types (12)

| Type | Description |
|------|-------------|
| `withdrawals` | Withdrawals CSV |
| `deposits` | Deposits CSV |
| `platform_revenue` | Platform revenue summary |
| `platform_revenue_transactions` | Transaction lines |
| `finance_cashflow` | Cashflow |
| `finance_fees` | Fees |
| `users_funnel` | User funnel |
| `tracks_round_progress` | Round progress |
| `market_volume` | Secondary market volume |
| `revenue_distributions` | Distributions |
| `risk_flags` | Risk flags |
| `support_tickets` | Support tickets |

Row cap: **5000**. XLSX — placeholder (disabled in UI).

## UI

- `/admin/reports` — create + job list + poll every 3s for pending  
- `AdminAnalyticsExportButton` on analytics / platform revenue pages  

## Permissions

`SUPER_ADMIN`, `ACCOUNTANT`, `BUSINESS_ANALYST` (read/export) — per `assertView` in reports service.

## Storage today

`report_jobs.file_content` in PostgreSQL. See backlog: object storage in [TODO_PRODUCTION.md](../operations/TODO_PRODUCTION.md).

Архив: `archive/reports/ANALYTICS_EXPORTS_FLOW.md`, `REPORTS_EXPORT_FLOW.md`.
