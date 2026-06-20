# System Status

## Admin

- Route: `/admin/system-status`
- Roles: `SUPER_ADMIN`, `ADMIN`
- Components: `GET/PATCH /api/admin/v1/system-status/components/:code`
- Incidents: `GET/POST /api/admin/v1/system-status/incidents`, resolve, updates

## Public

- Page: `/system-status`
- API: `GET /api/v1/system-status` — components + active public incidents (без sensitive internal data)

## Audit

`status.component_update`, `status.incident_create`, `status.incident_update`, `status.incident_resolve`
