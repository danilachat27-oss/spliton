# Analytics index audit

## Migration `20260531210000_analytics_indexes`

| Index | Table | Used by |
|-------|-------|---------|
| `wallet_transactions_happened_at_tx_type_status_idx` | wallet_transactions | Dashboard trends, finance cashflow |
| `deposits_status_created_at_idx` | deposits | Finance failures, manual review |
| `withdrawals_status_requested_at_idx` | withdrawals | Withdrawal processing analytics |
| `fees_created_at_fee_code_idx` | fees | Platform revenue, finance fees |

## Already present (no change)

- `users_created_at_idx`
- `trades_release_id_executed_at_idx`
- `risk_flags_status_created_at_idx`
- `support_tickets_status_priority_created_at_idx`
- `report_jobs_status_created_at_idx`
- `releases_status_created_at_idx`

## Not added (low priority / existing coverage)

- `audit_logs` — already indexed by entity and actor
- `user_roles_role_id_idx` — roles page
