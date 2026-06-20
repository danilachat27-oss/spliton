# Frontend pages overview

> Аналитический документ по текущему состоянию frontend RevShare Platform.  
> Дата: 29.05.2026. Код не изменялся — только описание существующей реализации.

---

## 1. Общая структура проекта

### Стек

| Слой | Технология |
|------|------------|
| Framework | **Next.js 16** (App Router, file-based routing) |
| UI | **React 19**, TypeScript 5 |
| Стили | **Tailwind CSS 4**, `globals.css`, `styles/surfaces.css` |
| Компоненты | shadcn/ui (`components/ui/`), @base-ui/react, lucide-react |
| Анимации | framer-motion (админка, переходы вкладок) |
| Шрифты | Inter + Geist Mono (`next/font`) |
| HTTP | Native `fetch`, cookie-based auth |
| Backend URL | `NEXT_PUBLIC_API_BASE_URL` → default `http://localhost:3001` |

### Расположение кода

```
apps/frontend/
├── app/              # Страницы (App Router)
├── components/       # Общие UI: auth, dashboard, layout, market-overview, profile, support
├── features/         # Фичи: admin, analytics, catalog, guide, assets/sell-units
├── constants/        # routes, nav, mock-контент
├── services/         # auth.service.ts, admin.service.ts
├── lib/              # Утилиты, pricing, catalog helpers
├── hooks/            # (минимально; логика в feature hooks)
├── mocks/            # Mock-данные домена
├── types/            # TypeScript типы
└── store/            # Пустой/минимальный — глобального store нет
```

### Архитектурная модель

```
┌─────────────────────────────────────────────────────────┐
│  Next.js App Router (47 page.tsx, ~35+ живых экранов)   │
├─────────────────────────────────────────────────────────┤
│  AuthProvider (React Context) ──► auth.service.ts        │
│  AdminLayoutClient ────────────► admin.service.ts        │
│  authorizedFetch — экспортирован, но НЕ используется    │
├─────────────────────────────────────────────────────────┤
│  Screen hooks (useCatalog*, useMarket*, useRelease*)    │
│  → фильтрация/сортировка статических mock в памяти      │
├─────────────────────────────────────────────────────────┤
│  mocks/, *-mock-data.ts, lib/catalog-mock.ts            │
│  (связаны по release id "1"…"10" между разделами)        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
              Backend :3001 (auth + admin/access только)
```

### Защита маршрутов

- **Нет** `middleware.ts` — защита только на клиенте.
- **`AuthGuard`** (root layout): неавторизованных редиректит на `/login`, кроме public paths.
- **Public paths:** `/`, `/app`, `/app/*`, `/login`, `/register`, `/verify-email`, `/forgot-password`, `/terms`, `/privacy`.
- **Admin:** роль `ADMIN` в `user.roles` + `GET /admin/access` на сервере.

### Layouts

| Layout | Пути | Назначение |
|--------|------|------------|
| `app/layout.tsx` | Все | Root, AuthGuard, AppProviders, footer |
| `app/(home)/layout.tsx` | `/` | Чёрный фон (redirect → `/app`) |
| `app/assets/layout.tsx` | `/assets/*` | Светлый кабинет + DashboardHeader |
| `app/dashboard/layout.tsx` | `/dashboard/*` | Тёмный full-page wrapper |
| `app/catalog/layout.tsx` | `/catalog/*` | Тёмный CRM-shell каталога |
| `app/analytics/releases/layout.tsx` | `/analytics/releases/*` | Тёмная аналитика |
| `app/guide/selection/layout.tsx` | `/guide/selection` | Тёмный guide shell |
| `app/admin/layout.tsx` | `/admin` | AdminLayoutClient (sidebar + header) |

### Адаптив

- Mobile-first Tailwind breakpoints (`sm`, `md`, `lg`, `xl`).
- Каталог: sidebar фильтров → stack на mobile (`lg:flex-row`).
- Таблицы: горизонтальный scroll (`overflow-x-auto`, `min-w-[860px]`).
- Mega-menu навигация в header — desktop; mobile burger/drawer в DashboardHeader.
- Админка: collapsible sidebar (52px collapsed / 260px expanded).

---

## 2. Карта роутов

| Route | Page | Role | Status | Description |
|-------|------|------|--------|-------------|
| `/` | Redirect → `/app` | guest | redirect | Legacy entry |
| `/app` | Главная кабинета | guest/user | **mock UI** | Hero, stats, catalog preview, payouts block |
| `/login` | Вход | guest | **API** | Email/password, 2FA challenge, Google stub |
| `/register` | Регистрация | guest | **API** | 3-step wizard: email → OTP → password |
| `/verify-email` | Подтверждение email | guest | **API** | OTP ввод, resend |
| `/forgot-password` | — | guest | **missing** | В constants, страницы нет |
| `/terms` | — | guest | **missing** | В constants + AuthGuard public |
| `/privacy` | — | guest | **missing** | В constants + AuthGuard public |
| `/catalog` | Каталог релизов | user | **mock** | Grid funding + secondary cards, фильтры |
| `/catalog/buy/[id]` | Покупка UNT | user | **mock** | Order panel, random approve/decline |
| `/catalog/release-parameters` | Параметры релиза (edu) | user | **static** | Объяснение полей карточки |
| `/catalog/market-overview` | Обзор рынка | user | **mock** | Таблица релизов, фильтры, sparklines |
| `/catalog/market-overview/analytics/[id]` | Аналитика из каталога | user | **mock** | Hero metrics, liquidity, payout insights |
| `/analytics/releases` | Аналитика релизов | user | **mock** | Таблица сравнения, фильтры, watchlist |
| `/analytics/releases/[id]` | Детальная карточка релиза | user | **mock** | Charts, payout history, FAQ; `?view=ledger` |
| `/guide/selection` | Гид по выбору | user | **static** | Образовательный контент |
| `/guide/deal-structure` | Redirect | user | redirect | → `/catalog/release-parameters` |
| `/assets` | Redirect | user | redirect | → `/assets/overview` |
| `/assets/overview` | Сводка holdings | user | **mock** | TVL, positions, structure cards |
| `/assets/metrics` | Метрики портфеля | user | **mock** | Charts по genre/status |
| `/assets/positions` | Список позиций | user | **mock** | Таблица holdings + charts |
| `/assets/activity` | Активность | user | **mock** | Ledger: deposits, purchases, trades |
| `/assets/payouts` | Обзор выплат | user | **mock** | Accrual chart |
| `/assets/payouts/comparison` | Сравнение периодов | user | **mock** | Balance scale comparison |
| `/assets/payouts/history` | История выплат | user | **mock** | Таблица начислений |
| `/assets/payouts/deposit` | Пополнение USDT | user | **mock** | 3-step wizard, TRC20 address |
| `/assets/payouts/withdraw` | Вывод USDT | user | **mock** | 3-step wizard, заявка не отправляется |
| `/assets/calculator` | Калькулятор | user | **mock** | Расчёт покупки/продажи/вывода |
| `/assets/unt` | Что такое UNT | user | **static** | Explainer |
| `/assets/sell/[id]` | Продажа UNT (listing) | user | **mock** | Создание лимитного ордера |
| `/dashboard/profile` | Профиль | user | **mock** | Overview, settings, security, KYC UI |
| `/dashboard/secondary-market` | Вторичный рынок | user | **mock** | 6 tabs via `?tab=` |
| `/dashboard/secondary-market/l/[listingId]` | Карточка лота | user | **mock** | Параметры listing |
| `/dashboard/secondary-market/book/[marketId]` | Стакан | user | **mock** | Order book terminal (mnr/sgn/vlt) |
| `/support` | Поддержка | user | **mock UI** | Chat widget (local messages) |
| `/fees` | Комиссии | user | **static mock** | Таблица тарифов + FAQ |
| `/system-status` | Статус системы | user | **static mock** | Health/incidents |
| `/news` | Новости | user | **static mock** | Статьи продукта |
| `/referral-program` | Реферальная программа | user | **static mock** | Ссылка, tiers, stats |
| `/partner-program` | Партнёрская программа | user | **static mock** | Форматы, заявка (UI) |
| `/admin` | Панель оператора | admin | **partial API** | 7 tabs, все данные mock |
| `/admin?tab=*` | Admin tabs | admin | **mock** | releases/investors/finances/… |
| `/my-assets` | Redirect | user | redirect | → `/assets/overview` |
| `/calculator` | Redirect (config) | user | redirect | → `/assets/calculator` |
| `/dashboard` | Redirect | — | redirect | → `/app` |
| `/dashboard/catalog` | Redirect | — | redirect | → `/catalog` |
| `/dashboard/(assets)/*` | Redirects | — | redirect | → `/assets/*` |
| `/dashboard/statement` | Redirect | — | redirect | → `/app` (legacy stub) |

---

## 3. Public / Guest pages

### `/app` — Главная кабинета

| Поле | Значение |
|------|----------|
| **URL** | `/app` |
| **Роль** | guest (public path!) / user |
| **Цель** | Landing внутри продукта: обзор платформы, CTA в каталог и выплаты |
| **Статус** | UI готов, данные mock |

**Блоки:**
- `DashboardHeader` — mega-menu навигация
- `DashboardHero` — заголовок, CTA
- `DashboardStats` — KPI (TVL, выплаты, users)
- `DashboardValueGrid` — value props
- `DashboardCatalog` — превью карточек релизов
- `DashboardPayouts` — блок выплат
- `DashboardUnifiedJourneyBlock` — user journey
- `DashboardMarketsRow` — secondary snapshot
- `DashboardLandingCta` — финальный CTA

**Данные (mock):** stats из компонентов landing, catalog preview из `lib/catalog-mock.ts`.

**Действия:** переходы по ссылкам (каталог, выплаты, secondary). Покупка недоступна без auth на `/catalog`.

**Состояния:** статичный контент, без loading/error.

**Риск:** страница **public** — guest видит «кабинет» с mock-данными, но `/catalog` требует login → разрыв UX.

---

## 4. Auth pages

### `/login` — Вход

| Поле | Значение |
|------|----------|
| **Роль** | guest |
| **API** | `POST /auth/login`, `POST /auth/2fa/verify`, `POST /auth/email/resend` |

**Форма:**
- Email, password (toggle visibility)
- Checkbox «Запомнить»
- Google OAuth button → **stub** (`signInWithGoogle` throws)
- 2FA step: OTP input при challenge

**CTA:** «Войти», «Зарегистрироваться», «Забыли пароль?» (ссылка на `/forgot-password` — **404**)

**Состояния:**
- loading (`isSubmitting`)
- error (неверный пароль, email not verified)
- 2FA pending
- success → redirect `/app`

**Компоненты:** `LoginForm`, `AuthSplitLayout`, `BrandPanel`

---

### `/register` — Регистрация

| Поле | Значение |
|------|----------|
| **Роль** | guest |
| **API** | `POST /auth/register`, `POST /auth/email/resend` |

**Wizard (3 шага):**
1. Email + suggestions
2. OTP verification (`RegisterOtpStep`)
3. Password + accept terms

**CTA:** Continue, Back, «Уже есть аккаунт» → login

**Состояния:** step progress, validation errors, OTP loading, success → verify-email или login

**Компоненты:** `RegisterPageShell`, `RegisterForm`, `useRegisterFlow`

---

### `/verify-email` — Подтверждение email

| Поле | Значение |
|------|----------|
| **API** | `POST /auth/email/verify`, `POST /auth/email/resend` |

**Форма:** OTP code input

**Состояния:** loading (Suspense fallback), success, error, resend cooldown

---

### Отсутствующие auth-страницы

| Route | Статус |
|-------|--------|
| `/forgot-password` | **Не реализована** (ссылка есть в login) |
| `/terms` | **Не реализована** |
| `/privacy` | **Не реализована** |

---

## 5. User dashboard pages

### `/assets/overview` — Сводка holdings

| Поле | Значение |
|------|----------|
| **Роль** | user |
| **Mock** | `components/my-assets/overview/mock-data.ts`, `assets-mock-data.ts` |

**Блоки:**
- `OverviewSectionTabs` — навигация подразделов assets
- `OverviewHero` — TVL 6 520 USDT, CTA (каталог, позиции, sell, secondary)
- `AssetsStatRow` — активных релизов, UNT, крупнейшая позиция
- `TopPositionsCard` — топ holdings
- `PositionsStructureCards` — breakdown по genre/status
- `AssetsInfoNote` — disclaimer

**Данные:** earned_total, positions, structure — **hardcoded mock**.

**Действия:** ссылки на catalog, positions, sell/[id], secondary market.

**Состояния:** empty activity array в mock; UI не показывает empty state явно.

---

### `/assets/metrics` — Метрики

**Блоки:** genre pie chart, status breakdown, stat cards.  
**Mock:** `assets-mock-data.ts`, `positions-charts.tsx`.

---

### `/assets/positions` — Позиции

**Блоки:** таблица positions, charts, filters.  
**Данные:** `positionPreviews` — release, artist, units, status, value, `catalogReleaseId`.  
**Действия:** переход на sell, analytics, buy.

---

### `/assets/activity` — Активность

**Блоки:** ledger таблица.  
**Типы операций:** deposit, purchase units, secondary trade, withdrawal, payout.  
**Mock:** `activity-mock-data.ts`.

---

### `/assets/payouts/*` — Выплаты (подраздел)

#### Обзор `/assets/payouts`
- Accrual chart (динамика начислений)
- Mock summary: earned_total 1 482.60, available 286.40, pending 120.00

#### Сравнение `/assets/payouts/comparison`
- Balance scale — два периода side-by-side

#### История `/assets/payouts/history`
- Таблица: date, release, type, units share, amount, status
- Статусы: Начислено, Доступно, В обработке, Выплачено

#### Пополнение `/assets/payouts/deposit`
- **3-step wizard:** crypto → network (TRC20) → address + QR placeholder
- Таблица истории депозитов: pending/completed/failed
- **Mock address:** `TP5eB1Af8zqufUFFDBuuT5shfbBveo3`
- Кнопки Export / Вся история — **без действия**

#### Вывод `/assets/payouts/withdraw`
- **3-step wizard:** crypto → TRC20 address → amount
- Meta: fee 0.15 USDT, min 10 USDT
- CTA «Отправить заявку» — **mock**, явная подпись «заявка не отправляется»
- История: pending/approved/rejected

**Компоненты:** `PayoutDepositCard`, `PayoutWithdrawCard`, `PayoutFlowFaqList`, wizard primitives.

---

## 6. Track / Deal pages

### Guest/User flow: каталог → покупка

```
/catalog → фильтры → карточка → /catalog/buy/[id] → modal result
                ↓
    /analytics/releases/[id]  (детальная аналитика)
                ↓
    /catalog/market-overview/analytics/[id]
```

### `/catalog` — Каталог релизов

| Поле | Значение |
|------|----------|
| **Роль** | user (auth required) |
| **Mock** | `lib/catalog-mock.ts` |

**Блоки:**
- `CatalogFiltersAside` — search, kind (funding/market), phase, genre, price range, progress, yield, sort
- `CatalogMainArea` — grid/list cards

**Карточки funding:** title, artist, genre, raised/goal, progress %, available %, forecast yield  
**Карточки market (secondary):** share price, change, last payout

**Действия:** фильтрация, sort, CTA «Купить UNT» / «На вторичке» / analytics link

**Hook:** `useCatalogScreenState()` — client-side filter over static array

---

### `/catalog/buy/[id]` — Покупка units (revenue share round)

| Поле | Значение |
|------|----------|
| **Mock** | `MarketOverviewRow` by catalog id |
| **Pricing** | `getPrimaryUnitPriceUsdt`, `primaryOrderTotalUsdt` |

**Блоки:**
- Sidebar: цена UNT, available units, условия покупки
- `CatalogBuyUnitsOrderPanel`: pay USDT ↔ receive UNT, quick buttons 25/50/Max
- CTA «Оплатить»

**Форма:** сумма USDT (editable) ↔ количество UNT (linked calculation)

**Modal:** `BuyUnitsPaymentResultModal` — approved/declined (**random 75/25**), fake transactionId

**Параметры трека (из mock row):**
- title, artist, symbol
- availableUnits, primaryUnitPriceUsdt
- yieldPct, payoutsUsdt, status
- *(distribution_share, raise_target, hard_cap — в release detail / admin mock, не на buy screen)*

**Empty state:** available_units = 0 → сообщение без формы

**API needed:** `POST /orders` (primary purchase), wallet balance check, platform fee

---

### `/catalog/release-parameters` — Образовательная страница

**Цель:** объяснить поля карточки релиза (units, investor_share, raise target, payout model, secondary).  
**Контент:** static + example card.  
**Не редактирует** реальные треки.

---

### `/catalog/market-overview` — Обзор рынка

**Блоки:** filters, insights, secondary snapshot, interactive table  
**Mock:** `mocks/market-overview-rows.ts` (~10 releases)  
**Hook:** `useMarketOverviewState()`  
**Данные row:** symbol, title, artist, yieldPct, payoutsUsdt, availableUnits, primaryUnitPriceUsdt, sparkline, categories

**Действия:** sort, filter by category, drill-down `?release=id`, link to analytics

---

### `/analytics/releases` — Аналитика релизов

**Блоки:** filters toolbar, table, watchlist toggle  
**Mock:** `mocks/analytics/releases.mock.ts` (derived from market overview)  
**Hook:** `useReleaseAnalyticsState()`

---

### `/analytics/releases/[id]` — Детальная страница трека

**Блоки:**
- Hero (cover, symbol, artist, key metrics)
- Performance charts (periods 24h/7d/30d/90d)
- Payout history table (gross → pool share → per unit → holders)
- About, FAQ
- Personal ledger view (`?view=ledger`) — mock заявки/позиция пользователя

**Mock builder:** `lib/analytics/release-detail.ts` + `mocks/analytics/release-detail.mock.ts`

**CTA:** Buy UNT, secondary, watchlist, back navigation with `?from=`

---

### `/assets/sell/[id]` — Создание listing (transfer of rights)

**Flow:** выбор holdings → limit price → quantity → confirm → redirect to secondary orders  
**Mock:** `getHoldingPreviewForCatalogReleaseId`, suggested ask = primary * 1.015  
**Компонент:** `AssetsSellUnitsOrderPanel`  
**API needed:** `POST /listings` or orders on secondary

---

## 7. Wallet / Deposit / Withdraw pages

### Wallet flow (текущая реализация)

```
/assets/payouts (summary mock)
    ├── /deposit  → 3 steps → TRC20 address + history table
    └── /withdraw → 3 steps → submit (mock) + history table
```

### Балансовые поля (mock в payouts-mock-data)

| Поле UI | Mock value | Backend field (expected) |
|---------|------------|--------------------------|
| Начислено всего | 1 482.60 USDT | earned_total |
| Доступно к выводу | 286.40 USDT | available_balance |
| В обработке | 120.00 USDT | locked_balance (withdraw pending) |
| *(нет явно)* | — | withdrawn_total |

### Deposit

| Step | UI | Backend needed |
|------|-----|----------------|
| 1 | Выбор USDT | — |
| 2 | Network TRC20 | — |
| 3 | Address + QR placeholder | `GET /wallets/deposit-address` |
| History | pending/completed/failed | `GET /wallets/deposits` |

**Buy USDT via on-ramp:** в deposit wizard step 1 dropdown — **только USDT**, on-ramp provider **не подключён** (нет MoonPay/Transak UI).

**Deposit manually:** реализован как step 3 (copy address) — без реального copy-to-clipboard API hook.

### Withdraw

| Step | UI | Backend needed |
|------|-----|----------------|
| 1 | USDT | — |
| 2 | TRC20 destination address | validation |
| 3 | Amount + fee preview | `POST /wallets/withdrawals` |
| History | pending/completed/rejected | `GET /wallets/withdrawals` |

---

## 8. Secondary market pages

### `/dashboard/secondary-market?tab=*`

| Tab | ID | Содержание |
|-----|-----|------------|
| Рынок | `market` | Grid listings, link to book |
| Аналитика | `analytics` | Trading analytics per release (`?release=`) |
| Мои ордера | `orders` | Active/completed orders |
| История сделок | `history` | Trade ledger |
| Избранное | `watchlist` | Pinned releases |
| Правила | `rules` | Fees, limits, matching policy |

**Mock:** `mocks/dashboard/secondary-market-listings.mock.ts`, `secondary-market-trading-analytics.mock.ts`

### `/dashboard/secondary-market/l/[listingId]` — Карточка лота

**Данные:** listing params + release detail cross-link  
**Действия:** buy listing (UI), open book, analytics  
**Static params:** pre-generated for mock listing ids

### `/dashboard/secondary-market/book/[marketId]` — Стакан

**Markets:** `mnr`, `sgn`, `vlt`  
**UI:** order book terminal, bid/ask, depth  
**Mock only**

### Secondary market flow (целевой)

```
/listings browse → buy / create listing from /assets/sell/[id]
    → orders tab → trade history
    → platform fee (secondary fee) shown in rules + calculator
```

**Modal:** `SecondaryMarketOrderFeedbackModal` — feedback после действия (mock)

---

## 9. Profile / Settings pages

### `/dashboard/profile?tab=*`

| Tab | Содержание | API |
|-----|------------|-----|
| overview | Account summary, balance row (mock email) | mock |
| settings | Display name, notifications toggles | **needed** |
| security | 2FA toggle, sessions list, password change | **prototype** (local state) |
| verification | KYC steps driven by URL query | **prototype** |

**Mock email:** `inv***@example.com`, ID `RS-8F2A-01C4`

**Security prototype:** `constants/dashboard/profile-security.ts` — sessions, 2FA UI без `POST /auth/2fa/setup`

**Verification prototype:** `constants/dashboard/profile-verification.ts` — states via `?verification=`

**Компоненты:** `ProfileDashboardScreen`, `ProfileSettingsContent`, `ProfileSecurityContent`, `ProfileVerificationContent`

---

## 10. Admin panel concept

### Текущее состояние

- **Одна страница** `/admin` с 7 вкладками через `?tab=`
- **Доступ:** role `ADMIN` + `GET /admin/access`
- **Все CRM данные — mock** (`features/admin/mocks/admin-data.ts`)
- **In-memory CRUD** релизов в `ReleasesTab` (не persists)
- Sidebar nav: `features/admin/config/admin-nav.ts`

### Существующие вкладки (Super Admin prototype)

| Tab | Содержание | Mock entities |
|-----|------------|---------------|
| overview | KPIs, charts, quick tables (withdrawals, deposits, audit) | KPIs, withdrawals, deposits, audit |
| releases | Grid cards + drawer create/edit | AdminReleaseRow |
| investors | Users table | AdminUserRow (название «инвесторы» — см. противоречия) |
| finances | Deposits + withdrawals queues | AdminDepositRow, AdminWithdrawRow |
| payouts | Revenue distributions | AdminPayoutRow |
| market | Secondary trades | AdminMarketRow |
| audit | Audit log | AdminAuditRow |

### Целевая админка по ролям (TO-BE)

#### Super Admin

**Страницы:**
- Dashboard (KPIs, alerts)
- Users (CRUD, roles, ban)
- Tracks/Releases (full CRUD)
- Rounds/Deals (fundraising lifecycle)
- Revenue distribution (run + history)
- Withdrawals (approve/reject)
- Deposits (reconcile)
- Trades (secondary oversight)
- Platform revenue + fee settings
- Staff roles management
- Audit log (full)

**Разрешено:** всё  
**Запрещено:** —

**Таблицы:** users, releases, rounds, deposits, withdrawals, payouts, trades, audit  
**Фильтры:** status, date range, amount, user email, release id  
**Статусы:** draft/listed/paused/settled; pending/approved/rejected; active/suspended

---

#### Accountant / Бухгалтер

**Страницы:**
- Deposits (view + reconcile + export)
- Withdrawals (approve/reject batch)
- Payouts / revenue distributions
- Platform revenue reports
- Balance reconciliation
- Export CSV/XLSX

**Разрешено:** approve/reject withdrawals, mark deposits reconciled, export, view all financials  
**Запрещено:** edit release parameters, change fee settings, user roles, track publishing

**Таблицы:** deposits, withdrawals, payouts, platform fees, user balances (read-only)  
**Фильтры:** status, period, user, tx hash, amount range  
**Статусы:** deposit pending/completed/failed; withdraw pending/completed/rejected

---

#### Content / Track Manager

**Страницы:**
- Tracks list + editor
- Artists
- Release parameters (title, shares, raise_target, hard_cap, promo_budget, artist_upfront, platform_upfront, total_units, status)
- Covers/gallery upload
- Description, genre, territory, ISRC
- Publication status
- Rounds config (without financial settlement)
- Promo budget allocation

**Разрешено:** CRUD track content, images, descriptions, publish/unpublish draft  
**Запрещено:** user withdrawals, deposit approval, fee settings, payout execution

**UI:** reuse `AdminReleaseDrawer` + catalog card visual language  
**Фильтры:** status, phase, genre, artist  
**Статусы:** draft → listed → paused → settled; phases: draft_review → fundraising → post_funded → secondary → payouts

---

#### Support Manager

**Страницы:**
- Users (read-only + search)
- Tickets/appeals
- User activity timeline (deposits, orders, trades)
- Problematic transactions review (read-only flags)

**Разрешено:** view user history, add internal notes, escalate to compliance  
**Запрещено:** change balances, approve withdrawals, edit track financial params

**Таблицы:** users, support tickets, transaction history per user  
**Фильтры:** user email, ticket status, date

---

#### Compliance / Moderator

**Страницы:**
- KYC/AML status board (if enabled)
- Suspicious activity flags
- Block operations (hold withdraw/trade)
- Audit log (read)
- User verification documents (view)

**Разрешено:** block user, hold transaction, request re-KYC  
**Запрещено:** direct balance edits, release financial params

---

### Mapping: текущая admin → будущие роли

| Current tab | Super Admin | Accountant | Content Mgr | Support | Compliance |
|-------------|:-----------:|:----------:|:-----------:|:-------:|:----------:|
| overview | ✓ | partial (finance widgets) | — | — | partial (alerts) |
| releases | ✓ | view | ✓ full | view | view |
| investors | ✓ | view | — | ✓ | ✓ |
| finances | ✓ | ✓ | — | view | view |
| payouts | ✓ | ✓ | — | — | view |
| market | ✓ | view | — | view | view |
| audit | ✓ | view | — | partial | ✓ |

---

## 11. Role-based access matrix

| Page | User | Super Admin | Accountant | Content Manager | Support |
|------|:----:|:-----------:|:----------:|:---------------:|:-------:|
| `/app` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/login`, `/register` | guest | guest | guest | guest | guest |
| `/catalog/*` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/analytics/*` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/assets/*` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/dashboard/secondary-market/*` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/dashboard/profile` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/support`, `/fees`, `/news`, … | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/admin` | ✗ | ✓ | ✗* | ✗* | ✗* |
| Admin: releases edit | ✗ | ✓ | ✗ | ✓ | ✗ |
| Admin: finances | ✗ | ✓ | ✓ | ✗ | view |
| Admin: withdrawals approve | ✗ | ✓ | ✓ | ✗ | hold only |
| Admin: fee settings | ✗ | ✓ | ✗ | ✗ | ✗ |
| Admin: user roles | ✗ | ✓ | ✗ | ✗ | ✗ |

\* *Сейчас только role `ADMIN`; granular roles не реализованы — требуется backend RBAC.*

---

## 12. Components map

### Layout

| Компонент | Путь | Назначение |
|-----------|------|------------|
| `DashboardHeader` | `components/dashboard/dashboard-header.tsx` | Mega-menu, search, profile, auth state |
| `AuthSplitLayout` | `components/layout/auth-split-layout.tsx` | Split brand + form (login/register) |
| `SiteFooter` / `ConditionalSiteFooter` | `components/layout/` | Footer (hidden on catalog, admin, analytics) |
| `AdminSidebar` / `AdminHeader` | `features/admin/components/` | Admin shell |
| `OverviewSectionTabs` | `components/dashboard/assets/overview-section-tabs.tsx` | Sub-nav для /assets/* |
| `PayoutsSectionHeader` | `components/dashboard/assets/payouts-section-header.tsx` | Sub-nav для payouts |

### Cards

| Компонент | Контекст |
|-----------|----------|
| Catalog funding/market cards | `/catalog` |
| `AdminReleaseCatalogCard` | Admin releases |
| `TopPositionsCard`, `PositionsStructureCards` | Assets overview |
| `UpcomingPayoutsCard` | Dashboard landing |
| Market overview top cards | `/catalog/market-overview` |
| Release detail hero cards | Analytics detail |

### Tables

| Компонент | Контекст |
|-----------|----------|
| Market overview table | Catalog market |
| Release analytics table | `/analytics/releases` |
| Positions table | `/assets/positions` |
| Activity ledger | `/assets/activity` |
| Payout history | `/assets/payouts/history` |
| Deposit/withdraw history | deposit/withdraw pages |
| Admin tab tables | finances, payouts, investors, audit |
| Secondary market listings | secondary tab market |
| Trade history | secondary tab history |

### Modals

| Компонент | Контекст |
|-----------|----------|
| `BuyUnitsPaymentResultModal` | Buy UNT result |
| `SecondaryMarketOrderFeedbackModal` | Secondary order feedback |
| `AdminReleaseDrawer` | Admin release create/edit (drawer, не modal) |

### Forms

| Форма | API |
|-------|-----|
| LoginForm | ✓ real |
| RegisterForm (3 steps) | ✓ real |
| VerifyEmailScreen | ✓ real |
| CatalogBuyUnitsOrderPanel | mock submit |
| Payout deposit/withdraw wizards | mock |
| AssetsSellUnitsOrderPanel | mock |
| Profile settings/security | mock/local |
| Admin release drawer | in-memory |

### Empty states

- Buy UNT: `available_units = 0`
- Secondary analytics: unknown release query
- AdminAccessDenied: no admin role
- Register/login: inline error messages
- **Явных dedicated empty-state компонентов мало** — mostly inline text

### Buttons / CTA patterns

- Primary: `bg-zinc-950` / `bg-blue-700` rounded-2xl
- Secondary: bordered pills
- Flow continue: `FlowContinueButton`
- Quick amount: 25/50/Max на buy screen

### Navigation

- `dashboardNavItems` — mega-menu (`components/dashboard/dashboard-nav.ts`)
- `ADMIN_SECTION_NAV` — admin sidebar
- `SECONDARY_MARKET_TABS` — underline tabs
- Profile tabs via `?tab=` query
- Breadcrumbs на buy/sell/analytics pages

### Filters

- `CatalogFiltersAside` — multi-filter sidebar
- `MarketOverviewFilters` — category chips, period
- `ReleaseAnalyticsFiltersToolbar` — genre, status, sort presets
- `AdminFiltersColumn` — per admin tab

---

## 13. API integration map

| Page | Action | API endpoint needed | Status |
|------|--------|---------------------|--------|
| Login | Sign in | `POST /auth/login` | **exists, wired** |
| Login | 2FA verify | `POST /auth/2fa/verify` | **exists, wired** |
| Login | Resend verification | `POST /auth/email/resend` | **exists, wired** |
| Register | Sign up | `POST /auth/register` | **exists, wired** |
| Verify email | Confirm OTP | `POST /auth/email/verify` | **exists, wired** |
| All pages | Session refresh | `POST /auth/refresh` | **exists, wired** |
| All pages | Logout | `POST /auth/logout` | **exists, wired** |
| Profile | Logout all | `POST /auth/logout-all` | **exists, not in UI** |
| All authed | Current user | `GET /users/me` | **exists, wired** |
| Admin | Access check | `GET /admin/access` | **exists, wired** |
| Security | 2FA setup | `POST /auth/2fa/setup` | **exists backend, not wired UI** |
| Security | 2FA disable | `POST /auth/2fa/disable` | **exists backend, not wired UI** |
| Catalog | List releases | `GET /releases` | **exists backend, not wired** |
| Catalog/Buy | Create primary order | `POST /orders` | **needed** |
| Buy | Check wallet balance | `GET /wallets/me` or `/wallets/status` | **status stub exists** |
| Assets overview | Portfolio summary | `GET /holdings/summary` | **needed** |
| Assets positions | List holdings | `GET /holdings` | **needed** |
| Assets activity | Activity feed | `GET /activity` | **needed** |
| Payouts | Accrual history | `GET /payouts` | **needed** |
| Payouts | Balance breakdown | `GET /wallets/balance` | **needed** |
| Deposit | Get TRC20 address | `GET /wallets/deposit-address` | **needed** |
| Deposit | List deposits | `GET /wallets/deposits` | **needed** |
| Deposit | On-ramp session | External provider API | **needed** |
| Withdraw | Create request | `POST /wallets/withdrawals` | **needed** |
| Withdraw | List withdrawals | `GET /wallets/withdrawals` | **needed** |
| Secondary | List listings | `GET /listings` | **needed** |
| Secondary | Create listing | `POST /listings` | **needed** |
| Secondary | Buy listing | `POST /trades` | **trades/status stub exists** |
| Secondary | Order book | `GET /orderbook/:marketId` | **needed** |
| Secondary | My orders | `GET /orders` | **orders/status stub exists** |
| Secondary | Trade history | `GET /trades` | **needed** |
| Analytics | Release detail | `GET /releases/:id/analytics` | **needed** |
| Profile | Update profile | `PATCH /users/me` | **needed** |
| Profile | KYC submit/status | `GET/POST /kyc` | **needed** |
| Admin | All CRM CRUD | `/admin/*` REST | **needed** (only access check exists) |
| Support | Create ticket | `POST /support/tickets` | **needed** |
| Referral | Stats | `GET /referrals/me` | **needed** |
| Health | System status page | `GET /health` | **exists, not wired to UI** |

---

## 14. Что уже готово

### Полностью или substantially готов UI

- **Auth flow:** login, register (3-step), email verify, 2FA at login, session refresh
- **Navigation shell:** header mega-menu, assets sub-nav, payouts sub-nav, footer
- **Catalog:** filters, grid, sort, funding + secondary card types
- **Buy UNT flow:** dual input USDT↔UNT, fee calc, result modal (mock payment)
- **Market overview + analytics:** tables, charts, filters, release detail pages
- **Assets workspace:** overview, metrics, positions, activity — cohesive light theme
- **Payouts:** overview chart, comparison, history, deposit/withdraw wizards
- **Secondary market:** 6 tabs, listing detail, order book page
- **Sell UNT flow:** limit order form from holdings
- **Profile:** multi-tab account UI (overview, settings, security, verification)
- **Admin prototype:** 7 tabs with KPIs, release drawer CRUD, tables
- **Static pages:** fees, UNT explainer, release parameters guide, guide selection
- **Support center:** hero + chat widget UI
- **Responsive layouts** для основных workspace

### Backend integration готова

- Authentication (full cookie session)
- User me + roles
- Admin access gate

---

## 15. Что недоделано

### Страницы-заглушки / отсутствуют

- `/forgot-password` — ссылка в login, страницы нет
- `/terms`, `/privacy` — в routes + register acceptance, страниц нет
- Google OAuth — кнопка есть, `signInWithGoogle()` throws
- On-ramp «Buy USDT» — не реализован
- Copy address / QR — placeholder «QR», без real QR generation для deposit address

### UI-only (без API)

- **100% domain data** — catalog, holdings, payouts, wallet, secondary, admin CRM
- Buy UNT — random approve/decline
- Withdraw submit — явный mock disclaimer
- Profile email/balance — hardcoded
- Security 2FA setup/disable — local toggles
- KYC verification — URL-driven prototype states
- Support chat — local message array
- Referral/partner program stats — static
- Admin release CRUD — in-memory, теряется при reload
- Export buttons (deposit/withdraw history) — no-op
- `authorizedFetch` — не используется ни одним domain screen

### Auth / access gaps

- `/app` public — guest видит «кабинет» с mock data
- Нет server-side middleware
- Granular staff roles не реализованы (только ADMIN)
- Нет role-specific admin routes

---

## 16. Что нужно для backend

### Priority 1 — Core user loop

1. `GET /releases` + release detail — питать catalog, analytics, buy screen
2. `GET /wallets/me` — balance (earned_total, available, locked, withdrawn)
3. `GET /wallets/deposit-address` + deposit webhook + `GET /wallets/deposits`
4. `POST /wallets/withdrawals` + admin approval flow
5. `POST /orders` (primary purchase) + `GET /holdings`
6. Wallet balance check before buy

### Priority 2 — Secondary market

7. `GET/POST /listings`, `POST /trades`, `GET /orders`, `GET /trades`
8. Order book endpoint for `/book/[marketId]`

### Priority 3 — Payouts & admin

9. `GET /payouts` — user accrual history
10. Admin CRUD: releases, users, withdrawal approval, deposit reconciliation
11. Revenue distribution runs
12. Audit log persistence

### Priority 4 — Account & compliance

13. Profile update, 2FA setup/disable wiring
14. KYC provider integration
15. Support tickets
16. Referral tracking
17. RBAC: ACCOUNTANT, CONTENT_MANAGER, SUPPORT, COMPLIANCE roles

### Infrastructure

- Wire `authorizedFetch` from AuthProvider into domain services
- Replace mock imports with SWR/React Query or server components + fetch (optional, not in scope now)
- Id mapping: unify catalog id, analytics id, secondary release slug (currently cross-linked manually in mocks)

---

## 17. UX/UI замечания

1. **Public `/app` vs protected `/catalog`** — пользователь видит кабинет без login, но каталог требует auth. Нужна явная guest landing или защита `/app`.

2. **Terminology drift** — в UI встречается «инвестор», «investor share», «Portfolio · TVL», «Сценарий инвестора». Для продукта рекомендуется: *holder*, *revenue share rights holder*, *units holder*, *investor_share* только как техническое имя поля.

3. **Дублирование путей** — legacy `/dashboard/*`, `/my-assets`, `/calculator` redirects. Документировать canonical URLs для backend links.

4. **Два типа analytics** — `/analytics/releases/[id]` (asset performance) vs `/dashboard/secondary-market?tab=analytics` (trading). В UI есть пояснения, но риск путаницы сохраняется.

5. **Buy flow** — random decline 25% без объяснения причин — только для mock, но может confuse QA.

6. **Withdraw mock disclaimer** — хорошая практика (явно указано), сохранить при подключении API.

7. **Mobile tables** — horizontal scroll работает, но dense admin/user tables на маленьких экранах тяжёлые.

8. **Footer hidden** на catalog/analytics — intentional full-screen workspace.

9. **Нет global loading/error boundaries** — `loading.tsx` / `error.tsx` отсутствуют на app level.

10. **Register terms checkbox** — ссылается на `/terms`, страница отсутствует.

---

## 18. Риски и логические проблемы

| # | Риск | Severity |
|---|------|----------|
| 1 | Client-only auth — flash of protected content, bypassable | High |
| 2 | `/app` public with financial mock data — misleading for guests | Medium |
| 3 | Buy UNT без проверки баланса — UX готов, logic incomplete | High |
| 4 | Mock IDs linked manually — break при real API schema | Medium |
| 5 | Admin CRUD in-memory — data loss, false sense of completion | Medium |
| 6 | Single ADMIN role — no separation of duties | High (production) |
| 7 | «Investor» terminology — regulatory/marketing risk | Medium |
| 8 | No idempotency keys on buy/withdraw UI | Medium |
| 9 | 2FA setup not wired — security gap for accounts | Medium |
| 10 | Deposit address static in mock — user could send to wrong address if deployed as-is | Critical if shipped |
| 11 | No rate limiting feedback in UI | Low |
| 12 | Personal ledger view mixed into public release detail route | Low |

---

## Противоречия frontend vs ТЗ

| Тема | ТЗ | Frontend сейчас |
|------|-----|-----------------|
| Terminology | Не инвестиционная платформа, не securities | Admin tab «Инвесторы», «Сценарий инвестора», «Начислено инвесторам», поле `investor_share` в UI labels |
| Copyright | User НЕ получает авторские права | Явный disclaimer частично есть (UNT explainer, release parameters); не везде |
| Guest access | Landing для guest | `/app` выглядит как logged-in cabinet с mock balances |
| Admin roles | 5 role types with separation | Только `ADMIN` boolean check |
| Buy USDT on-ramp | External provider flow | Не реализован |
| Backend integration | Full platform | ~95% mock, auth only |
| Terms/Privacy | Register acceptance | Pages missing |
| `investor_share` field name | Business term in spec | Used as UI label «Доля инвесторов» — consider «Доля holders» / «Revenue share pool» |

---

## 19. Рекомендованный порядок доработки

### Фаза 1 — Foundation (backend + frontend wiring)

1. Подключить `GET /releases` → catalog, market overview, analytics
2. Wallet API: balance, deposit address, deposits list
3. Защитить `/app` или сделать true guest landing vs authenticated dashboard
4. Реализовать `/terms`, `/privacy`, `/forgot-password`
5. Wire `authorizedFetch` service layer

### Фаза 2 — Money flow

6. Deposit flow end-to-end (TRC20 monitor + history statuses)
7. Primary purchase `POST /orders` + balance deduction + holdings update
8. Withdraw request + status tracking
9. Payouts history from API

### Фаза 3 — Secondary market

10. Listings CRUD + trade execution
11. Order book + orders tab + trade history
12. Sell flow `/assets/sell/[id]` → real listing

### Фаза 4 — Admin & roles

13. Backend RBAC roles
14. Admin finances: deposit/withdraw approval
15. Admin releases: persistent CRUD (Content Manager scope)
16. Revenue distribution + payouts admin
17. Audit log

### Фаза 5 — Account & polish

18. Profile API, 2FA setup UI
19. KYC integration
20. Support tickets
21. On-ramp provider
22. Terminology pass (investor → holder)
23. Server middleware auth
24. Global error/loading states

---

## Приложение A — Mock data index

| File | Used by |
|------|---------|
| `lib/catalog-mock.ts` | `/catalog`, dashboard landing catalog |
| `mocks/market-overview-rows.ts` | Market overview, buy screen, pricing |
| `mocks/analytics/releases.mock.ts` | Analytics list |
| `mocks/analytics/release-detail.mock.ts` | Release detail pages |
| `mocks/catalog/release-market-analytics.mock.ts` | Catalog analytics subpage |
| `components/dashboard/assets/assets-mock-data.ts` | Assets pages |
| `components/dashboard/assets/payouts-mock-data.ts` | Payouts section |
| `components/dashboard/assets/payout-flow-mock-data.ts` | Deposit/withdraw |
| `components/dashboard/assets/activity-mock-data.ts` | Activity |
| `components/my-assets/overview/mock-data.ts` | Overview |
| `mocks/dashboard/secondary-market-listings.mock.ts` | Secondary market |
| `mocks/dashboard/secondary-market-trading-analytics.mock.ts` | Secondary analytics tab |
| `features/admin/mocks/admin-data.ts` | All admin tabs |
| `constants/fees-mock-data.ts` | `/fees` |
| `constants/news-mock-data.ts` | `/news` |
| `constants/system-status-mock.ts` | `/system-status` |
| `constants/partner-program-mock.ts` | `/partner-program` |
| `components/referral/referral-mock-data.ts` | `/referral-program` |
| `constants/calculator-mock.ts` | `/assets/calculator` |
| `constants/dashboard/profile-security.ts` | Profile security tab |
| `constants/dashboard/profile-verification.ts` | Profile KYC tab |

---

## Приложение B — User flows (сводка)

### Guest flow

```
/ → /app (public, mock cabinet)
  → /login | /register
  → /register → /verify-email → /login → /app
  → [after auth] /catalog → /catalog/buy/[id]
  → /assets/payouts/deposit
```

### User flow (authenticated)

```
/app (home)
  → /catalog → buy units → holdings update (TODO API)
  → /assets/overview (holdings, TVL)
  → /assets/payouts (earned, available, locked)
  → /assets/payouts/deposit | withdraw
  → /assets/sell/[id] → /dashboard/secondary-market?tab=orders
  → /dashboard/profile (settings, security, KYC)
```

### Track / Deal flow

```
/catalog OR /catalog/market-overview
  → /analytics/releases/[id] (research)
  → /catalog/buy/[id] (primary round)
  → BuyUnitsPaymentResultModal (success/fail)
  → /assets/positions (holdings)
```

### Wallet flow

```
/assets/payouts → deposit/withdraw sub-pages
  → 3-step wizard
  → history table (pending/completed/failed)
```

### Secondary market flow

```
/dashboard/secondary-market?tab=market
  → /l/[listingId] OR /book/[marketId]
  → buy listing (UI)
  → ?tab=history (trades)
/assets/sell/[id] → create listing
```

---

*Документ сгенерирован на основе анализа `apps/frontend/` без изменения исходного кода.*
