# Admin API Overview

Base path: **`/api/admin/v1`**

Legacy: `GET /admin/access` — frontend tries v1 first.

## Gate

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/v1/access` | `{ ok, version: 'v1' }` for staff JWT |

## Live domains (summary)

| Domain | Key paths |
|--------|-----------|
| Users | `/users`, `/users/:id`, roles, block |
| Wallets | `/wallets/summary`, `/wallets`, `/wallets/:id?include=`, user wallet |
| Deposits | `/deposits/summary`, `/deposits`, `/deposits/:id?include=`, reconcile, review, status |
| Withdrawals | `/withdrawals/summary`, `/withdrawals`, `/withdrawals/:id?include=`, approve/hold/reject/complete |
| Dashboard | `/dashboard/summary`, `/trends`, `/tasks`, … |
| Search | `/search?q=` |
| Analytics | `/analytics/overview`, `/analytics/{domain}/*` |
| Reports | `/reports/generate`, `/reports/:id/download` |
| Tracks / Rounds | `/tracks`, `/rounds` CRUD |
| **Holdings** | `/holdings/summary`, `/holdings`, `/holdings/:id?include=`, `/users/:id/holdings`, `/tracks/:id/holdings` |
| Support | `/support/tickets` |
| Compliance | `/compliance/*`, risk flags |
| Platform revenue | `/platform-revenue/*` |
| Platform fees | `/platform-fees` GET/PATCH |
| Roles | `/roles`, `/roles/:code/users` |
| Audit | `/audit-logs` |

Актуальная таблица mock/live: [ADMIN_LIVE_API_PROGRESS.md](../admin/ADMIN_LIVE_API_PROGRESS.md).

## Contracts

`apps/frontend/features/admin/api/types.ts`:

- `PaginatedResponse<T>`
- `AdminListQuery`
- `ApiErrorBody`

## Historical TODO snapshot

Устаревший inventory (много уже реализовано): `archive/reports/ADMIN_API_TODO.md`.
