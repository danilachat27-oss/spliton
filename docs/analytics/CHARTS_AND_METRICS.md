# Spliton — графики и метрики

## Периоды

`24h`, `7d`, `30d`, `90d`, `1y`, `all` — задаются query `period`.

## Buckets

Backend выбирает bucket автоматически (`hour` для 24h, `day` для 7–90d, `week` для 1y/all) или принимает `bucket`.

## User API

| Endpoint | Источник данных |
|----------|-----------------|
| `GET /api/v1/market/charts/price` | `price_history` (OHLC close) |
| `GET /api/v1/market/charts/ohlc` | то же |
| `GET /api/v1/market/charts/volume` | `trades` SETTLED only |
| `GET /api/v1/market/charts/spread` | `order_book_snapshots` |
| `GET /api/v1/market/charts/liquidity` | `release_metrics_daily` |
| `GET /api/v1/market/depth` | listings + snapshots |
| `GET /api/v1/market/overview/charts` | aggregate trades |
| `GET /api/v1/portfolio/charts/value` | positions × `price_history` D1 |
| `GET /api/v1/portfolio/charts/payouts` | `payouts` PAID |
| `GET /api/v1/analytics/releases/:id/performance` | real closes per period |

## Live mode

При `NEXT_PUBLIC_WALLET_DATA_SOURCE=live` UI не подставляет synthetic series; пустые ряды → honest empty state.

## Индексы

См. миграции `trades_release_id_executed_at`, `price_history_release_id_bucket_ts`, `release_metrics_daily_release_id_as_of_date`.

## Tests

- `apps/backend/test/market-charts.e2e-spec.ts`
- `secondary-market-depth.e2e-spec.ts`, `market-overview.e2e-spec.ts`, `user-analytics.e2e-spec.ts`
