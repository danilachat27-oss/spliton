# Secondary market (user)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/market/listings` | Active listings |
| GET | `/api/v1/market/holdings` | User positions for listing form |
| GET | `/api/v1/market/listings/mine` | Seller listings |
| GET | `/api/v1/market/listings/:id` | Detail |
| POST | `/api/v1/market/listings` | Create listing (locks units) |
| POST | `/api/v1/market/listings/:id/cancel` | Cancel + unlock |
| POST | `/api/v1/market/trades` | Buy listing (`{ "listingId": "uuid" }`) |
| GET | `/api/v1/market/trades` | User trade history |
| GET | `/api/v1/market/trades/:id` | Trade detail |
| GET | `/api/v1/market/depth` | Terminal: book, KPI, balances, position, trades |
| GET | `/api/v1/market/orders/mine` | User orders/listings (`?releaseId=` filter) |
| GET | `/api/v1/market/fee-preview` | Order form fee/subtotal preview |

Терминал UI: [SECONDARY_MARKET_TERMINAL.md](./SECONDARY_MARKET_TERMINAL.md).

## Create listing

1. Check `user_positions.units_available`.
2. Move units to `units_locked`.
3. `market_listings` ACTIVE.
4. `ownership_ledger` `LOCK_FOR_SELL`.

## Buy listing

1. Listing ACTIVE, not self-trade.
2. Buyer debited `gross`; seller credited `gross - fee`; fee from `secondary_market_fee_pct`.
3. Wallet txs: buyer/seller `TRADE_SETTLEMENT`, buyer `FEE`.
4. Orders + `trades` SETTLED + `order_fills`.
5. Transfer units; listing `SOLD_OUT`.
6. `SECONDARY_BUY` / `SECONDARY_SELL` ledger events.
7. `fees` row: `secondary_market_fee` on buyer FEE wallet tx.

## Admin

Freeze/cancel via `/api/admin/v1/secondary-market` (existing).

Operator holdings view: `/admin/holdings` — listings lock reason, trades, wallet tab. See [HOLDINGS_ADMIN_FLOW.md](../admin/HOLDINGS_ADMIN_FLOW.md).

### Analytics (`/admin/analytics/market`)

Secondary Market Intelligence: стакан листингов (price levels), KPI, volume/trades charts, liquidity by release, fees, suspicious/frozen. API: `/api/admin/v1/analytics/market/*`. See [ANALYTICS_DASHBOARDS.md](../analytics/ANALYTICS_DASHBOARDS.md).

## Limitations

- **Full listing fill only** — no partial buy; UI states this explicitly.
- Frozen/paused/cancelled listings cannot be purchased.

## Frontend

`/dashboard/secondary-market` — live when `NEXT_PUBLIC_WALLET_DATA_SOURCE=live`: market cards, buy confirm modal with fee estimate, my listings + create, trade history.
