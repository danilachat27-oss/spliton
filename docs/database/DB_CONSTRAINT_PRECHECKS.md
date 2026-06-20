# DB Constraint Prechecks

Run before applying CHECK / UNIQUE migrations (phase 1 and phase 2):

```powershell
npm run db:constraint-prechecks
```

Script: `scripts/db-constraint-prechecks.mjs` (uses `DATABASE_URL` → Supabase).  
**Exit code 1** if any required check returns rows.

## Workflow

1. `npm run db:constraint-prechecks` on target DB (local / staging)
2. If violations → fix data (audited SQL or admin tools), **do not** apply constraints
3. `npm run prisma:migrate:deploy`
4. `npm run backend:build` + finance/admin e2e smoke

## Migrations guarded by prechecks

| Migration | Contents |
|-----------|----------|
| `20260531330000_db_check_constraints` | Wallet balances, positions, releases, rounds, wallet_tx amounts |
| `20260531330100_earning_distribution_unique` | One distribution per `earning_period_id` |
| `20260602120000_db_financial_check_constraints_phase2` | Listings, orders, trades, fills, payouts, fees, share lots |
| `20260602120100_db_financial_indexes_fk_phase2` | Indexes, payout uniqueness, `user_positions` FK RESTRICT, `pg_trgm` |

## Phase 2 checks (2026-06-02)

| Check | Target |
|-------|--------|
| `market_listings_invalid` | price > 0, units allocation |
| `orders_units_invalid` | units_total/filled, price_limit |
| `trades_amounts_invalid` | price, units, gross, fee |
| `order_fills_invalid` | fill amounts |
| `payouts_amounts_invalid` | gross/net/units |
| `payouts_duplicate_user_distribution` | before UNIQUE `(user_id, earning_distribution_id)` |
| `fees_amount_invalid` | `amount_charged`, rate, fixed |
| `earning_distributions_amounts_invalid` | distributable amounts |
| `release_share_lots_invalid` | units_total / remaining |

## Phase 1 checks (2026-05-31)

| Check | Target |
|-------|--------|
| Negative wallet balances | `wallet_balances` |
| Invalid user positions | units allocation |
| Invalid release units | `total_units`, `units_available_primary` |
| Share % ≠ 100 | optional share columns |
| Invalid primary rounds | sold_units, caps |
| Invalid deposit/withdrawal tx | via `wallet_transactions` |
| Duplicate earning distributions | `earning_period_id` |

## Adapted SQL notes

- Withdrawals/deposits store amounts on **`wallet_transactions`**, not child tables.
- Releases use `units_available_primary` (not `sold_units` on `releases`).

## If violations found

1. Do **not** apply the failing migration  
2. Fix data via audited admin scripts or one-off SQL (no silent deletes)  
3. Re-run prechecks until zero rows  
4. Deploy migrations on staging → smoke → production  
