# Report Worker & Object Storage

## Architecture

```
POST /api/admin/v1/reports/generate → report_jobs QUEUED
        ↓
ReportWorkerService @Interval(REPORT_WORKER_POLL_MS) → FOR UPDATE SKIP LOCKED → RUNNING
        ↓
AdminReportsService.processJobById → CSV + ReportStorageService.persistReport()
        ↓
COMPLETED: storage_key, file_url, file_size_bytes, completed_at, expires_at
        or FAILED: error_message (after max attempts)
        or EXPIRED: retention elapsed — file purged from storage
```

Inline processing when `REPORT_WORKER_ENABLED` is not `true` (local dev default, e2e/tests).

## Job lifecycle

| Status | Meaning |
|--------|---------|
| `QUEUED` | Waiting for worker (or inline processor) |
| `RUNNING` | Claimed by worker (`locked_at`, `locked_by`, `started_at`) |
| `COMPLETED` | CSV ready; download until `expires_at` |
| `FAILED` | Generation failed after `max_attempts` |
| `EXPIRED` | Retention elapsed; file removed from storage |

Worker recovery: RUNNING jobs older than `REPORT_WORKER_TIMEOUT_MS` are reset to QUEUED (retry) or marked FAILED when attempts exhausted.

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `REPORT_WORKER_ENABLED` | `false` in dev, `true` otherwise | Enable background polling |
| `REPORT_WORKER_POLL_MS` | `15000` | Poll interval (min 5000) |
| `REPORT_WORKER_MAX_ATTEMPTS` | `3` | Max generation attempts per job |
| `REPORT_WORKER_TIMEOUT_MS` | `900000` (15m) | Stuck RUNNING threshold |
| `REPORT_RETENTION_DAYS` | `7` | Days until COMPLETED → EXPIRED |
| `REPORT_STORAGE_MODE` | `db` | `db` \| `local` \| `object` \| `supabase` |

## Storage modes (`REPORT_STORAGE_MODE`)

| Mode | Behavior |
|------|----------|
| `db` | CSV in `file_content` |
| `local` | `storage/reports/{type}/{jobId}.csv` |
| `object` | S3-compatible `PutObject` (R2 / legacy S3) |
| `supabase` | Supabase Storage bucket `reports` via service role (private, signed download) |

### Supabase mode (recommended for Spliton)

```env
REPORT_STORAGE_MODE=supabase
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_REPORTS_BUCKET=reports
```

See [SUPABASE_STORAGE.md](./SUPABASE_STORAGE.md).

### Object env (S3-compatible)

```env
REPORT_STORAGE_MODE=object
REPORT_STORAGE_BUCKET=
REPORT_STORAGE_PUBLIC_URL=
REPORT_STORAGE_ACCESS_KEY=
REPORT_STORAGE_SECRET_KEY=
REPORT_STORAGE_ENDPOINT=
```

Supabase: use project URL as endpoint, bucket name, S3 access keys from Storage settings.

## API

- `POST .../reports/generate` — enqueue (audit: `report.generate` phase `enqueue`)
- `POST .../reports/:id/retry` — failed → QUEUED (audit: `report.retry`)
- `GET .../reports/:id/download` — role-guarded admin endpoint; no public URLs for sensitive exports (audit: `report.download` or `report.sensitive_export`)
- `GET .../reports/worker/status` — queue health metrics

## Report types

`withdrawals`, `deposits`, `wallet_transactions`, `trades` / `market_volume`, `platform_revenue`, `platform_revenue_transactions`, `finance_cashflow`, `finance_fees`, `revenue_distributions`, `users`, `users_funnel`, `tracks_round_progress`, `risk_flags`, `support_tickets`, `audit_logs`, `analytics_summary`.

## Frontend `/admin/reports`

Polling while `queued` / `running`; download when `completed` (RBAC per type); retry on `failed`; expired jobs show label «Истёк».

## Monitoring

- `GET /api/admin/v1/reports/worker/status` — `queued`, `processing` (running), `stuckProcessing`, `failedLast24h`, `healthy`.
- Alert if `stuckProcessing > 0` or `workerEnabled=false` in production while jobs queue grows.
- Logs: `ReportWorkerService` errors per job id; audit rows for `report.failed`.

## Security

No storage secrets in frontend. Download requires admin JWT + report type permission (ACCOUNTANT / BUSINESS_ANALYST / SUPPORT_MANAGER scopes). Completed reports expire after `REPORT_RETENTION_DAYS`. Sensitive types log `report.sensitive_export` on download.
