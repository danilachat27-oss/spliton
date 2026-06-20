# Global Admin Search

## Status: LIVE (backend + frontend)

## Endpoint

`GET /api/admin/v1/search?q=`

## Response

Grouped results: users, withdrawals, deposits, tracks, rounds, trades, audit.

## Permissions

- Results filtered by role — only sections the operator can access.
- `CONTENT_MANAGER`: tracks/rounds only (no wallet amounts).
- `SUPPORT`: financial amounts masked in search subtitles.
- `SUPER_ADMIN` / `ADMIN`: all groups.

## Frontend

- Component: `features/admin/components/admin-global-search.tsx`
- Wired in `admin-header.tsx`
- Debounced live search when `NEXT_PUBLIC_ADMIN_DATA_SOURCE=live`

## Risks / TODO

- No full-text index — uses ILIKE queries (OK for foundation, optimize for scale).
- No search history / recent queries.
