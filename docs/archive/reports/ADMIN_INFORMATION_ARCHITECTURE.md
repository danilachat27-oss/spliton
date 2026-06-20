# Admin Information Architecture

**Updated:** 2026-05-30

Operator portal для revenue share платформы Spliton. Единый источник подписей: `apps/frontend/features/admin/lib/admin-i18n.ts`.

## Sidebar — 7 групп

| Группа | Разделы |
|--------|---------|
| **Главное** | Обзор, Задачи оператора, Риск-сигналы |
| **Пользователи и доступ** | Пользователи, Роли и доступы, Журнал действий |
| **Контент и сделки** | Треки и релизы, Раунды и сделки, Юниты и владения |
| **Финансы** | Кошельки, Пополнения, Выводы, Доходы и начисления, Доход платформы |
| **Рынок** | Вторичный рынок, Сделки рынка, Подозрительные операции |
| **Операционная работа** | Поддержка, Риски и контроль, Отчёты |
| **Система** | Настройки, Состояние системы (external), Документация (placeholder) |

Конфиг: `apps/frontend/features/admin/config/admin-sections.ts`

## Brand block (sidebar)

- Логотип Spliton
- Подпись «Панель управления»
- Footer: environment (Production / Staging / Local), версия, текущая роль

## Topbar

- Breadcrumbs (корень «Админка»)
- Глобальный поиск (UI placeholder)
- Environment badge
- Текущая роль
- User menu: email, роль, выход, переход в пользовательскую часть

## Шаблон страницы

1. Breadcrumbs
2. Заголовок + описание
3. Primary action (справа)
4. KPI / summary cards (если нужно)
5. Filters / search
6. Table / list
7. Detail drawer
8. Empty / loading / error states

Компоненты: `AdminPageShell`, `AdminPageHeader`, `AdminFilterBar`, `AdminDataTable`, `AdminDetailDrawer`.

## Маршруты

| Route | Section ID |
|-------|------------|
| `/admin` | dashboard |
| `/admin/users` | users |
| `/admin/roles` | roles |
| `/admin/audit-log` | audit |
| `/admin/tracks` | tracks |
| `/admin/rounds` | rounds |
| `/admin/holdings` | holdings |
| `/admin/wallets` | wallets |
| `/admin/deposits` | deposits |
| `/admin/withdrawals` | withdrawals |
| `/admin/revenue` | revenue |
| `/admin/secondary-market` | secondaryMarket |
| `/admin/platform-revenue` | platformRevenue |
| `/admin/reports` | reports |
| `/admin/support` | support |
| `/admin/compliance` | compliance |
| `/admin/settings` | settings |

## Терминология (UI)

- Юниты, держатели, права на долю дохода
- Начисления, выплаты, раунд, релиз
- Не использовать: акции, инвесторы, ценные бумаги
