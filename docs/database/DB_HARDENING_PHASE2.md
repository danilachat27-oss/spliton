# DB Hardening — Phase 2 (2026-06-02)

Financial SaaS guards on top of phase 1 (`20260531330000`).

## Constraints added

| Domain | Rules |
|--------|--------|
| `market_listings` | `price_per_unit > 0`, units allocation |
| `orders` | `units_total > 0`, `units_filled <= units_total`, `price_limit >= 0` |
| `trades` | positive price/units, `fee_total <= gross_amount` |
| `order_fills` | positive units/price, non-negative amounts |
| `payouts` | non-negative amounts, `amount_net <= amount_gross` |
| `fees` | `amount_charged >= 0`, optional rate/fixed >= 0 |
| `earning_distributions` | non-negative distributable fields |
| `release_share_lots` | `units_remaining <= units_total` |
| `releases` | `primary_unit_price >= 0` |
| `user_positions` | `avg_entry_price >= 0` |

## Indexes / uniqueness

- `payouts (user_id, earning_distribution_id)` UNIQUE
- `wallet_transactions (wallet_id, happened_at DESC)`
- `user_positions (user_id, release_id)` — portfolio lookup
- `payouts (release_id, status)`
- `report_jobs` partial queue index (SQL only)
- `audit_logs (actor_role, action, created_at DESC)`
- `risk_flags (severity, is_active, created_at DESC)`
- `ownership_ledger (release_id, happened_at DESC)`
- `orders (release_id, created_at DESC)`
- `pg_trgm` GIN on `users.email`, `releases.title`

## FK protection

`user_positions.user_id` → `ON DELETE RESTRICT` (was CASCADE).  
Hard-deleting a user with open positions is blocked; wallet already used RESTRICT.

## Decimal precision

All money/units in Prisma use `@db.Decimal(20, 8)` or `@db.Decimal(10, 6)` — no float columns in `schema.prisma`.

## Prechecks

```bash
npm run db:constraint-prechecks
npm run prisma:migrate:deploy
```

See [DB_CONSTRAINT_PRECHECKS.md](./DB_CONSTRAINT_PRECHECKS.md).
