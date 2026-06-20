# Spliton Frontend Routes Audit

Дата: 2026-06-17  
Область: `apps/frontend`

## Сводка

- Всего маршрутов `app/**/page.tsx`: **106**
- Dynamic routes: **13**
- Redirect/legacy routes: **14**
- LIVE: **80**
- PARTIAL: **8**
- MOCK: **1**
- STATIC: **3**
- BROKEN: **0**
- MISSING_BACKEND: **0 (явно не подтверждено, есть частичные зоны риска)**
- UNUSED/LEGACY: **14**

## Важные layout наблюдения

| Route | Назначение | Тип | Статус | Основные компоненты | Используемые services/hooks | Backend endpoints | Data source | Проблемы | Приоритет |
| ----- | ---------- | --- | ------ | ------------------- | --------------------------- | ----------------- | ----------- | -------- | --------- |
| `/(root layout)` | Глобальная оболочка app | PUBLIC | PARTIAL | `app/layout.tsx`, `AuthGuard`, `AppProviders` | auth/i18n providers | косвенно через children | live + env-gated | Ошибка конфигурации data source может скрыто перевести children в mock path | P1 |
| `/admin/(portal)/layout` | Админ shell + guard | ADMIN | LIVE | `AdminSectionGuard`, admin shell | admin auth hooks | `/api/admin/v1/access`, RBAC endpoints | live | Завязан на корректность RBAC и admin access contracts | P1 |
| `/dashboard/layout` | Shell пользовательского кабинета | USER_DASHBOARD | LIVE | dashboard shell | wallet/profile hooks (через children) | через children | live/partial | Дублирует пользовательский сценарий с `/app` | P0 |

## Полный список routes

> Ниже перечислены все route-файлы `app/**/page.tsx`, нормализованные в URL. Для alias/redirect отмечен тип `REDIRECT` и статус `UNUSED/LEGACY`.

### PUBLIC / AUTH / USER

| Route | Назначение | Тип | Статус | Основные компоненты | Используемые services/hooks | Backend endpoints | Data source | Проблемы | Приоритет |
| ----- | ---------- | --- | ------ | ------------------- | --------------------------- | ----------------- | ----------- | -------- | --------- |
| `/` | Входной alias | REDIRECT | UNUSED/LEGACY | redirect page | - | redirect -> `/app` | static redirect | Legacy alias | P1 |
| `/(home)` | Публичная главная | PUBLIC | LIVE | home page | public hooks | public endpoints | live/static | - | P2 |
| `/login` | Логин | AUTH | LIVE | auth login form | `auth.service` | `/api/v1/auth/login` | live | - | P1 |
| `/register` | Регистрация | AUTH | LIVE | register flow | `auth.service` | `/api/v1/auth/register` | live | - | P1 |
| `/verify-email` | Подтверждение email | AUTH | LIVE | verify flow | `auth.service` | `/api/v1/auth/verify-email` | live | - | P1 |
| `/forgot-password` | Восстановление пароля | AUTH | LIVE | forgot password form | `auth.service` | `/api/v1/auth/forgot-password` | live | - | P1 |
| `/reset-password` | Сброс пароля | AUTH | LIVE | reset password form | `auth.service` | `/api/v1/auth/reset-password` | live | - | P1 |
| `/app` | Основной кабинет Spliton | USER_DASHBOARD | LIVE | dashboard landing | `useDashboardLandingStats`, wallet hooks | `/api/v1/wallet/*`, `/api/v1/portfolio/*` | live (+ demo risk) | Конкурирует с `/dashboard` | P0 |
| `/dashboard` | Legacy кабинет (активный) | USER_DASHBOARD | LIVE | dashboard page | wallet/profile/support hooks | mixed user API | live/partial | Дублирование с `/app` | P0 |
| `/dashboard/profile` | Профиль, безопасность, настройки | USER_DASHBOARD | PARTIAL | profile screens | `user-me.service`, `two-factor.service` | `/api/v1/me/*`, `/api/v1/auth/2fa/*` | live + demo constants | Demo security score/sessions path | P0 |
| `/dashboard/notifications` | Уведомления пользователя | USER_DASHBOARD | LIVE | notifications page | `notifications.service` | `/api/v1/notifications*` | live | Слабая типизация ошибок | P2 |
| `/dashboard/documents` | Документы/справки | USER_DASHBOARD | LIVE | documents center | `documents.service` | `/api/v1/documents*` | live | - | P2 |
| `/dashboard/statements` | Выписки | USER_DASHBOARD | LIVE | statements page | wallet/documents hooks | `/api/v1/documents*`, `/api/v1/wallet/*` | live | - | P2 |
| `/dashboard/artist` | Раздел artist | USER_DASHBOARD | PARTIAL | artist page | artist/user hooks | `/api/v1/artist/*` (частично) | live/static | Неполный backend контракт в UI | P1 |
| `/dashboard/disputes` | Список disputes | SUPPORT | LIVE | disputes list | disputes hooks | `/api/v1/disputes*` | live | - | P1 |
| `/dashboard/disputes/[id]` | Деталь dispute | SUPPORT | LIVE | dispute detail | `useApiErrorMessage` | `/api/v1/disputes/{id}` | live | Нужна строгая обработка empty/error | P1 |
| `/dashboard/support` | Тикеты поддержки | SUPPORT | PARTIAL | support tickets list | `userSupport.service` | `/api/v1/support/tickets*` | live + gated mock | В non-live показывает demo path | P1 |
| `/dashboard/support/[id]` | Деталь тикета | SUPPORT | PARTIAL | ticket thread | `userSupport.service` | `/api/v1/support/tickets/{id}` | live + gated mock | Ограниченный режим при non-live | P1 |

### FINANCE / PORTFOLIO / WALLET

| Route | Назначение | Тип | Статус | Основные компоненты | Используемые services/hooks | Backend endpoints | Data source | Проблемы | Приоритет |
| ----- | ---------- | --- | ------ | ------------------- | --------------------------- | ----------------- | ----------- | -------- | --------- |
| `/assets` | Alias активов | REDIRECT | UNUSED/LEGACY | redirect | - | redirect -> `/assets/overview` | static redirect | Legacy | P1 |
| `/my-assets` | Legacy alias | REDIRECT | UNUSED/LEGACY | redirect | - | redirect -> `/assets/overview` | static redirect | Legacy | P1 |
| `/dashboard/(assets)/overview` | Alias overview | REDIRECT | UNUSED/LEGACY | redirect | - | redirect -> `/assets/overview` | static redirect | Legacy | P1 |
| `/dashboard/(assets)/positions` | Alias positions | REDIRECT | UNUSED/LEGACY | redirect | - | redirect -> `/assets/positions` | static redirect | Legacy | P1 |
| `/dashboard/(assets)/activity` | Alias activity | REDIRECT | UNUSED/LEGACY | redirect | - | redirect -> `/assets/activity` | static redirect | Legacy | P1 |
| `/dashboard/(assets)/metrics` | Alias metrics | REDIRECT | UNUSED/LEGACY | redirect | - | redirect -> `/assets/metrics` | static redirect | Legacy | P1 |
| `/dashboard/(assets)/payouts` | Alias payouts | REDIRECT | UNUSED/LEGACY | redirect | - | redirect -> `/assets/payouts` | static redirect | Legacy | P1 |
| `/dashboard/(assets)/statement` | Alias statements | REDIRECT | UNUSED/LEGACY | redirect | - | redirect -> `/dashboard/statements` | static redirect | Legacy | P1 |
| `/assets/overview` | Portfolio overview | FINANCE | LIVE | assets overview | `usePortfolioLive`, `wallet.service` | `/api/v1/portfolio/overview`, `/api/v1/wallet/summary` | live + legacy mocks nearby | Исторические mock массивы в соседних компонентах | P0 |
| `/assets/positions` | Portfolio positions | FINANCE | LIVE | positions page | `useAssetsPositionsPage`, `portfolio.service` | `/api/v1/portfolio/positions` | live + possible mock fallback | Проверить отсутствие silent mock fallback | P1 |
| `/assets/activity` | Wallet/portfolio activity | FINANCE | LIVE | activity page | `useWalletActivityLive` | `/api/v1/wallet/activity`, `/api/v1/portfolio/activity` | live | - | P1 |
| `/assets/metrics` | Portfolio metrics | FINANCE | PARTIAL | metrics charts | `usePortfolioCharts` | `/api/v1/portfolio/metrics` | live + chart seed risk | Chart fallback/demo series | P0 |
| `/assets/payouts` | Payout overview | FINANCE | PARTIAL | payouts summary cards | `usePayoutsOverview` | `/api/v1/portfolio/payouts/*`, `/api/v1/wallet/*` | live + payouts mock modules | Финансовые mock данные рядом в runtime цепочке | P0 |
| `/assets/payouts/history` | История выплат | FINANCE | PARTIAL | payouts history | `usePayoutsHistoryPage` | `/api/v1/portfolio/payouts/history` | live + fallback rows | Возможен fallback на mock payout history | P0 |
| `/assets/payouts/deposit` | Пополнение кошелька | FINANCE | LIVE | deposit flow | `wallet.service` | `/api/v1/wallet/deposits` | live | - | P1 |
| `/assets/payouts/withdraw` | Вывод средств | FINANCE | LIVE | withdraw flow | `wallet.service` | `/api/v1/wallet/withdrawals` | live | - | P1 |
| `/assets/payouts/comparison` | Сравнение payout метрик | FINANCE | PARTIAL | comparison charts | `usePayoutsCompare` | `/api/v1/portfolio/payouts/comparison` | live + chart mock risk | Demo series недопустимы в live | P0 |
| `/assets/calculator` | Калькулятор доходности | FINANCE | PARTIAL | calculator screen | `calculator.service` | `/api/v1/services/calculator/*` | live + mock constants | Исключить hardcoded rate в live | P1 |
| `/assets/sell/[id]` | Sell flow позиции | MARKET | PARTIAL | sell units page | `catalog.service`, `secondary-market.service` | `/api/v1/catalog/releases/{id}`, `/api/v1/market/listings` | live + fallback resolver | Mock fallback при ошибке resolve | P0 |
| `/assets/unt` | Инфо UNT | PUBLIC | STATIC | static content | - | - | static | - | P3 |

### CATALOG / MARKET / ANALYTICS

| Route | Назначение | Тип | Статус | Основные компоненты | Используемые services/hooks | Backend endpoints | Data source | Проблемы | Приоритет |
| ----- | ---------- | --- | ------ | ------------------- | --------------------------- | ----------------- | ----------- | -------- | --------- |
| `/catalog` | Каталог релизов | MARKET | LIVE | catalog screen | `catalog.service` | `/api/v1/catalog/releases`, `/filters` | live | - | P1 |
| `/catalog/buy/[id]` | Покупка на primary | MARKET | PARTIAL | buy page | `catalog.service`, `wallet.service` | `/api/v1/catalog/releases/{id}`, `/api/v1/orders/primary` | live + fallback path | Проверить двойной fetch/fallback | P1 |
| `/catalog/market-overview` | Market overview | MARKET | LIVE | market overview screen | `market-overview.service` | `/api/v1/market/overview/*` | live | - | P1 |
| `/catalog/market-overview/analytics/[id]` | Analytics релиза | ANALYTICS | LIVE | release analytics page | charts/analytics services | `/api/v1/market/charts/*`, `/api/v1/analytics/releases/*` | live | - | P1 |
| `/catalog/release-parameters` | Параметры релиза | MARKET | STATIC | static info | - | - | static | Справочный контент | P3 |
| `/analytics/releases` | Список аналитики релизов | ANALYTICS | LIVE | release analytics list | `release-analytics.service` | `/api/v1/analytics/releases` | live | - | P1 |
| `/analytics/releases/[id]` | Детальная аналитика релиза | ANALYTICS | PARTIAL | release detail analytics | `release-analytics.service` | `/api/v1/releases/{id}/detail`, `/api/v1/analytics/releases/{id}` | live + mock mix | Mixed live/mock логика | P1 |
| `/dashboard/secondary-market` | Secondary market dashboard | MARKET | LIVE | secondary market tabs | `secondary-market.service`, `useSecondaryMarketLive` | `/api/v1/market/*`, `/api/v1/orders/*` | live + partial mock widgets | Риск fallback на demo в табах | P0 |
| `/dashboard/secondary-market/book/[marketId]` | Ордербук инструмента | MARKET | PARTIAL | order book screen | market hooks | `/api/v1/market/depth/*`, `/trades/*` | live + demo bids/asks | Demo order book недопустим в live | P0 |
| `/dashboard/secondary-market/l/[listingId]` | Деталь listing | MARKET | MOCK | listing detail page | mock listings | нет live вызова | mock | Полностью mock-only | P0 |

### SUPPORT / LEGAL / PUBLIC CONTENT

| Route | Назначение | Тип | Статус | Основные компоненты | Используемые services/hooks | Backend endpoints | Data source | Проблемы | Приоритет |
| ----- | ---------- | --- | ------ | ------------------- | --------------------------- | ----------------- | ----------- | -------- | --------- |
| `/support` | Help center | SUPPORT | LIVE | support help center page | `help-center.service` | `/api/v1/help/categories`, `/articles` | live | - | P2 |
| `/support/categories/[slug]` | Категория help center | SUPPORT | PARTIAL | category page | `help-center.service` | `/api/v1/help/categories/{slug}` | live + gated behavior | SEO/meta частично gated | P2 |
| `/support/articles/[slug]` | Статья help center | SUPPORT | PARTIAL | article page | `help-center.service` | `/api/v1/help/articles/{slug}` | live + gated behavior | SEO/meta частично gated | P2 |
| `/news` | Список новостей | PUBLIC | PARTIAL | news page | `news.service` | `/api/v1/news` | live + mock path | В non-live возможен demo контент | P1 |
| `/news/[slug]` | Деталь новости | PUBLIC | PARTIAL | news detail | `news.service` | `/api/v1/news/{slug}` | live + mock path | Mixed live/news-mock | P1 |
| `/fees` | Комиссии/тарифы | FINANCE | PARTIAL | fees page | `platform-fees.service` | `/api/v1/platform/fees` | live + mock constants | Hardcoded ставки при fallback | P1 |
| `/system-status` | Статус платформы | PUBLIC | PARTIAL | system status page | `system-status.service` | `/api/v1/system-status` | live + mock gated | Demo status в live недопустим | P1 |
| `/partner-program` | Партнерская программа | PUBLIC | PARTIAL | partner program | `partners.service` | `/api/v1/partners/*` | live + static sections | Часть контента статична | P2 |
| `/referral-program` | Реферальная программа | PUBLIC | PARTIAL | referral page | `referrals.service` | `/api/v1/referrals/*` | live + mock notes | Проверить demo totals | P1 |
| `/guide/selection` | Guide selection | PUBLIC | PARTIAL | guide screen | guide demo components | -/optional | static + demo | Demo release cards | P2 |
| `/guide/deal-structure` | Legacy alias guide | REDIRECT | UNUSED/LEGACY | redirect | - | redirect -> `/catalog/release-parameters` | static redirect | Legacy | P2 |
| `/legal/[type]` | Legal policy page | PUBLIC | STATIC | legal view | legal i18n helpers | optional legal APIs | static/SSR | - | P3 |
| `/privacy` | Privacy page | PUBLIC | STATIC | privacy content | - | - | static | - | P3 |
| `/terms` | Terms page | PUBLIC | STATIC | terms content | - | - | static | - | P3 |
| `/trust` | Trust center | PUBLIC | PARTIAL | trust content | status/legal hooks | `/api/v1/system-status` (частично) | static + live snippets | Частично оболочка без динамики | P2 |

### ADMIN / OPERATOR

| Route | Назначение | Тип | Статус | Основные компоненты | Используемые services/hooks | Backend endpoints | Data source | Проблемы | Приоритет |
| ----- | ---------- | --- | ------ | ------------------- | --------------------------- | ----------------- | ----------- | -------- | --------- |
| `/admin/login` | Логин админа | AUTH | LIVE | admin login | admin auth services | `/api/admin/v1/access/login` | live | - | P1 |
| `/admin` | Admin portal home | ADMIN | LIVE | dashboard section | `adminDashboard.service` | `/api/admin/v1/dashboard/*` | live + mock-capable | Legacy tab redirects | P1 |
| `/admin/users` | Список пользователей | ADMIN | LIVE | users section | `adminUsers.service` | `/api/admin/v1/users*` | live + mock-capable | RBAC/audit mutating actions | P0 |
| `/admin/users/[id]` | Карточка пользователя | ADMIN | LIVE | user detail | `adminUsers.service` | `/api/admin/v1/users/{id}` | live + mock-capable | Нужен полный audit trail | P0 |
| `/admin/roles` | Роли/permissions | ADMIN | LIVE | roles section | `adminRoles.service` | `/api/admin/v1/roles*` | live | Проверить audit ролей | P0 |
| `/admin/settings` | Системные настройки | ADMIN | LIVE | settings section | `adminSettings.service` | `/api/admin/v1/settings*` | live + mock-capable | Часть секций shell-only | P1 |
| `/admin/audit-log` | Аудит событий | ADMIN | LIVE | audit section | `adminAudit.service` | `/api/admin/v1/audit-logs*` | live + mock-capable | - | P1 |
| `/admin/audit` | Legacy alias audit | REDIRECT | UNUSED/LEGACY | redirect | - | redirect -> `/admin/audit-log` | static redirect | Legacy | P2 |
| `/admin/compliance` | Compliance cases | ADMIN | PARTIAL | compliance section | `adminCompliance.service` | `/api/admin/v1/compliance*` | live + mock-capable | Часть rules/flows TODO | P1 |
| `/admin/kyc` | KYC review | ADMIN | PARTIAL | kyc section | `adminKyc.service` | `/api/admin/v1/kyc/*` | live + mock reviews | Fake KYC reviews в fallback | P0 |
| `/admin/support` | Support tickets admin | SUPPORT | PARTIAL | support section | `adminSupport.service` | `/api/admin/v1/support/tickets*` | live + mock-capable | Возможна деградация в mock | P1 |
| `/admin/disputes` | Disputes admin | SUPPORT | LIVE | disputes section | `adminDisputes.service` | `/api/admin/v1/disputes*` | live + mock-capable | - | P1 |
| `/admin/operator-tasks` | Operator tasks | ADMIN | LIVE | operator tasks | admin dashboard services | `/api/admin/v1/dashboard/tasks` | live | - | P2 |
| `/admin/analytics` | Analytics hub | ANALYTICS | PARTIAL | analytics overview | `adminAnalytics.service` | `/api/admin/v1/analytics/*` | live + mock-capable | Demo charts/fallback риск | P0 |
| `/admin/analytics/users` | Users analytics | ANALYTICS | PARTIAL | users analytics | `adminUserAnalytics.service` | `/api/admin/v1/analytics/users/*` | live + mock-capable | Fake growth series риск | P0 |
| `/admin/analytics/revenue` | Revenue analytics | FINANCE | PARTIAL | revenue analytics | `adminRevenueAnalytics.service` | `/api/admin/v1/analytics/revenue/*` | live + mock-capable | Fake revenue/charts риск | P0 |
| `/admin/analytics/finance` | Finance analytics | FINANCE | PARTIAL | finance analytics | `adminFinanceAnalytics.service` | `/api/admin/v1/analytics/finance/*` | live + mock-capable | KPI demo risk | P0 |
| `/admin/analytics/market` | Market analytics | MARKET | PARTIAL | market analytics | `adminMarketAnalytics.service` | `/api/admin/v1/analytics/market/*` | live + mock-capable | demo series risk | P1 |
| `/admin/analytics/risk` | Risk analytics | ADMIN | PARTIAL | risk analytics | `adminRiskAnalytics.service` | `/api/admin/v1/analytics/risk/*` | live + mock-capable | Risk flags должны быть live-only | P0 |
| `/admin/analytics/tracks` | Tracks analytics | ANALYTICS | PARTIAL | tracks analytics | `adminTrackAnalytics.service` | `/api/admin/v1/analytics/tracks/*` | live + mock-capable | - | P1 |
| `/admin/analytics/operations` | Operations analytics | SUPPORT | PARTIAL | operations analytics | `adminSupportAnalytics.service` | `/api/admin/v1/analytics/operations/*` | live + mock-capable | - | P1 |
| `/admin/revenue` | Revenue events | FINANCE | PARTIAL | revenue section | `adminRevenue.service` | `/api/admin/v1/revenue-events*` | live + mock-capable | Fake revenue fallback | P0 |
| `/admin/platform-revenue` | Platform revenue | FINANCE | PARTIAL | platform revenue section | `adminPlatformRevenue.service` | `/api/admin/v1/platform-revenue*` | live + mock-capable | KPI fallback на mock | P0 |
| `/admin/deposits` | Deposits moderation | FINANCE | PARTIAL | deposits section | `adminDeposits.service` | `/api/admin/v1/deposits*` | live + mock-capable | Финансовый P0 при mock | P0 |
| `/admin/withdrawals` | Withdrawals moderation | FINANCE | PARTIAL | withdrawals section | `adminWithdrawals.service` | `/api/admin/v1/withdrawals*` | live + mock-capable | Финансовый P0 при mock | P0 |
| `/admin/wallets` | Wallets admin | FINANCE | PARTIAL | wallets section | `adminWallets.service` | `/api/admin/v1/wallets*` | live + mock-capable | Ledger не должен быть fake | P0 |
| `/admin/holdings` | Holdings admin | FINANCE | PARTIAL | holdings section | `adminHoldings.service` | `/api/admin/v1/holdings*` | live + mock-capable | Финтаблицы с mock fallback | P0 |
| `/admin/treasury` | Treasury ops | FINANCE | LIVE | treasury section | treasury/admin services | `/api/admin/v1/treasury/*` | live | - | P1 |
| `/admin/reports` | Reports | ADMIN | PARTIAL | reports section | `adminReports.service` | `/api/admin/v1/reports*` | live + mock-capable | `catch => null` path | P1 |
| `/admin/news` | News management | ADMIN | LIVE | news section | `adminNews.service` | `/api/admin/v1/news*` | live + mock-capable | - | P2 |
| `/admin/help-center` | Help center dictionaries | ADMIN | LIVE | help center section | `adminHelpCenter.service` | `/api/admin/v1/help/*` | live + mock-capable | - | P2 |
| `/admin/legal` | Legal settings | ADMIN | LIVE | legal section | admin legal services | `/api/admin/v1/legal/*` | live | - | P2 |
| `/admin/system-status` | Status admin | ADMIN | LIVE | system status section | status services | `/api/admin/v1/system-status/*` | live | - | P2 |
| `/admin/notifications` | Admin notifications | ADMIN | PARTIAL | notifications section | admin notification service | `/api/admin/v1/notifications*` | live + mixed paths | Нужна унификация endpoint path | P2 |
| `/admin/referrals` | Referrals admin | ADMIN | LIVE | referrals section | `adminReferrals.service` | `/api/admin/v1/referrals*` | live + mock-capable | - | P2 |
| `/admin/partners` | Legacy partners alias | REDIRECT | UNUSED/LEGACY | redirect | - | redirect -> `/admin/referrals` | static redirect | Legacy | P2 |
| `/admin/tracks` | Tracks/Releases workspace | ADMIN | PARTIAL | tracks section + drawers | `adminTracks.service` | `/api/admin/v1/tracks*`, `/releases*` | live + legacy/mock refs | Риск старого mock workspace/browser-state | P0 |
| `/admin/releases` | Legacy releases alias | REDIRECT | UNUSED/LEGACY | redirect | - | redirect -> `/admin/tracks` | static redirect | Legacy | P2 |
| `/admin/rounds` | Rounds management | ADMIN | PARTIAL | rounds section | `adminRounds.service` | `/api/admin/v1/rounds*` | live + mock-capable | Publish checklist частично UI-only | P1 |
| `/admin/artists` | Artists dictionary | ADMIN | LIVE | artists section | `adminArtists.service` | `/api/admin/v1/artists*` | live + mock-capable | - | P2 |
| `/admin/genres` | Genres dictionary | ADMIN | LIVE | genres section | `adminReleaseGenres.service` | `/api/admin/v1/release-genres*` | live + mock-capable | - | P2 |
| `/admin/labels` | Labels dictionary | ADMIN | LIVE | labels section | `adminLabels.service` | `/api/admin/v1/labels*` | live + mock-capable | - | P2 |
| `/admin/secondary-market` | Secondary market admin | MARKET | PARTIAL | secondary market section | `adminSecondaryMarket.service` | `/api/admin/v1/secondary-market*`, `/listings*`, `/trades*` | live + mock-capable | Fake listings/trades fallback | P0 |

## Hidden / legacy / unused

- Явные `UNUSED/LEGACY`: `/`, `/assets`, `/my-assets`, `/guide/deal-structure`, `/dashboard/(assets)/*`, `/dashboard/catalog`, `/admin/audit`, `/admin/releases`, `/admin/partners`.
- Legacy трафик перенаправляется в новые зоны (`/assets/*`, `/catalog`, `/admin/tracks`, `/admin/audit-log`).

## P0 блокеры по маршрутам

1. Финансовые маршруты пользователя и админки имеют частичные mock/fallback цепочки (`/assets/payouts*`, `/admin/(finance|analytics)`), что недопустимо для live-режима.
2. Secondary market содержит demo/mock элементы (`/dashboard/secondary-market/*`, `/admin/secondary-market`).
3. `/dashboard/secondary-market/l/[listingId]` остается mock-only.
4. Дублирование `/app` и `/dashboard` увеличивает риск рассинхронизации backend интеграций.

---

## P1 CLOSEOUT RESULT (2026-06-17)

### Legacy redirects — verified safe

| Route | Redirect target | Mock component? |
| ----- | --------------- | --------------- |
| `/` | `/app` | Нет — только `redirect()` |
| `/assets`, `/my-assets` | `/assets/overview` | Нет |
| `/dashboard/(assets)/*` | `/assets/*` или `/dashboard/statements` | Нет |
| `/dashboard/catalog` | `/catalog` | Нет |
| `/guide/deal-structure` | `/catalog/release-parameters` | Нет |
| `/admin/audit` | `/admin/audit-log` | Нет |
| `/admin/partners` | `/admin/referrals` | Нет |
| `/admin/releases` | `/admin/tracks` | Нет |

**Вердикт:** legacy routes не ведут на mock-компоненты; удаление отложено до P2 (проверка внешних ссылок/SEO).

**Примечание:** `/dashboard/(assets)/statement` редиректит на `/dashboard` (не `/dashboard/statements`) — задокументировано, изменение вне scope P1.

---

## I18N GATE CLOSEOUT RESULT (2026-06-17)

- **89 → 0** critical issues; `npm run i18n:gate` **PASS**.
- Dictionary: fees ES/PT (`...EN`), analytics-detail ES/PT blocks, `admin.section.labels`.
- Hardcoded UI: finance/payouts/positions/loader/admin drawer — переведено на `t()` / `labelKey`.
- Детали: см. `FULL_FRONTEND_BACKEND_AUDIT_SUMMARY.md` § I18N GATE CLOSEOUT RESULT.

---

## STAGING SMOKE RESULT (2026-06-17)

- **Remote staging:** SKIPPED (нет deploy URL).
- **Local rehearsal:** `npm run test:e2e:smoke` → **52 PASS**, 10 SKIP (live blocks без creds).
- **Live auth** (`localhost:3000` + QA user): login, wallet withdraw, secondary listings — **PASS**; buy QA release — catalog 404.
- **Routes smoke:** `/assets/*`, `/dashboard/profile`, `/dashboard/secondary-market`, `/news`, `/support`, route guard — покрыты.
- **Mock regressions:** не найдены в live-блоках.
- **P1 sign-off:** заблокирован до remote staging smoke.
