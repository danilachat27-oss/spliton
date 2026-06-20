# Wallet Ledger & Withdrawal Settlement

## Principles

1. Every balance change goes through `WalletLedgerService` inside a Prisma `$transaction` (posts `ledger_postings` then updates `wallet_balances`).
2. Withdrawal actions are idempotent via **status guards** and optional `idempotency_key` on ledger/wallet tx.
3. `AdminAuditService` records operator actions with `ledgerMutation: true` when balances change.
4. Drift detection: [LEDGER_AND_RECONCILIATION.md](./LEDGER_AND_RECONCILIATION.md) — admin reconciliation dry-run.

## Withdrawal lifecycle

| Status (API) | DB | Balance effect |
|--------------|-----|----------------|
| pending | REQUESTED | User create: lock **amount** from available → locked; admin approve: skip re-lock if already locked |
| approved | PROCESSING | No change (funds locked) |
| on_hold | ON_HOLD | No change |
| rejected | CANCELLED | Unlock **amount** locked → available; reversal wallet tx; primary tx → CANCELLED |
| completed | COMPLETED | Debit locked **amount**; wallet tx → COMPLETED |

## Services

- `WalletLedgerService` — credit/debit/lock/unlock + create wallet transactions
- `AdminWithdrawalSettlementService` — approve / hold / reject / complete rules
- `AdminWithdrawalsService` — HTTP layer + audit

## Deposit settlement

- `reconcile` / `completed` → credit available, wallet tx COMPLETED, deposit CONFIRMED
- `failed` → wallet tx FAILED, deposit FAILED (no credit)

## Admin visibility

Operator portal:

- **`/admin/wallets`** — balances, ledger, linked deposits/withdrawals. See [WALLETS_ADMIN_FLOW.md](../admin/WALLETS_ADMIN_FLOW.md).
- **`/admin/deposits`** — incoming USDT TRC20 control center (KPI, reconcile, ledger audit). See [DEPOSITS_ADMIN_FLOW.md](../admin/DEPOSITS_ADMIN_FLOW.md).
- **`/admin/analytics/revenue`** — сверка payout credits vs `wallet_transactions` (PAYOUT). See [ANALYTICS_DASHBOARDS.md](../analytics/ANALYTICS_DASHBOARDS.md).

## User-initiated withdrawal creation

**Implemented** — `POST /api/v1/wallet/withdrawals`

- `UserWithdrawalsService` + `WalletWithdrawalsController`
- Lock gross amount, fee from `platform_fee_settings`
- Audit: `withdrawal.requested` (USER actor)
- E2E: `test/withdrawal-ledger.e2e-spec.ts`

See [WITHDRAWALS_AND_DEPOSITS.md](WITHDRAWALS_AND_DEPOSITS.md).

## Risks

- Legacy rows without prior lock: reject unlocks only if `locked >= amount`; approve always attempts lock.
- No separate `withdrawn_total` column — totals derived from wallet transaction history in admin wallet list.
