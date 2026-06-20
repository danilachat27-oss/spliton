# Performance and scale (Spliton backend)

Операционные лимиты и механизмы, введённые для Prompt 19/20 (масштабирование read-heavy API).

## Пагинация

| Параметр | Значение |
|----------|----------|
| `page` | ≥ 1, по умолчанию `1` |
| `pageSize` | 1–**100** (`MAX_PAGE_SIZE`), по умолчанию `20` |

Ответ списков: `{ items, total, page, pageSize, hasMore }` (`buildPaginated` в admin, тот же контракт в user/public API).

DTO:

- Admin: `AdminListQueryDto` (`@Max(100)` на `pageSize`)
- User/public: `PaginatedQueryDto`, `WalletActivityQueryDto`, `WithdrawalListQueryDto`

Сервисы дополнительно вызывают `resolvePagination()` / `clampPageSize()` — защита даже при обходе DTO.

**Не пагинируются намеренно:** публичный каталог релизов (ограниченный набор ACTIVE-релизов), holdings пользователя, компоненты system-status (малый справочник).

## Кэш (in-memory, process-local)

`TtlCacheService` — только **read-only** снимки; не использовать для балансов, ордеров, выводов после мутаций.

| Ключ / область | TTL |
|----------------|-----|
| `catalog:releases` | 60 s |
| `market:overview:*` (hash query) | 30 s |
| `news:list:{page}:{pageSize}` | 60 s |
| `system-status:snapshot` | 30 s |
| `admin:dashboard:summary:*`, `admin:analytics:finance:summary:*` | 45 s |

Константы: `apps/backend/src/common/cache/cache-ttl.constants.ts`.

## Rate limits (`@nestjs/throttler`)

Глобально: **120 req / 60 s** на IP (`AppModule`).

Точечные лимиты (пример):

| Endpoint | Limit / 60 s |
|----------|----------------|
| `POST /auth/login`, `register` | 5 |
| `POST /auth/password-reset` (forgot) | 3 |
| `POST /api/v1/wallet/withdrawals` | 5 |
| `POST /api/v1/orders` (primary) | 20 |
| `POST /api/v1/market/listings`, `trades` | 20 |
| `POST /api/v1/support/tickets` | 5 |

E2E по умолчанию отключает `ThrottlerGuard`; тест `performance-hardening.e2e-spec.ts` проверяет 429 без bypass.

## Аналитика

- Период: `resolveAnalyticsPeriod()` — серверные `from`/`to`, макс. **366 дней**.
- `limit` в `AdminAnalyticsQueryDto`: 1–100.
- Тяжёлые маршруты `/api/admin/v1/analytics/*` и `/api/admin/v1/reports/*`: timeout **30 s** (`HeavyRouteTimeoutInterceptor`).
- Сводки dashboard/finance analytics — TTL-кэш 45 s.

## Медленные запросы Prisma

`PRISMA_SLOW_QUERY_MS` (по умолчанию **0** — выкл.; в production рекомендуется **500**). При `0` логирование отключено. События `query` с `duration >= threshold` пишутся в лог Nest (`PrismaService`).

## Индексы (миграция `20260614120000_scale_performance_indexes`)

| Индекс | Запросы |
|--------|---------|
| `trades_buyer_user_id_executed_at_idx` | История сделок покупателя, `listTrades` |
| `trades_seller_user_id_executed_at_idx` | История сделок продавца |
| `audit_logs_created_at_idx` | Admin audit list, сортировка по времени |

См. также `20260531210000_analytics_indexes`, `20260611120000_market_overview_indexes`, `20260609120000_wallet_activity_timeline_indexes`.

## Переменные окружения

| Variable | Описание |
|----------|----------|
| `PRISMA_SLOW_QUERY_MS` | Порог slow-query log (ms), `0` = off |
| `DATABASE_URL` | PostgreSQL |
