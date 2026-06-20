# Spliton Mock/Demo/Static Audit

Дата: 2026-06-17  
Область: `apps/frontend`

## Ключевой вывод

В проекте присутствуют контролируемые feature-flag источники данных, но для live-подключения backend остаются критичные зоны, где возможен показ demo/mock данных в финансовых и рыночных сценариях.

## Реестр mock/demo/static источников

| File | Component/Hook | Что используется | Где отображается | Опасность для production | Что нужно сделать |
| ---- | -------------- | ---------------- | ---------------- | ------------------------ | ----------------- |
| `components/dashboard/assets/payouts-mock-data.ts` | payouts data module | Fake payout summary/history/schedule/chart | user payouts pages | **P0** fake финансовые данные | Убрать runtime импорты в live, оставить только dev/test fixtures |
| `components/dashboard/assets/assets-mock-data.ts` | assets data module | Fake portfolio/positions/KPI | assets overview/positions | **P0** fake portfolio/wallet значения | Запретить fallback на mock в live, API-only + empty/error states |
| `features/admin/mocks/admin-revenue.mock.ts` | admin revenue | Fake revenue/distribution/ledger series | admin revenue/finance | **P0** fake admin revenue | Жесткий live-only guard для prod/staging |
| `features/admin/mocks/admin-secondary-market.mock.ts` | admin market | Fake listings/trades/liquidity | admin secondary market | **P0** fake secondary market | Исключить mock path в live, добавить мониторинг вызовов mock ветки |
| `services/admin/adminKyc.service.ts` | admin KYC service | `MOCK_REVIEWS` fallback | admin KYC | **P0** fake KYC/security | Удалить runtime fallback, оставить тестовые фикстуры в test-only |
| `components/dashboard/profile/profile-security-content.tsx` | profile security | mock sessions in demo | dashboard profile security | **P0 fixed** | Demo: empty sessions + banner; live: API-only |
| `components/dashboard/secondary-market/secondary-market-trade-history-tab.tsx` | trade history tab | `MOCK_TRADES_SEED` | user secondary market | **P0** fake trade history | API-only в live, sandbox watermark только в dev environment |
| `components/dashboard/secondary-market/secondary-market-release-analytics-tab.tsx` | analytics tab | mock listings/trades in live | secondary market analytics | **P0 fixed (re-audit)** | Live: market overview API + `SecondaryMarketReleaseAnalyticsLive` |
| `components/dashboard/secondary-market/secondary-market-watchlist-tab.tsx` | watchlist tab | `SECONDARY_MARKET_LISTINGS_MOCK` | secondary market watchlist | **Safe dev-only** | Mock только при `WALLET=mock`; live — API |
| `components/dashboard/dashboard-value-grid.tsx` | value grid | fallback to `mockInstruments` | dashboard landing | **P0 fixed** | Live: error/empty, no silent mock |
| `hooks/use-dashboard-landing-stats.ts` | dashboard stats | `demoStats` | dashboard landing KPI cards | **Safe dev-only** | `demoStats` только при `WALLET=mock` |
| `components/dashboard/assets/payouts-history-page-content.tsx` | payouts history | fallback rows | payouts history | **P0 fixed** | Live: `payoutHistoryRows ?? []`, no silent mock |
| `services/news.service.ts` | news service | `newsArticlesMock` в non-live | news pages | **P1 fixed** | Live: `parseApiClientError`, detail 500 → error state (не silent null) |
| `services/system-status.service.ts` | status service | mock status on disabled live | system-status page | **P1 fixed** | Live: `parseApiClientError`; mock только `!isLiveStatusEnabled()` |
| `services/user/userSupport.service.ts` | user support | mock tickets in non-live | `/support`, `/dashboard/support` | **P1 fixed** | Live: `parseApiClientError` (без raw JSON в UI) |
| `services/help-center.service.ts` | help center | empty in non-live | support help blocks | **P1 fixed** | Live: `parseApiClientError`; mock только `!isLiveHelpCenterEnabled()` |
| `constants/fees-mock-data.ts` | fees constants | mock rates/calculator constants | fees page | P1 устаревшие hardcoded rates | Данные только из backend config |
| `lib/public-env.ts` | env resolver | data source defaults/fallbacks | global | P2 риск конфигурации | Fail-fast в strict окружениях |
| `lib/validate-public-env.ts` | env validator | build-time checks | CI/build | P2 runtime drift все еще возможен | Добавить runtime asserts на startup |
| `lib/i18n/locale-storage.ts` | locale storage | localStorage | i18n | P3 не финансово критично | Оставить, добавить защиту миграции ключей |
| `features/analytics/releases/lib/local-release-notes.ts` | local notes | localStorage notes | release analytics detail | P3 low risk | Оставить, versioned cleanup |

## P0 (обязательно до live)

1. Любые fake wallet/ledger/payout/portfolio данные.
2. Любые fake admin revenue/finance charts.
3. Любые fake secondary market order book/trade history.
4. Fake KYC/security статусы и события.
5. Silent fallback `catch -> mock` в live mode.

## Дополнительные проверки

- Проверить, что в UI нет `RUB`/`₽` отображения в финансовых блоках Spliton; целевая валюта только `USDT`.
- Проверить env matrix `NEXT_PUBLIC_*_DATA_SOURCE` для prod/staging: значения только `live`.
- Убедиться, что при 4xx/5xx показываются нормальные loading/error/empty states, без подмены demo данными.

## P1 CLOSEOUT RESULT (2026-06-17)

### Env-gated mock (support/news/status)

| Сервис | Mock условие | Live поведение при ошибке API |
| ------ | ------------ | ----------------------------- |
| `news.service.ts` | `!isLiveNewsEnabled()` | throw `ApiClientError` → error UI |
| `system-status.service.ts` | `!isLiveStatusEnabled()` | throw `ApiClientError` |
| `userSupport.service.ts` | `SUPPORT !== live` | throw `ApiClientError` |
| `help-center.service.ts` | `!isLiveHelpCenterEnabled()` | throw `ApiClientError` |

### Admin silent catch — fixed

| Файл | Было | Стало |
| ---- | ---- | ----- |
| `analytics-overview-section.tsx` | `catch(() => null)` reports/tasks | `Promise.allSettled` + `admin.ui.widgetUnavailable` banner |
| `system-status-section.tsx` | `catch(() => null)` ops | `allSettled`; ops fail → banner, core fail → `AdminErrorState` |
| `operator-tasks-section.tsx` | `catch(() => null)` safety/sla | `allSettled` для optional widgets |

### Остаётся P2+

- `constants/fees-mock-data.ts` — hardcoded rates (не financial silent fallback)
- `features/analytics/releases/lib/local-release-notes.ts` — localStorage notes (P3)

---

## STAGING SMOKE RESULT (2026-06-17)

### Env (local rehearsal)

Все `NEXT_PUBLIC_*_DATA_SOURCE=live` в `apps/frontend/.env.local`. Remote staging env **не применялся** (хост не задеплоен).

### Mock/demo проверки в smoke

| Проверка | Результат |
| -------- | --------- |
| Secondary DEMO KPI `184 200` в live | **отсутствует** |
| Wallet fake «заявка выполнена» в live withdraw | **отсутствует** |
| Buy page demo receipt / Демо-режим (unauth gate) | **отсутствует** |
| Session hint → secondary auth gate (не demo KPI) | **PASS** |

### Остаётся для remote staging

- Подтвердить те же инварианты на `PLAYWRIGHT_BASE_URL` + staging API.
- Admin finance live (`ADMIN_DATA_SOURCE=live`) — отдельный manual checklist (`STAGING_MANUAL_QA.md`).
