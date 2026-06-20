# Spliton — аналитические дашборды

## Unified Analytics UX Standard

- **Shell**: `AdminAnalyticsPageShell` — заголовок, период, фильтры, `AdminAnalyticsCompactNav`, внутренние табы (`?tab=`).
- **Навигация**: компактные pill-вкладки между `/admin/analytics/*`, без карточек-маршрутов.
- **Контент**: на вкладке «Обзор» — 4–6 KPI, 1–2 графика, блок внимания; детали — в доменных табах.
- **Статусы**: зелёный / синий / красный / жёлтый через `AdminAnalyticsStatusBadge` и `admin-status-maps`.
- **Пустые состояния**: контекстные тексты в `CHART_EMPTY_STATES` (`admin-analytics-i18n.ts`).
- **Live**: без mock-значений при `NEXT_PUBLIC_ADMIN_DATA_SOURCE=live`.

## Маршруты и табы

| Маршрут | Внутренние табы |
|---------|-----------------|
| `/admin/analytics` | Обзор, Финансы, Пользователи, Рынок, Риски и поддержка, Инсайты |
| `/admin/analytics/finance` | Обзор, Денежный поток, Комиссии, Пополнения, Выводы, Ошибки, Детализация |
| `/admin/analytics/users` | Обзор, Рост, Воронка, Сегменты, Удержание, Топ держатели, Риски |
| `/admin/analytics/tracks` | Обзор, Релизы, Раунды, Юниты, Держатели, Доход, Готовность, Рынок |
| `/admin/analytics/market` | Обзор, **Стакан листингов**, Сделки, Цены, Ликвидность, Участники, Комиссии, Риски |
| `/admin/analytics/revenue` | Обзор, Доходы релизов, Пайплайн, Доли, По релизам, Ошибки, Сверка |
| `/admin/analytics/risk` | Обзор, Очередь, Критичность, Правила, SLA, Крупные операции, Повторы, Заморозки |
| `/admin/analytics/operations` | Обзор, Очередь, SLA, Категории, Финансы, Эскалации, Нагрузка, Качество |

## RBAC

- `BUSINESS_ANALYST` — read-only на все analytics.
- `ACCOUNTANT` — finance, revenue, deposits, withdrawals.
- `COMPLIANCE` — risk, market suspicious.
- `SUPPORT_MANAGER` — operations, support.
- `CONTENT_MANAGER` — tracks/rounds analytics.

См. `docs/admin/ADMIN_UI_UX.md`, `docs/admin/ADMIN_RUSSIAN_LOCALIZATION.md`.
