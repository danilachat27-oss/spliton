# PostgreSQL Functions Review

**Stack:** NestJS + Prisma transactions. DB functions only where they add **atomicity** or **centralized invariants** not expressible safely in app alone.

| Operation | Keep in backend | Move to DB function | Reason | Risk if moved |
|-----------|-----------------|---------------------|--------|-----------------|
| Wallet credit/debit/lock/unlock | **Yes** (`WalletLedgerService`) | No | Clear tests, e2e coverage | Harder to version with app deploys |
| Withdrawal approve/reject/complete | **Yes** (`AdminWithdrawalSettlementService`) | Optional later | Status guards + ledger in one `$transaction` | PL/pgSQL harder to debug |
| Deposit reconcile | **Yes** (`AdminDepositSettlementService`) | No | Same | — |
| Revenue distribution run | **Yes** (`AdminRevenueService`) | Optional | `ALREADY_DISTRIBUTED` in service; could add UNIQUE on `earning_period_id` | Complex payout loop |
| Secondary trade settlement | **Yes** (orders/trades modules) | No | Units + ledger orchestration | — |
| Platform fee PATCH | **Yes** | No | Audit + validation | — |
| Analytics aggregation | **Yes** | MV refresh fn later | Read-heavy; MV refresh is separate | — |
| Report CSV generation | **Yes** (in-process job) | No | Business logic in TS | — |
| Admin global search | **Yes** (ILIKE) | `pg_trgm` index only | Search ranking in app | — |
| Role assign / last SUPER_ADMIN | **Yes** | No | Business rules + audit | — |

## Recommendation

**Keep financial writes in Prisma transactions** for this phase. Consider DB functions only for:

1. `REFRESH MATERIALIZED VIEW` wrapper (ops)
2. Optional `prevent_negative_balance()` trigger — **after** validating no negative rows in prod

## Optional DB enhancements (additive)

| Enhancement | Type | Priority |
|-------------|------|----------|
| `UNIQUE(earning_period_id)` on `earning_distributions` | Constraint | Medium — backs service guard |
| `UNIQUE(reference_type, reference_id, tx_type)` on wallet_tx | Partial unique | Low — needs duplicate audit first |
| Balance CHECK constraints | CHECK | Low — validate data first |

## Services reviewed

- `WalletLedgerService` — `assertNonNegative`, insufficient balance errors ✓
- `AdminWithdrawalSettlementService` — terminal status guards ✓
- `AdminDepositSettlementService` — credit on confirm ✓
- `AdminRevenueService` — single distribution per period ✓
- `AdminSecondaryMarketService` — freeze/cancel audit ✓
