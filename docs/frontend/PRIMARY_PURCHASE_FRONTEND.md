# Spliton — Primary Purchase (Frontend)

## Flow

1. `/catalog` — при `NEXT_PUBLIC_WALLET_DATA_SOURCE=live` список из `GET /releases` (UUID).
2. `/catalog/buy/[id]` — `resolveMarketOverviewRowForPage` → live release или 404.
3. `CatalogBuyUnitsOrderPanel` — `GET /api/v1/orders/primary-round/:releaseId`, `POST /api/v1/orders` с `Idempotency-Key`.

## Mock guard

В live-режиме non-UUID id (mock catalog) показывает блок «Покупка недоступна» — не вызывает API.

## Errors (RU)

`walletErrorMessage`: insufficient balance, round not active, sold out — через коды backend.

## Links after purchase

Success modal → holdings / profile / deposit при нехватке баланса.
