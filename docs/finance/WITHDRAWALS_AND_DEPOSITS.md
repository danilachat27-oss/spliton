# Withdrawals & Deposits

## User deposit page (`/assets/payouts/deposit`)

**API:** `GET /api/v1/wallet/deposit-info` (JWT) — адрес, QR, min deposit, timings, контракт USDT, warnings, `providerStatus`.

Настройки сети и пул адресов: [DEPOSIT_ADDRESS_MANAGEMENT.md](./DEPOSIT_ADDRESS_MANAGEMENT.md), admin: [DEPOSIT_NETWORK_SETTINGS.md](../admin/DEPOSIT_NETWORK_SETTINGS.md).

Legacy: `GET /api/v1/wallet/deposit-address` (subset полей).

## User withdrawals

**API (user):** `/api/v1/wallet/withdrawals` — create, list, get by id.  
Отдельно от admin surface.

**Flow:**

1. TRC20 validation, min amount, fee from `platform_fee_settings`  
2. Lock `amount` from available → locked  
3. Create `wallet_transaction` (PENDING) + `withdrawal` (LOCKED)  
4. Audit: `withdrawal.requested` (USER)  

Admin settlement: review / approve / reject / complete with enforced state-machine — см. [WALLET_LEDGER.md](WALLET_LEDGER.md).

ENV: `NEXT_PUBLIC_WALLET_DATA_SOURCE=live` для UI.

## Admin wallets (`/admin/wallets`)

- Summary KPI, filters, wallet detail drawer (ledger, deposits, withdrawals, market, risk, audit)
- API: `GET /api/admin/v1/wallets/summary`, list, detail with `?include=`
- See [WALLETS_ADMIN_FLOW.md](../admin/WALLETS_ADMIN_FLOW.md)

## Admin withdrawals (`/admin/withdrawals`)

- Summary KPI, filters, tabbed drawer (overview, blockchain, ledger, user, audit)
- Actions: approve, hold, reject, complete (+ tx hash)
- API: `GET /api/admin/v1/withdrawals/summary`, list, detail with `?include=ledger,audit,user`
- Settlement via `AdminWithdrawalSettlementService`
- See [WITHDRAWALS_ADMIN_FLOW.md](../admin/WITHDRAWALS_ADMIN_FLOW.md)
- E2E: `admin-withdrawals.e2e-spec.ts`, `withdrawal-ledger.e2e-spec.ts`

## Admin deposits (`/admin/deposits`)

- Summary KPI, filters (amount, confirmations, high-value, manual review), tabbed drawer (overview, blockchain, ledger, user, audit)
- Actions: reconcile, manual review, complete, fail, reject — confirm + audit note
- API: `GET /api/admin/v1/deposits/summary`, list, detail with `?include=ledger,audit,user`
- Credit via `WalletLedgerService` on reconcile/complete; no double credit
- Automatic TRON/TRC20 ingestion: [TRON_DEPOSIT_AUTOMATION.md](./TRON_DEPOSIT_AUTOMATION.md)
- See [DEPOSITS_ADMIN_FLOW.md](../admin/DEPOSITS_ADMIN_FLOW.md)
- E2E: `apps/backend/test/admin-deposits.e2e-spec.ts`

## Status alignment

Prisma enums ↔ API ↔ UI badges — см. `archive/reports/ENUM_STATUS_AUDIT.md` при изменениях статусов.

## Архив

`archive/reports/USER_WITHDRAWAL_FLOW.md` — полный user flow.
