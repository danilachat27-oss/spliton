# Admin reports and exports (Spliton)

## Formats

| Format | Use case |
|--------|----------|
| CSV | Simple tabular exports (UTF-8 BOM, formula-safe) |
| XLSX | Professional Excel: Summary + Data + Metadata sheets |
| PDF | Finance summaries, compliance previews |
| DOCX | Compliance / revenue distribution narrative reports |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/v1/reports/types` | Report catalog + allowed formats per role |
| POST | `/api/admin/v1/reports/generate?type=&format=&dateFrom=&dateTo=` | Enqueue async job |
| GET | `/api/admin/v1/reports/:id/download` | Authenticated download (JSON: `content` or `contentBase64`) |

## RBAC

See `admin-rbac.ts` — ACCOUNTANT/COMPLIANCE/SUPER_ADMIN finance reports; BUSINESS_ANALYST analytics types; SUPPORT_MANAGER support only.

Sensitive exports audit as `report.sensitive_export`.

## Storage

`REPORT_STORAGE_MODE`: `db` | `local` | `object` | `supabase`. Binary files stored as base64 in DB fallback. Retention: `REPORT_RETENTION_DAYS` (default 7).

## Worker

`REPORT_WORKER_ENABLED=true` in staging/production. Inline processing when disabled (dev/e2e).

See also [REPORT_WORKER_AND_STORAGE.md](../operations/REPORT_WORKER_AND_STORAGE.md).
