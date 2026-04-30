# Spliton Database Architecture

## Scope

This document defines the production-grade data model for Spliton (music release shares exchange).

- No backend API implementation in this phase.
- No frontend UI changes.
- No Redis, no real payments, no blockchain matching engine implementation.
- This phase delivers normalized PostgreSQL schema + Prisma mapping + ERD + migration-ready setup.

## Design Principles

- PostgreSQL + Prisma.
- All identifiers are UUID.
- Snake case on DB tables/columns (`@@map`, `@map` in Prisma).
- Monetary, price, fee, yield, and share quantities use `DECIMAL`, never float.
- Source-of-truth ledgers are append-only by policy:
  - money: `wallet_transactions`
  - ownership: `ownership_ledger`
  - exchange execution: `trades` + `order_fills`
- `wallet_balances` and `user_positions` are read-optimized aggregates, not canonical event history.
- Soft delete only where justified:
  - `users.deleted_at`
  - `releases.deleted_at`
  - `market_listings.deleted_at`

## MVP Tables

### Identity and Access

- `users`
- `user_profiles`
- `roles`
- `user_roles`

### Releases and Assets

- `artists`
- `releases`
- `release_artists`
- `release_metrics_daily`
- `release_share_lots`

### Ownership and Positions

- `user_positions`
- `ownership_ledger`

### Exchange

- `market_listings`
- `orders`
- `order_fills`
- `trades`
- `price_history`

### Wallet and Money

- `wallets`
- `wallet_balances`
- `wallet_transactions`
- `deposits`
- `withdrawals`
- `fees`

### Earnings and Payouts

- `earning_periods`
- `earning_reports`
- `earning_distributions`
- `payouts`

### Admin and Audit

- `admin_actions`
- `audit_logs`

## Later / Optional Tables

- `kyc_verifications`
- `kyc_documents`
- `notifications`
- `user_sessions`
- `labels`
- `release_documents`
- `release_analytics_snapshots`
- `order_book_snapshots`
- `payout_claims`
- `risk_flags`

## Core Data Flows

### 1) Buying shares

Primary or secondary buy creates/updates:

1. `orders` row (`side=BUY`).
2. On execution, `trades` row links buy and sell orders.
3. Two `order_fills` rows (one per side/order within same trade).
4. `wallet_transactions`:
   - lock funds (`TRADE_LOCK`, `OUT`) when needed
   - settle funds (`TRADE_SETTLEMENT`, usually `OUT` for buyer)
   - fee event (`FEE`) if charged separately
5. `ownership_ledger` with `PRIMARY_BUY` or `SECONDARY_BUY`.
6. Aggregate update:
   - `user_positions` (units/avg entry)
   - `wallet_balances` (available/locked/pending)

### 2) Selling shares

1. `orders` row (`side=SELL`).
2. Ownership lock recorded via `ownership_ledger` (`LOCK_FOR_SELL`).
3. On cancel/expire, unlock via `ownership_ledger` (`UNLOCK_AFTER_CANCEL`).
4. On execution:
   - `trades` + `order_fills`
   - `wallet_transactions` settlement (`IN`)
   - fee write (`fees` and/or `wallet_transactions` with `FEE`)
   - `ownership_ledger` with `SECONDARY_SELL`
5. Aggregate update:
   - `user_positions.units_*`
   - `wallet_balances.*`

### 3) Partial order execution

`orders.units_total` and `orders.units_filled` support partial fills.

- Each partial execution creates additional `order_fills` entries.
- Order status transitions:
  - `OPEN` -> `PARTIALLY_FILLED` -> `FILLED`
  - terminal alternatives: `CANCELLED`, `REJECTED`, `EXPIRED`
- Unfilled remainder remains active for `GTC/DAY` depending on `time_in_force`.

### 4) User position calculation

Canonical unit events are in `ownership_ledger`.

`user_positions` keeps current state per (`user_id`, `release_id`):

- `units_total`
- `units_available`
- `units_locked`
- `avg_entry_price`

This table is updated atomically with each ownership event.

### 5) Wallet ledger model

Canonical money events are in `wallet_transactions`.

- One wallet per (`user_id`, `asset_code`, `network`) via unique constraint.
- Any money change is represented by a transaction with:
  - `tx_type`
  - `direction` (`IN`/`OUT`)
  - `amount`, `fee_amount`, `net_amount`
  - status lifecycle
- `wallet_balances` is a cache-like aggregate updated in the same transaction boundary.

### 6) Payout vs Withdrawal

- `payouts`: internal release income allocation to user (platform earnings distribution).
- `withdrawals`: external transfer request out of platform wallet.

They are intentionally separate domains to avoid accounting confusion.

### 7) Market price calculation

- `releases.primary_unit_price` is only primary offering reference.
- Current market price is derived from:
  - latest `trades.price`
  - aggregated `price_history` candles
- `releases` does not store mutable “current market price” as source of truth.

### 8) Why audit log exists

`audit_logs` records who changed what and when, including before/after snapshots (`before_jsonb`, `after_jsonb`).
It supports:

- security investigations
- admin traceability
- compliance evidence
- rollback analysis (manual/process)

## Source of Truth by Domain

- **Identity:** `users`, `roles`, `user_roles`
- **Release metadata:** `releases`, `artists`, `release_artists`
- **Execution:** `trades`, `order_fills`, `orders`
- **Money:** `wallet_transactions`
- **Ownership:** `ownership_ledger`
- **Earnings:** `earning_periods`, `earning_reports`, `earning_distributions`, `payouts`
- **Audit:** `audit_logs`

## Key Constraints and Indexing

Implemented explicitly in Prisma schema:

- unique:
  - `users.email`
  - `roles.code`
  - `releases.slug`
  - `releases.symbol`
  - `user_roles(user_id, role_id)`
  - `user_positions(user_id, release_id)`
  - `release_artists(release_id, artist_id, role)`
  - `release_metrics_daily(release_id, as_of_date)`
  - `earning_periods(release_id, period_start, period_end)`
  - `price_history(release_id, bucket, ts)`
  - `wallets(user_id, asset_code, network)`
- indexes:
  - `orders(user_id, created_at)`
  - `orders(release_id, status, side)`
  - `trades(release_id, executed_at)`
  - `wallet_transactions(wallet_id, created_at)`
  - `payouts(user_id, status)`
  - `ownership_ledger(user_id, release_id, happened_at)`
  - `price_history(release_id, bucket, ts)`
  - `release_metrics_daily(release_id, as_of_date)`

## Migration Strategy (Current Phase)

1. Validate schema: `npx prisma validate`
2. Format schema: `npx prisma format`
3. Create first migration (without applying to prod):  
   `npx prisma migrate dev --name init_spliton_schema`
4. For CI/production deploy later use:  
   `npx prisma migrate deploy`
