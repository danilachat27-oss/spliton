# User deposit flow

## API

- `GET /api/v1/wallet/deposit-address` — returns existing wallet address or creates one.
- `GET /api/v1/wallet/deposits` — paginated history.
- `GET /api/v1/wallet/deposits/:id` — detail.

## Address policy

- **Production:** real TRC20 address from provider only; if unavailable → `503 DEPOSIT_ADDRESS_UNAVAILABLE`.
- **Non-production:** `ALLOW_DEV_DEPOSIT_ADDRESS=true` allows `T_DEV_*` placeholder (never in production).

## Statuses (API)

`pending`, `confirming`, `manual_review`, `completed`, `failed`.

## UI (`/assets/payouts/deposit`)

- Address card + copy
- Warnings: USDT TRC20 only, confirmation delay
- Deposit history with loading / empty / error states
- `NEXT_PUBLIC_WALLET_DATA_SOURCE=live`

## Production

- `ALLOW_DEV_DEPOSIT_ADDRESS=false` (required in production).
- Without Tron/provider → API `503 DEPOSIT_ADDRESS_UNAVAILABLE`.
- UI: «Пополнение временно недоступно» — no fake address shown.

## Settlement

Admin confirms deposits via existing admin deposit settlement (ledger credit).
