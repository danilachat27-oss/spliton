# Ledger & Reconciliation

## Principles

1. **`wallet_balances` is a materialized cache** — never update outside `WalletLedgerService`.
2. **Every balance mutation writes balanced `ledger_postings` first** (near double-entry), then updates the cache row in the same Prisma transaction.
3. **`wallet_transactions`** remain the user-visible audit trail with `operation_type`, `actor_role`, `idempotency_key`, `metadata`, and optional `reversal_of_tx_id`.

## Ledger accounts (per wallet)

| Account | Maps to cache |
|---------|----------------|
| `USER_AVAILABLE` | `wallet_balances.available` |
| `USER_LOCKED` | `wallet_balances.locked` |
| `USER_PENDING` | `wallet_balances.pending` |
| `PLATFORM_SETTLEMENT` | External / clearing (paired with user flows) |
| `PLATFORM_FEE` | Platform revenue recognition |

## Operations that must post ledger rows

| Flow | `LedgerOperationType` | Balance API |
|------|----------------------|-------------|
| Deposit reconcile | `DEPOSIT_SETTLE` | `creditAvailable` |
| Withdrawal request | `WITHDRAWAL_LOCK` | `lockFromAvailable` |
| Withdrawal reject | `WITHDRAWAL_UNLOCK` + `WITHDRAWAL_REJECT` tx | `unlockToAvailable` |
| Withdrawal complete | `WITHDRAWAL_COMPLETE` | `debitLocked` |
| Primary purchase | `PRIMARY_PURCHASE` + `PLATFORM_FEE` | `debitAvailable` |
| Secondary trade | `SECONDARY_TRADE` + `PLATFORM_FEE` | `debitAvailable` / `creditAvailable` |
| Revenue payout | `PAYOUT` | `creditAvailable` |

## Reconciliation

**Service:** `WalletReconciliationService`  
**Admin API:**

- `POST /api/admin/v1/ledger/reconciliation/runs` — body `{ "dryRun": true, "walletIds": ["<uuid>"] }` (`dryRun` defaults to true; optional `walletIds` scopes the scan)
- `GET /api/admin/v1/ledger/reconciliation/runs/latest`
- `GET /api/admin/v1/ledger/reconciliation/runs/:id`
- `GET /api/admin/v1/ledger/reconciliation/runs/:id/report` — CSV

### Algorithm

1. For each wallet with a balance row, sum `ledger_postings` (CREDIT − DEBIT) per `USER_*` account.
2. Compare to `wallet_balances`.
3. If delta ≠ 0 → record discrepancy (persisted only when `dryRun: false`).
4. **Never auto-fix** balances — operators investigate and use controlled admin tools.

### On discrepancy

1. Export CSV from `.../runs/:id/report`.
2. Check recent `wallet_transactions` and `ledger_postings` for the `wallet_id`.
3. Verify no manual SQL or legacy code touched `wallet_balances`.
4. Open incident; fix data via audited migration or reversal (future: `REVERSAL` operation type).

## Migration baseline

`20260603120000_ledger_double_entry_foundation` inserts `OPENING_BALANCE` postings from existing `wallet_balances` so historical wallets reconcile after deploy.

## Code map

- `WalletLedgerService` — sole balance mutator
- `LedgerPostingService` — double-entry lines
- `WalletReconciliationService` — drift detection
- `docs/finance/WALLET_LEDGER.md` — withdrawal/deposit settlement rules
