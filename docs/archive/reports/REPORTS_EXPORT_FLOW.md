# Reports export flow

## Table: `report_jobs`

| Field | Purpose |
|-------|---------|
| type | `withdrawals`, `deposits`, `platform_revenue` |
| status | PENDING → PROCESSING → COMPLETED / FAILED |
| date_from / date_to | Optional filter |
| requested_by_id | Staff user |
| file_content | CSV text (in-DB for now) |
| error_message | On failure |

## API

| Method | Path |
|--------|------|
| POST | `/api/admin/v1/reports/generate?type=&dateFrom=&dateTo=` |
| GET | `/api/admin/v1/reports` |
| GET | `/api/admin/v1/reports/:id` |
| GET | `/api/admin/v1/reports/:id/download` |

CSV types implemented: withdrawals, deposits, platform_revenue (from `fees`).

Audit: `report.generate`.

## Frontend

- `/admin/reports` — generate + jobs table + CSV download
- Service: `adminReports.service.ts`

## Not yet

- XLSX export (placeholder in UI)
- Async worker / S3 file storage
- Large report streaming
