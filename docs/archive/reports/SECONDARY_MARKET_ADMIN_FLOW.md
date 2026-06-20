# Secondary market admin flow

## Live backend

| Method | Path |
|--------|------|
| GET | `/api/admin/v1/listings` |
| POST | `/api/admin/v1/listings/:id/freeze` |
| POST | `/api/admin/v1/listings/:id/cancel` |
| GET | `/api/admin/v1/trades` |
| POST | `/api/admin/v1/trades/:id/mark-suspicious` |

## Frontend `/admin/secondary-market`

- Tabs: Listings, Trades, Suspicious, Cancelled/Frozen
- `useAdminPaginatedList` + live service mapping
- Actions: freeze, cancel, mark suspicious — confirm dialog + audit
- Permissions via `useAdminPermissions` (COMPLIANCE mutate, SUPPORT read-only)

## Still mock / partial

- Risk badges partly heuristic (paused listing → frozen)
- Suspicious tab filters client-side until backend flag on trade rows
- Admin notes on listings — audit via action reason only
