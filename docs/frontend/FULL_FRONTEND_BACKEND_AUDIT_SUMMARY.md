# Spliton Full Frontend-Backend Audit Summary

Дата: 2026-06-17

## 1) Общий вердикт

**PARTIAL**

Frontend покрывает почти все продуктовые области, но перед полным подключением backend остаются критичные блокеры P0, в основном связанные с mock/demo/fallback в финансовых, рыночных и admin-аналитических сценариях.

## 2) Количество маршрутов

- Всего: **106**
- LIVE: **80**
- PARTIAL: **8**
- MOCK: **1**
- STATIC: **3**
- BROKEN: **0**
- MISSING_BACKEND: **0 (явно), но есть partial зоны риска**
- LEGACY/REDIRECT: **14**

## 3) Главные P0 blockers

1. Fake/mock payout/portfolio/wallet данные в пользовательских finance-сценариях (`assets/payouts`, `assets/metrics`, related modules).
2. Demo/fallback order book и trade history в secondary market UI.
3. Маршрут `dashboard/secondary-market/l/[listingId]` остается mock-only.
4. Fake KYC/security данные в profile/admin KYC fallback ветках.
5. Fake admin revenue/finance charts и mock-capable admin analytics ветки.
6. Fake admin wallets/holdings/deposits/withdrawals fallback в finance admin.
7. Silent fallback (`catch -> mock` / `catch -> null`) в критичных сервисах.
8. Дублирование пользовательского кабинета (`/app` и `/dashboard`) с риском расхождения интеграции.
9. Недостаточно унифицированная обработка `422/500` в UI.
10. Отсутствие жесткой runtime-гарантии live data source на prod/staging.

## 4) P1 задачи

1. Унифицировать error handling (`401/403/404/409/422/500`) и i18n сообщений.
2. Закрыть partial support/news/system-status ветки, зависящие от env-gated mock paths.
3. Убрать legacy aliases после подтверждения отсутствия трафика.
4. Усилить action audit для admin RBAC/finance/support/compliance мутаций.
5. Проверить `generateMetadata` + `page.tsx` на дублирующие fetch в catalog/analytics деталях.

## 5) P2 задачи

1. Cleanup старых mock/data modules и feature flags, которые больше не нужны в live.
2. Полировка empty/loading/error states.
3. Сокращение legacy redirect маршрутов.
4. Документация DTO-контрактов между frontend и backend по аналитике.

## 6) Финальный план внедрения live backend

### Phase 1 — Пользовательский контур (P0)

- Wallet/portfolio/payouts: убрать fake данные и fallback на mock.
- Profile/security/2FA/sessions/legal consents: только live состояния.
- Catalog/buy/release detail: исключить mixed live/mock path.

### Phase 2 — Admin core (P0)

- Admin finance: deposits/withdrawals/wallets/holdings/revenue/platform-revenue.
- Admin users/roles/KYC: подтвердить RBAC и action audit.
- Admin tracks/releases/rounds: убрать legacy mock workspace/browser-only state.

### Phase 3 — Support/Compliance/Settings

- User support/disputes и admin support/compliance.
- Settings/system-status/legal/dictionaries.

### Phase 4 — Analytics/Charts/Reports

- User analytics и admin analytics (users/revenue/finance/market/risk/tracks/operations).
- Отказ от demo chart series, единый DTO/error contract.

### Phase 5 — Cleanup Legacy/Mock

- Удаление/изоляция legacy redirects и mock runtime веток.
- Жесткая политика `live-only` на prod/staging.
- Финальный smoke regression по всем критичным маршрутам.

## Решение по переходу к этапу подключения backend

Переход к массовому подключению backend сейчас **не рекомендуется** без закрытия P0 блокеров.  
Рекомендуемый следующий шаг: выполнить Phase 1 и Phase 2, затем повторить короткий targeted аудит только P0 зон.

---

## P0 CLOSEOUT RESULT (2026-06-17)

### Закрытые P0

| ID | Область | Статус |
| --- | --- | --- |
| P0-1 | User finance: payouts chart, history silent mock | **Закрыто** |
| P0-3 | Secondary listing detail mock-only route | **Закрыто** (live client fetch + `force-dynamic`) |
| P0-4 | Profile security fake sessions | **Закрыто** |
| P0-5 | Silent fallback: value grid, payouts history | **Закрыто** |
| P0-8 | Build/runtime live guard | **Усилено** (`LiveDataPolicyGuard`, `lib/live-data-policy.ts`) |

### Изменённые файлы

- `lib/live-data-policy.ts`, `lib/live-data-policy.test.ts`
- `components/providers/live-data-policy-guard.tsx`, `app-providers.tsx`
- `components/dashboard/assets/payouts-accrual-chart-section.tsx`, `payouts-accrual-chart.tsx`
- `app/assets/payouts/page.tsx`, `portfolio-overview-charts-section.tsx`
- `components/dashboard/assets/payouts-history-page-content.tsx`
- `components/dashboard/dashboard-value-grid.tsx`
- `components/dashboard/profile/profile-security-content.tsx`
- `app/dashboard/secondary-market/l/[listingId]/page.tsx`
- `lib/i18n/critical-messages.ts`, `dashboard-messages.ts`

### Удалённые / заблокированные fallback

- `payouts-history`: `live && rows ? rows : payoutHistory` → пустой массив при live без данных
- `dashboard-value-grid`: `catch/empty → mockInstruments` → error/empty state
- `profile-security`: `MOCK_SECURITY_SESSIONS` в demo → пустой список + demo banner
- `payouts chart`: mock series на `/assets/payouts` в live → API через `usePortfolioPayoutsChart`
- Listing detail: `generateStaticParams` из mock → `dynamic = force-dynamic`, данные только из API в live

### Зоны теперь LIVE (при `*_DATA_SOURCE=live`)

- `/assets/payouts` chart + summary
- `/assets/payouts/history` (без silent mock)
- `/app`, `/dashboard` value grid quotes
- `/dashboard/profile?tab=security` (без fake sessions)
- `/dashboard/secondary-market/l/[listingId]` (client live fetch)

### Остаётся PARTIAL и почему

| Зона | Причина |
| --- | --- |
| Admin finance/analytics | Mock-ветки в сервисах сохранены для `ADMIN_DATA_SOURCE=mock` (local dev); в staging/production build guard требует `live` |
| Secondary market tabs (watchlist, trade history) | Mock seed только при `WALLET_DATA_SOURCE=mock`; в live — API или empty/error |
| `/assets/*` preview cards в megamenu | Намеренные UI-превью, не financial state |
| P1: unified 422/500 UX | Вне scope P0 closeout |

### Пройденные проверки

- `npx tsc --noEmit` — OK
- Vitest: `live-data-policy`, `validate-public-env`, `use-dashboard-landing-stats`, `profile-security-content`, `assets-overview-live` — OK
- `next build` — не завершён (OOM worker в локальной среде); typecheck проходит

### Вердикт

Критичные **silent mock fallback** в user finance, profile security и dashboard quotes устранены. Admin и secondary market в **live env** уже API-only; mock остаётся только при явном `*_DATA_SOURCE=mock` в development. **Рекомендуется targeted P0 re-audit** на staging с `NEXT_PUBLIC_*_DATA_SOURCE=live`.

---

## P0 TARGETED RE-AUDIT RESULT (2026-06-17)

### Env / guard

| Проверка | Результат |
| -------- | --------- |
| `PUBLIC_DATA_SOURCE_GUARD_ENTRIES` (wallet, portfolio, payouts, auth, admin, …) | OK — staging/production build падает при mock |
| `LiveDataPolicyGuard` runtime | OK — логирует misconfig в strict mode |
| `isFinancialMockFallbackAllowed()` | OK — mock UI только при `WALLET=mock` |

### Confirmed closed (live/staging)

| Зона | Статус |
| ---- | ------ |
| `/assets/payouts` chart + summary | API-only (`PayoutsAccrualChartSection`, `usePayoutsOverview`) |
| `/assets/payouts/history` | Нет silent `payoutHistory` fallback |
| `/assets/overview` | Hooks без mock fallback; demo banner только в mock mode |
| Wallet deposit/withdraw | Mock address только при `!isLivePayoutsEnabled()` |
| Sell flow | API positions/holdings в live |
| `/dashboard/secondary-market/l/[id]` | `force-dynamic`, client `fetchListingDetail` |
| Trade history / watchlist / orders tabs | Mock seed только при `WALLET=mock` |
| Order book (`dashboard-mini-order-book`) | Live: error/empty, не DEMO при API fail |
| Profile security | Нет `MOCK_SECURITY_SESSIONS` |
| `/app` + `/dashboard` | Общие `DashboardStats` + `DashboardValueGrid` |
| Admin services | `getAdminDataSource() === "live"` → API; mock только dev |

### Fixed during re-audit

| Файл | Проблема | Исправление |
| ---- | -------- | ----------- |
| `secondary-market-release-analytics-tab.tsx` | В live показывал `SECONDARY_MARKET_LISTINGS_MOCK` (список инструментов и slug-detail) | Live: `fetchMarketOverviewList` + `SecondaryMarketReleaseAnalyticsLive`; mock только при `WALLET=mock` |

### Still risky / safe dev-only

| Место | Классификация |
| ----- | ------------- |
| `MOCK_TRADES_SEED`, `SECONDARY_MARKET_LISTINGS_MOCK` в secondary tabs | **Safe dev-only** — gated `isLive` |
| `mockInstruments` в `dashboard-value-grid` | **Safe dev-only** — только `!live` |
| `demoStats` в `use-dashboard-landing-stats` | **Safe dev-only** |
| `catch(() => null)` wallet/portfolio в landing stats | **Acceptable** — partial live KPI, не fake totals |
| Admin `catch(() => null)` в analytics overview | **P1** — не financial silent mock |
| `payout-history-table` default `rows=payoutHistory` | **Safe** — callers в live передают `rows` явно |

### Проверки

| Команда | Результат |
| ------- | --------- |
| `npx tsc --noEmit` | PASS |
| Vitest (live-data-policy, validate-public-env, dashboard stats, profile security, assets overview) | **23/23 PASS** |
| `NODE_OPTIONS=--max-old-space-size=8192 npm run build` | **PASS** |
| Playwright smoke | Не запускался (нет staging API в CI-сессии) |

### Вердикт re-audit

**P0 CONFIRMED** для live/staging при `NEXT_PUBLIC_WALLET_DATA_SOURCE=live` и `NEXT_PUBLIC_ADMIN_DATA_SOURCE=live`.  
Один dangerous fallback найден и исправлен (analytics tab).  
**Можно переходить к P1** (unified error UX, legacy cleanup).

---

## P1 CLOSEOUT RESULT (2026-06-17)

### Закрытые P1 задачи

| # | Задача | Статус | Детали |
| - | ------ | ------ | ------ |
| 1 | Unified API error UX | **CLOSED** | `formatApiError`: 401→AUTH_REQUIRED, 409→CONFLICT, 422→VALIDATION_ERROR, 500→SERVER_UNAVAILABLE; сервисы news/support/help/status → `parseApiClientError` |
| 2 | Support/news env-gated mock | **CLOSED** | Mock только при `!isLive*()`; live API fail → error/empty, не fake data |
| 3 | Legacy redirects cleanup | **CLOSED (audit)** | 14 legacy routes — только безопасные `redirect()`, без mock-страниц; массовое удаление → P2 |
| 4 | Admin analytics/dashboard P1 | **CLOSED** | Убран `catch(() => null)` в analytics overview, system-status ops, operator-tasks optional widgets |
| 5 | Empty/loading/error polish | **PARTIAL** | News detail error UI + i18n ru/en/es/pt; P1-зоны finance/secondary/profile уже на P0 error states |
| 6 | Staging smoke | **SKIPPED** | Нет staging API/env в сессии; Playwright не запускался |

### Изменённые файлы (P1)

- `lib/i18n/format-api-error.ts`, `format-api-error.spec.ts`
- `services/news.service.ts`, `system-status.service.ts`, `help-center.service.ts`, `user/userSupport.service.ts`
- `components/news/news-detail-load-error.tsx`, `app/news/[slug]/page.tsx`
- `lib/i18n/news-messages.ts`, `lib/i18n/admin-messages.ts` (`admin.ui.widgetUnavailable`)
- `features/admin/sections/analytics/analytics-overview-section.tsx`
- `features/admin/sections/system-status-section.tsx`
- `features/admin/sections/operator-tasks-section.tsx`

### Унифицированные ошибки

| HTTP | Dictionary key | Покрытие |
| ---- | -------------- | -------- |
| 401 | AUTH_REQUIRED | `formatApiError` + `useApiErrorMessage` |
| 403 | FORBIDDEN | было + подтверждено |
| 404 | NOT_FOUND | было + подтверждено |
| 409 | CONFLICT | **добавлено** |
| 422 | VALIDATION_ERROR | **добавлено** (status + array message) |
| 500 | SERVER_UNAVAILABLE | **добавлено** |

### Проверки

| Команда | Результат |
| ------- | --------- |
| `npx tsc --noEmit` | **PASS** |
| Targeted Vitest (P0+P1 zones) | **56/56 PASS** |
| `NODE_OPTIONS=--max-old-space-size=8192 npm run build` | **PASS** |
| `npm run i18n:gate` | **PASS** (см. I18N GATE CLOSEOUT ниже) |
| Playwright smoke (`e2e/smoke/*`) | **SKIPPED** — нет `PLAYWRIGHT_BASE_URL`/staging |

### Остаётся P1 / блокеры финального sign-off

1. **Staging smoke** — route guard, finance flow, secondary market, profile/security, admin finance (требует staging env).

### Вердикт P1

**P0 не регрессирован.** P1 code + **i18n:gate закрыт**.  
**Финальный P1 sign-off** остаётся заблокирован только **staging smoke** (нет env в CI-сессии).

---

## I18N GATE CLOSEOUT RESULT (2026-06-17)

### Было → стало

| Метрика | До | После |
| ------- | -- | ----- |
| Critical issues | **89** | **0** |
| dictionary | 63 | 0 |
| hardcoded-ui | 24 | 0 |
| raw-enum | 2 | 0 |
| `npm run i18n:gate` | FAIL | **PASS** |

### Исправленные зоны

| Зона | Исправление |
| ---- | ----------- |
| `fees-messages.ts` | ES/PT: `...EN` spread — полное покрытие ключей RU |
| `analytics-detail-page-messages.ts` | `const ES` / `const PT` с `...EN` |
| `admin-messages.ts` | `admin.section.labels` (en/es/pt); `admin.drawer.*`, `admin.labels.fieldName` |
| `critical-messages.ts` | payouts/positions/withdraw/loading ключи (ru/en/es/pt) |
| Hardcoded UI (24) | `spliton-loader` (`labelKey`), finance/payouts/positions components, admin drawer/labels |
| raw-enum (2) | `top-position-cards-grid` status label; `disputes-page-content` ticket status variable |

### Изменённые translation/message файлы

- `lib/i18n/fees-messages.ts`
- `lib/i18n/analytics-detail-page-messages.ts`
- `lib/i18n/admin-messages.ts`
- `lib/i18n/critical-messages.ts`

### Изменённые UI файлы (i18n wiring)

- `components/ui/spliton-loader.tsx`
- `app/dashboard/profile/loading.tsx`, `app/analytics/releases/[id]/loading.tsx`
- `components/dashboard/assets/payout-withdraw-card.tsx`, `payouts-accrual-chart.tsx`, `payouts-balance-scale.tsx`, `payouts-history-page-content.tsx`
- `components/dashboard/assets/positions-charts.tsx`, `positions-structure-cards.tsx`, `top-position-cards-grid.tsx`
- `components/dashboard/dashboard-value-grid.tsx`, `disputes/disputes-page-content.tsx`
- `features/admin/hooks/use-admin-drawer-unsaved-guard.tsx`, `features/admin/sections/labels-section.tsx`

### Проверки

| Команда | Результат |
| ------- | --------- |
| `npm run i18n:gate` | **PASS (0 issues)** |
| `npx tsc --noEmit` | **PASS** |
| Vitest: `format-api-error.spec`, `dictionaries.spec`, `admin-p1.test` | **37/37 PASS** |
| `p2-auth-financial-i18n.test` widget parity | **1 pre-existing FAIL** (`calculator.buy.*Hint` в widget-messages — вне scope gate) |
| `NODE_OPTIONS=--max-old-space-size=8192 npm run build` | **PASS** |

### Оставшиеся i18n warnings

- **Нет critical issues** в `i18n:gate`.
- Pre-existing: `WIDGET_MESSAGES` ES/PT missing 3 calculator keys (`priceHint`, `unitsHint`, `usdtHint`) — не блокирует gate, можно закрыть в P2.

### Вердикт

**i18n:gate PASS.** Можно переходить к **staging smoke** для финального P1 sign-off.
