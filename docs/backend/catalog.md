# Public catalog API (Spliton)

Публичный каталог доступен без JWT по префиксу `/api/v1/catalog`.

## Endpoints

| Method | Path | Описание |
|--------|------|----------|
| GET | `/releases` | Список карточек с фильтрами, сортировкой и пагинацией |
| GET | `/releases/:id` | Деталь релиза (id, slug или symbol) |
| GET | `/releases/:id/primary-round` | Срез первичного раунда |
| GET | `/search/suggestions?q=` | Подсказки поиска (pg_trgm + ILIKE) |
| GET | `/filters` | Жанры и счётчики статусов раунда |
| GET | `/genres` | Список жанров |
| GET | `/stats` | Агрегаты публичного каталога |
| GET | `/artists` | Артисты с публичными релизами |

Legacy: `GET /releases` (упрощённый список).

## Видимость релизов

В каталог попадают только релизы со статусом `ACTIVE` или `SOLD_OUT`. `DRAFT`, `PAUSED`, `PRIVATE` и удалённые записи возвращают **404** в detail и не попадают в list/search.

## Поиск

- Query-параметр `search` на списке.
- Trigram-индекс `releases_title_trgm_idx` (миграция catalog search).
- Веса: title / artist / symbol выше genre и description.

## Покупка (первичка)

- `GET /api/v1/orders/primary-round/:releaseId` — активный LIVE-раунд (только при `ReleaseStatus.ACTIVE`).
- `POST /api/v1/orders/primary-preview` — preview с `canPurchase` и `blockingReason`.
- `POST /api/v1/orders` — покупка с обязательным idempotency key.
- `POST/GET /api/v1/orders/:id/receipt` — PDF-чек (Spliton branding).

## Frontend

- `NEXT_PUBLIC_CATALOG_DATA_SOURCE=live` — список и buy/detail с API.
- Фильтры и поиск в live пробрасываются на `GET /catalog/releases` (debounce 320ms).
- Mock-режим сохраняет локальные фильтры и market-карточки.

## Tests

- `apps/backend/test/public-catalog.e2e-spec.ts` — draft hidden, detail 404, active card fields.
