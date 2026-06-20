# Platform revenue & fees

## `fees` table

Each platform fee is a row in `fees` linked to `wallet_transactions`:

| `fee_code` | Flow |
|------------|------|
| `primary_purchase_fee` | Primary `POST /api/v1/orders` |
| `secondary_market_fee` | Secondary `POST /api/v1/market/trades` |
| `withdrawal_fee` | User withdrawal request |

Fields: `amount_charged`, `rate` / `fixed_amount`, `subject_type`, `subject_id`, `currency`.

## Analytics

Admin platform revenue (`/api/admin/v1/platform-revenue`) and analytics dashboards aggregate `fees` by `fee_code` and period.

## User wallet semantics

- **Gross** debited from buyer (`TRADE_SETTLEMENT` + optional `FEE` tx).
- **Fee** row is traceable separately; not double-charged on balance.
- Seller receives **gross − platform fee** on secondary sales.

## Implementation

`PlatformFeeLedgerService` — `apps/backend/src/modules/admin/common/platform-fee-ledger.service.ts`

Used from: `UserMarketService`, `UserWithdrawalsService`.
