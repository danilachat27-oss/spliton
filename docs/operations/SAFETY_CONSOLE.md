# Safety console

**Endpoint:** `GET /api/admin/v1/safety/console`

**RBAC:** SUPER_ADMIN, ADMIN, ACCOUNTANT, COMPLIANCE, BUSINESS_ANALYST (read-only).

## Payload sections

- `liveMode` — NODE_ENV, Tron provider, workers, email provider
- `featureFlags` — effective enable/kill state
- `operations` — deposit ingestion + report worker + finance signals
- `dataQuality` — automated invariant checks
- `outbox` — pending / dead-letter counts
- `readiness` — aggregated green/red for staging gate

## Related endpoints

- `GET /api/admin/v1/safety/data-quality`
- `GET /api/admin/v1/safety/outbox/dead-letter`
- `POST /api/admin/v1/safety/outbox/:id/requeue`

Frontend: `fetchAdminSafetyConsole()` in operator tasks (optional widget).
