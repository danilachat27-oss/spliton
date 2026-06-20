# Platform fee settings

## Table: `platform_fee_settings`

Additive migration: `20260531180000_platform_fees_and_report_jobs`.

| Field | Purpose |
|-------|---------|
| primary_purchase_fee_pct | Primary market fee |
| withdrawal_fee_fixed | Fixed USDT withdrawal fee |
| withdrawal_fee_pct | Optional percent fee (nullable) |
| secondary_market_fee_pct | Secondary market fee |
| premium_fee_monthly | Optional premium |
| effective_from | Version effective date |
| is_active | Only one active row enforced in app logic |
| created_by / updated_by | Operator audit trail |

Seed: default row inserted on migration (2.5% / 5 USDT / 1%).

## API

| Method | Path | Roles |
|--------|------|-------|
| GET | `/api/admin/v1/platform-fees` | Panel finance roles |
| PATCH | `/api/admin/v1/platform-fees` | SUPER_ADMIN, ADMIN |

PATCH deactivates previous active row and inserts new row (history preserved). Audit: `platform_fees.update`.

User withdrawal create reads active `withdrawal_fee_fixed`.

## Frontend

- `/admin/settings` — fee form (SUPER_ADMIN edit, others read-only)
- Service: `adminPlatformFees.service.ts`

## Still mock

- Platform revenue summary UI (`/admin/platform-revenue`) — table still mock; backend aggregation from `fees` is live.
