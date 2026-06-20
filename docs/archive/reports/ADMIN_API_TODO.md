# Admin API TODO

Base path: **`/api/admin/v1`** (versioned operator API)

Legacy: `GET /admin/access` — kept for compatibility; frontend tries v1 first.

## Live today

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/admin/v1/access` | Staff gate `{ ok, version }` |
| GET | `/admin/access` | Legacy alias |
| GET | `/api/admin/v1/users` (+ detail, status, roles, block/unblock) | Audit on mutations |
| GET | `/api/admin/v1/deposits` (+ detail, status, review, reconcile) | Audit on mutations |
| GET | `/api/admin/v1/withdrawals` (+ approve/reject/hold/complete) | Status only — no balance change |
| GET | `/api/admin/v1/wallets` (+ transactions, user wallet) | Read-only |
| GET | `/api/admin/v1/audit-logs` | List + detail |
| GET | `/api/admin/v1/revenue-events` | Skeleton list |
| GET | `/api/admin/v1/distributions` | Skeleton |
| GET | `/api/admin/v1/platform-revenue/*` | Skeleton |
| GET | `/api/admin/v1/listings`, `/trades`, `/reports` | Skeleton |

## Standard contracts

See `features/admin/api/types.ts`:

- `PaginatedResponse<T>`
- `ApiErrorBody`
- `AdminListQuery`
- `WalletDetailDto` + `WalletLedgerEntryDto`

## Endpoints to implement

### Dashboard
- `GET /api/admin/v1/dashboard`

### Users
- `GET /api/admin/v1/users`
- `GET /api/admin/v1/users/:id`
- `PATCH /api/admin/v1/users/:id/status`
- `POST /api/admin/v1/users/:id/roles`
- `DELETE /api/admin/v1/users/:id/roles/:code`
- `POST /api/admin/v1/users/:id/block` | `unblock`

### Tracks & rounds
- `GET/POST /api/admin/v1/tracks`
- `PATCH /api/admin/v1/tracks/:id`
- `GET/POST /api/admin/v1/rounds`
- `PATCH /api/admin/v1/rounds/:id` (publish, pause, complete)

### Wallet ledger
- `GET /api/admin/v1/wallets`
- `GET /api/admin/v1/wallets/:id` (balances + ledger)
- `GET /api/admin/v1/wallets/:id/ledger`

### Finance
- `GET /api/admin/v1/deposits`
- `PATCH /api/admin/v1/deposits/:id` (complete, fail, review)
- `GET /api/admin/v1/withdrawals`
- `PATCH /api/admin/v1/withdrawals/:id` (approve, reject, hold, complete)

### Holdings & revenue
- `GET /api/admin/v1/holdings`
- `GET/POST /api/admin/v1/revenue-events`
- `POST /api/admin/v1/revenue-events/:id/distribute`

### Secondary market
- `GET /api/admin/v1/secondary-market/listings`
- `PATCH /api/admin/v1/secondary-market/listings/:id` (freeze, cancel)
- `GET /api/admin/v1/secondary-market/trades`
- `PATCH /api/admin/v1/secondary-market/trades/:id` (flag suspicious)

### Ops
- `GET /api/admin/v1/platform-revenue`
- `POST /api/admin/v1/reports/generate`
- `GET/PATCH /api/admin/v1/support/tickets`
- `GET/PATCH /api/admin/v1/compliance/items`
- `GET/PATCH /api/admin/v1/settings`
- `GET /api/admin/v1/audit-log`
- `GET /api/admin/v1/roles`

## Frontend wiring

Set `NEXT_PUBLIC_ADMIN_DATA_SOURCE=live` and pass `AdminApiClient` from `useAdminApi()` into `*Paginated` service methods.
