# Admin Russian Localization

**Updated:** 2026-05-30

## Источник истины

`apps/frontend/features/admin/lib/admin-i18n.ts` — навигация, таблицы, статусы, действия, confirm-сообщения.

Форматирование:

- `admin-format.ts` — `formatUsdtAmount`, `formatAdminDate`, `formatUnits`
- `AdminLocalizedStatusBadge` — статусы на русском

## Переименования разделов

| EN (было) | RU |
|-----------|-----|
| Dashboard | Обзор |
| Users | Пользователи |
| Tracks / Releases | Треки и релизы |
| Rounds / Deals | Раунды и сделки |
| Wallets | Кошельки |
| Deposits | Пополнения |
| Withdrawals | Выводы |
| Holdings / Units | Юниты и владения |
| Revenue / Payouts | Доходы и начисления |
| Secondary Market | Вторичный рынок |
| Platform Revenue | Доход платформы |
| Reports | Отчёты |
| Support | Поддержка |
| Compliance | Риски и контроль |
| Settings | Настройки |
| Audit Log | Журнал действий |
| Roles & Access | Роли и доступы |

## Статусы

| Code | RU |
|------|-----|
| pending | Ожидает |
| approved | Одобрено |
| rejected | Отклонено |
| completed | Завершено |
| failed | Ошибка |
| manual_review | Ручная проверка |
| on_hold | На удержании |
| cancelled | Отменено |
| suspicious | Подозрительно |
| frozen | Заморожено |

## Деньги

Формат: `1 240 500,00 USDT` (ru-RU locale). Без смешения `$` и USDT.

## Даты

Формат: `31.05.2026, 18:42` через `formatAdminDate`.

## Покрытие (2026-05-30)

| Раздел | Статус |
|--------|--------|
| Sidebar, header, dashboard | ✅ Полностью |
| Users, deposits, withdrawals, wallets | ✅ Полностью |
| Holdings, revenue, reports | ✅ Полностью |
| Tracks, rounds, secondary market | ✅ Полностью |
| Roles, compliance, support, audit, settings | ✅ Полностью |
| Platform revenue | ✅ KPI + таблица (график placeholder) |
| Track drawer | ✅ Секции на русском |
| Role assign dialog | ✅ |
| Global search | UI placeholder на русском |

## Остатки EN (намеренно)

- TRC20, tx hash, CSV, USDT, Hard cap — технические термины
- SUPER_ADMIN в badge (бренд роли)
- Environment: Production / Staging / Local
