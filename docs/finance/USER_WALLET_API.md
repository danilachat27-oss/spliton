# User wallet API

Base path: `/api/v1/wallet` (JWT required).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Full summary |
| GET | `/balance` | Balances only |
| GET | `/transactions` | Paginated ledger (`page`, `pageSize`) |
| GET | `/deposit-address` | TRC20 USDT address |
| GET | `/deposits` | User deposits list |
| GET | `/deposits/:id` | Deposit detail |
| POST | `/withdrawals` | Create withdrawal (existing) |

## Summary fields

- `walletId`, `asset`, `network`
- `availableBalance`, `lockedBalance`, `pendingBalance` (decimal strings)
- `earnedTotal` (completed payouts), `withdrawnTotal`, `totalDeposits`
- `pendingWithdrawalsCount`, `updatedAt`

## One wallet per user (USDT TRC20)

DB constraint: `@@unique([userId, assetCode, network])` on `wallets`.

`UserWalletService.getOrCreateWallet` uses `findUnique` on that composite and handles create races (`P2002` → re-fetch). Do not use non-deterministic `findFirst` for the default wallet.

## Rules

- User sees only their wallet (no admin API on user pages).
- All balance changes go through `WalletLedgerService` + Prisma transactions.
- Frontend: `NEXT_PUBLIC_WALLET_DATA_SOURCE=live` with mock fallback.
