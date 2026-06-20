# Карта пользовательской навигации Spliton

Источник пунктов меню: `apps/frontend/components/dashboard/dashboard-nav.ts`.

## Верхнее меню

| Раздел | Route | Live API | Auth |
|--------|-------|----------|------|
| Главная | `/app` | dashboard, announcements | опционально |
| Каталог → Каталог релизов | `/catalog` | `GET /api/v1/catalog/releases` | нет |
| Каталог → Аналитика релизов | `/analytics/releases` | `GET /api/v1/analytics/releases` | да |
| Каталог → Гид по выбору | `/guide/selection` | статичный гид | нет |
| Каталог → Параметры релиза | `/catalog/release-parameters` | справочная + примеры | нет |
| Каталог → Обзор рынка | `/catalog/market-overview` | `GET /api/v1/market/overview` | нет |
| Мои активы → Сводка | `/assets/overview` | `GET /api/v1/portfolio/*` | да |
| Мои активы → Метрики | `/assets/metrics` | portfolio | да |
| Мои активы → Активность | `/assets/activity` | portfolio activity | да |
| Мои активы → Позиции | `/assets/positions` | portfolio holdings | да |
| Выплаты → Обзор | `/assets/payouts` | wallet + payouts | да |
| Выплаты → Сравнение | `/assets/payouts/comparison` | accounting | да |
| Выплаты → История | `/assets/payouts/history` | wallet | да |
| Выплаты → Пополнить | `/assets/payouts/deposit` | `GET /api/v1/wallet/deposit-info` | да |
| Выплаты → Вывод | `/assets/payouts/withdraw` | `POST /api/v1/wallet/withdrawals` | да |
| Вторичный рынок | `/dashboard/secondary-market` | `GET /api/v1/market/*` | да |
| Сервисы → Калькулятор | `/assets/calculator` | расчёт на клиенте + fees API | нет |
| Сервисы → Комиссии | `/fees` | `GET /api/v1/platform/fees` (live) | нет |
| Сервисы → Статус | `/system-status` | `GET /api/v1/system-status` | нет |
| Сервисы → Новости | `/news` | `GET /api/v1/news` | нет |
| Сервисы → Рефералка | `/referral-program` | `GET /api/v1/referrals/*` | да |
| Сервисы → Партнёрка | `/partner-program` | `GET /api/v1/partners/*` | да |

## Профиль (dropdown)

| Пункт | Route |
|-------|-------|
| Мой профиль | `/dashboard/profile` |
| Верификация | `/dashboard/profile?tab=verification` |
| Безопасность | `/dashboard/profile?tab=security` |
| Настройки | `/dashboard/profile?tab=settings` |
| Выйти | logout → `/login` |

## Header (live)

- Баланс: `GET /api/v1/wallet` (summary) при `NEXT_PUBLIC_WALLET_DATA_SOURCE=live`
- Уведомления: `/api/v1/notifications`
- Пополнение: `/assets/payouts/deposit` (не `#deposit` на главной)

## Режимы данных

- `NEXT_PUBLIC_WALLET_DATA_SOURCE=live` — кошелёк, портфель, header balance
- `NEXT_PUBLIC_CATALOG_DATA_SOURCE=live` — каталог
- `NEXT_PUBLIC_NEWS_DATA_SOURCE=live` — новости
- `NEXT_PUBLIC_STATUS_DATA_SOURCE=live` — статус системы

В `development` без `live` допускается mock с баннером в консоли.

## i18n

Top nav labels: `useLocalizedNavItems()` + keys `nav.*` in `lib/i18n/dictionaries.ts` (RU/EN/KA, fallback = `dashboard-nav.ts`).

## Тесты

`apps/frontend/constants/routes.navigation.spec.ts` — маршруты dropdown и checklist routes.
