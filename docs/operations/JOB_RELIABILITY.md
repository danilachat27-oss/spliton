# Job reliability

## Workers

| Worker | Env | Retry |
|--------|-----|-------|
| Report | REPORT_WORKER_ENABLED | REPORT_WORKER_MAX_ATTEMPTS |
| Deposit ingestion | DEPOSIT_INGESTION_ENABLED | watcher logs + alerts |
| Event outbox | EVENT_OUTBOX_WORKER_ENABLED | exponential backoff, max 8 → DEAD_LETTER |

## Dead letter

- Report jobs: `FAILED` status + admin notification
- Outbox: `DEAD_LETTER` + requeue via safety API

## Heartbeat

Operations status: `GET /api/admin/v1/operations/status` and safety console `operations` section.
