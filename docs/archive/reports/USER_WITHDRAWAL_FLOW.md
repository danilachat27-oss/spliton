# User withdrawal flow

## Endpoints (user API v1)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/wallet/withdrawals` | JWT |
| GET | `/api/v1/wallet/withdrawals` | JWT |
| GET | `/api/v1/wallet/withdrawals/:id` | JWT |

Separate from admin surface (`/api/admin/v1/...`).

## Create flow (`POST`)

1. Validate JWT session.
2. Validate TRC20 address (`T` + 33 base58 chars).
3. Validate amount > 0 and >= `MIN_WITHDRAWAL_USDT` (default 50).
4. Resolve withdrawal fee from active `platform_fee_settings` or env default.
5. Ensure `net = amount - fee > 0`.
6. Load user USDT/TRC20 wallet + balance.
7. Ensure `available >= amount`.
8. In Prisma `$transaction`:
   - `lockFromAvailable(wallet, amount)`
   - Create `wallet_transaction` (`WITHDRAWAL`, `OUT`, `PENDING`)
   - Create `withdrawal` (`REQUESTED`)
   - Link tx `referenceId` to withdrawal id
9. Audit: `withdrawal.requested` (`ActorRole.USER`).

User cannot approve/complete/reject — admin settlement only.

## Admin settlement (existing)

| Action | Balance effect |
|--------|----------------|
| approve | Ensures lock (skip if already locked at user create) → `PROCESSING` |
| complete | `debitLocked(amount)` → `COMPLETED` |
| reject | `unlockToAvailable(amount)` + reversal tx → `CANCELLED` |

## Frontend

- `apps/frontend/services/wallet.service.ts`
- `apps/frontend/components/dashboard/assets/payout-withdraw-card.tsx`
- Enable live: `NEXT_PUBLIC_WALLET_DATA_SOURCE=live`

## Status mapping

| DB | API (user/admin) |
|----|------------------|
| REQUESTED | pending |
| PROCESSING | approved |
| COMPLETED | completed |
| CANCELLED | rejected |
