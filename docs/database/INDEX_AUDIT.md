# Index Audit

## Already present (init + later migrations)

| Table | Index | Used by |
|-------|-------|---------|
| `users` | `created_at` | User lists |
| `users` | `email` UNIQUE | Login, search |
| `wallet_transactions` | `(wallet_id, created_at)` | Wallet history |
| `wallet_transactions` | `(wallet_id, tx_type, status)` | Balance ops |
| `wallet_transactions` | `(happened_at, tx_type, status)` | Analytics trends |
| `deposits` | `(status, created_at)` | Admin deposits, analytics |
| `withdrawals` | `(status, requested_at)` | Admin withdrawals |
| `fees` | `(created_at, fee_code)` | Platform revenue |
| `fees` | `(subject_type, subject_id)` | Per-entity fees |
| `releases` | `(status, created_at)` | Catalog admin |
| `audit_logs` | `(entity_type, entity_id, created_at)` | Entity audit trail |
| `audit_logs` | `(actor_user_id, created_at)` | Operator activity |
| `support_tickets` | `(status, priority, created_at)` | Support queue |
| `risk_flags` | `(status, created_at)`, entity indexes | Compliance |
| `report_jobs` | `(status, created_at)` | Reports UI |

## Added in `20260531320000_db_operational_indexes`

| Index | Endpoint / query | Filter | Why |
|-------|------------------|--------|-----|
| `users_status_active_idx` (partial) | `GET /admin/v1/users` | `status`, `deleted_at IS NULL` | Staff user filters |
| `audit_logs_action_created_at_idx` | `GET /admin/v1/audit-logs` | `action`, date range | Compliance review |
| `wallet_transactions_reference_type_id_idx` | Settlement, reconciliation | `reference_type`, `reference_id` | Tie payout/withdrawal to ledger row |
| `market_listings_status_created_at_idx` (partial) | Secondary market admin | `status`, not deleted | Listing queues |
| `trades_settlement_status_executed_at_idx` | Market analytics | settlement + time | Pending settlement reports |
| `user_positions_user_id_idx` | Holdings by user | `user_id` | Portfolio / distribution snapshot |

## Not added (low priority / trade-off)

| Suggestion | Reason skipped |
|------------|----------------|
| GIN on `releases.title` | Admin search uses ILIKE `GET /search` — add `pg_trgm` only if EXPLAIN shows seq scan |
| `users.email` lower index | Prisma `equals` on citext/email already unique btree |
| Covering indexes for analytics MVs | Defer until materialized views exist |

## Risk of over-indexing

Each new index slows writes on hot tables (`wallet_transactions`, `trades`). Proposed set is **6 indexes**, all partial or lookup-specific — acceptable for admin/read-heavy workload.

## CHECK constraints

**Phase 1** (`20260531330000`): `wallet_balances`, `user_positions`, `releases`, `primary_raise_rounds`, `wallet_transactions` amount/fee/net.

**Phase 2** (`20260602120000`): `market_listings`, `orders`, `trades`, `order_fills`, `payouts`, `fees`, `earning_distributions`, `release_share_lots`, `releases.primary_unit_price`.

See [DB_HARDENING_PHASE2.md](./DB_HARDENING_PHASE2.md).

## Phase 2 indexes (`20260602120100`)

| Index | Purpose |
|-------|---------|
| `payouts_user_id_earning_distribution_id_key` | Idempotent distribution per holder |
| `wallet_transactions_wallet_id_happened_at_idx` | Statement / analytics by time |
| `user_positions_user_id_release_id_idx` | Portfolio lookup |
| `payouts_release_id_status_idx` | Release payout admin |
| `report_jobs_queue_status_created_at_idx` | Worker poll (partial) |
| `audit_logs_actor_role_action_created_at_idx` | Compliance filters |
| `risk_flags_severity_active_created_at_idx` | Risk queue |
| `ownership_ledger_release_id_happened_at_idx` | Release ledger |
| `orders_release_id_created_at_idx` | Release order history |
| `users_email_trgm_idx`, `releases_title_trgm_idx` | Admin search (`pg_trgm`) |

## Verification

After deploy:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users','audit_logs','wallet_transactions')
ORDER BY tablename, indexname;
```
