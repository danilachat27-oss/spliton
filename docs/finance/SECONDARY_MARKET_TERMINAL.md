# Терминал вторичного рынка (Spliton)

Профессиональный терминал/стакан: `/dashboard/secondary-market/book/[marketId]`.

**Дизайн UI не меняется.** В live-режиме (`NEXT_PUBLIC_WALLET_DATA_SOURCE=live`) все KPI, стакан, сделки, ордера и форма заявки питаются от backend.

## Live API (JWT)

| Блок UI | Endpoint |
|--------|----------|
| KPI header, sparkline, balances | `GET /api/v1/market/terminal/:marketId` |
| User balances / canTrade | `GET /api/v1/market/terminal/:marketId/user-state` |
| Стакан + cumulative depth | `GET /api/v1/market/depth?marketId=&tickSize=0.01\|0.05\|0.1` |
| Recent trades | `GET /api/v1/market/recent-trades?marketId=&limit=` |
| My orders | `GET /api/v1/market/my-orders?marketId=` (alias `orders/mine`) |
| Order preview (subtotal/fee/total) | `POST /api/v1/market/orders/preview` |
| Submit order (idempotency) | `POST /api/v1/market/orders` + header `Idempotency-Key` |
| Cancel order/listing | `POST /api/v1/market/orders/:id/cancel` |
| Sparkline 24h | `GET /api/v1/market/charts/sparkline?marketId=&period=24h` |

Legacy endpoints (`listings`, `trades`, `fee-preview`) остаются для совместимости.

### Depth / tick size

- Raw `asks`/`bids` из listings + OrderBookSnapshot (bid).
- `asksAggregated` / `bidsAggregated` — серверная агрегация по tick с cumulative depth.
- Frontend может дополнительно агрегировать локально (тот же алгоритм).

### Order preview

Request: `marketId`, `side`, `type`, `price`, `units`.

Response: `canSubmit`, `blockingReason`, `subtotal`, `feeAmount`, `totalAmount`, `executionMode` (`MAKER` | `TAKER` | `BLOCKED`), `crossesMarket`.

**Market orders:** `type=MARKET` → `canSubmit=false` с честным текстом (disabled).

**Buy limit:** только покупка **целого активного лота** (best ask). Partial / bid book — P1.

### Settlement (listing-based)

- Sell limit → `POST listings` (units locked в позиции).
- Buy → `POST trades` по `listingId` (atomic: ledger, trade, positions, fee, audit, notification).
- Self-trade → 409.
- Double-buy → `FOR UPDATE` на listing.

## Frontend wiring

- `SecondaryMarketBookPage` → `fetchMarketDepth` → `adaptDepthToBookMarket`.
- `SecondaryMarketOrderEntryPanel` → `POST orders/preview` в live.
- Mock `BOOK_MARKETS` скрыт в live на терминале.

## Tests

- `secondary-market-depth.util.spec.ts` — tick aggregation.
- `secondary-market-depth.e2e-spec.ts` — terminal + preview.
- `secondary-market.e2e-spec.ts` — buy/sell/cancel.

## P1 gaps

- Multi-level market buy / partial fills.
- Полноценный bid order book (limit buy below ask).
- KPI вкладки «Рынок» (не терминал) с backend aggregate.
