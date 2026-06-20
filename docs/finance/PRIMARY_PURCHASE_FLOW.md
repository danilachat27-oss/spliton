# Primary purchase flow

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/orders` | Buy units in a LIVE round |
| GET | `/api/v1/orders` | User orders |
| GET | `/api/v1/orders/:id` | Order detail |

Header: `Idempotency-Key` (optional) → stored on `orders.idempotency_key` (unique per user).

## Body

```json
{ "roundId": "uuid", "units": 10 }
```

## Transaction steps

1. Validate round `LIVE`, release `ACTIVE`, units available, hard cap.
2. `gross = units × primaryUnitPrice`, `fee` from `platform_fee_settings`, `net = gross - fee`.
3. Debit buyer `available` via ledger.
4. Wallet txs: `TRADE_SETTLEMENT` (out), `FEE` (out) if fee > 0.
5. Update round `soldUnits`, `raisedAmountUsdt`; release `units_available_primary`.
6. Upsert `user_positions`, `ownership_ledger` (`PRIMARY_BUY`).
7. Create `orders` row `FILLED`.
8. User audit: `primary.purchase`.
9. `fees` row: `primary_purchase_fee` linked to FEE wallet tx.

## Preview

`GET /api/v1/orders/primary-round/:releaseId` — active LIVE round + price + fee %.

## Admin visibility

After fill, positions appear in operator portal **`/admin/holdings`** (`GET /api/admin/v1/holdings`, detail with ownership history). See [HOLDINGS_ADMIN_FLOW.md](../admin/HOLDINGS_ADMIN_FLOW.md).

## Concurrency

Inside `POST /api/v1/orders` transaction:

1. `SELECT ... FROM primary_raise_rounds WHERE id = ? FOR UPDATE`
2. Re-check `sold_units` / `units_available_primary` / hard cap
3. Debit wallet, update round, position, fees

Parallel buys on the last unit: one `201`, one `409`; only one order row.

## Guards

- No negative balance; no oversell vs `total_units` / primary pool.
- Paused/closed rounds rejected.
- Idempotent retry returns existing order (`orders.idempotency_key` unique per user).
