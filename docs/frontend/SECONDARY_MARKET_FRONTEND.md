# Spliton — Secondary Market (Frontend)

## Route

`/dashboard/secondary-market?tab=market|orders|history`

При `NEXT_PUBLIC_WALLET_DATA_SOURCE=live` вкладки **market**, **orders**, **history** рендерят `SecondaryMarketLivePanel`:

- `GET/POST /api/v1/market/listings`
- `GET /api/v1/market/listings/mine`
- `POST .../cancel`
- `POST /api/v1/market/trades` (buy)
- `GET /api/v1/market/trades`
- `GET /api/v1/market/holdings`

## Mock-only tabs

`watchlist`, `analytics`, `rules`, order book — демо UI без backend (см. FRONTEND_LIVE_AUDIT.md).

## UX

- Confirm перед buy/cancel/create listing
- Fee breakdown (secondary fee %)
- Статусы RU: `listingStatusLabel`, `tradeStatusLabel`
- Нельзя купить своё объявление (seller check)
