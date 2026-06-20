# Admin UI/UX Review

**Updated:** 2026-05-30

## Сделано в этом этапе

### Information architecture

- Sidebar из 17 плоских пунктов → 7 логических групп с muted заголовками
- Brand block: логотип + «Панель управления»
- Footer sidebar: environment, роль

### Localization

- Единый i18n слой (`admin-i18n.ts`)
- Все основные section pages на русском
- `AdminLocalizedStatusBadge` для финансовых статусов
- `formatUsdtAmount` / `formatAdminDate` — единый формат

### Dashboard / Обзор

- Операционный центр: KPI, очередь задач, риск-сигналы, последние действия, быстрые действия
- Все подписи на русском

### RBAC

- `/admin/roles`: описания ролей, матрица прав, users by role (mock)
- Role assign dialog с confirm на русском

### Financial UX

- Confirm dialogs для выводов и пополнений с предупреждением о ledger/audit
- Read-only banner для ролей без прав
- Admin note в drawer перед опасными действиями

### Risk / Support

- Compliance: табы (риск-обзор, пользователи, выводы, сделки, замороженные)
- Support: табы по статусам, категории на русском

### Content manager

- Track drawer: секции «Основная информация», «Параметры дохода», «Юниты», «Финансовые условия», «Публикация»

### Settings

- Вкладки: Комиссии (live), Сети, Лимиты, Безопасность, Уведомления, Системные (mock)

## Единый page template

Все list-страницы используют `AdminPageShell` + `AdminPageHeader` + filters + table + drawer.

## Что улучшить дальше

- [ ] Глобальный поиск (backend)
- [ ] Skeleton loaders на всех таблицах
- [ ] Copy button для tx hash / address
- [ ] Tooltips для юридических терминов
- [ ] Charts на dashboard и platform revenue (recharts)
- [ ] Compliance / Support live API
- [ ] Playwright e2e для UI per role
- [ ] Responsive drawer на mobile
- [ ] Disabled reason tooltips на кнопках без прав

## Build

`pnpm run build` (frontend) — ✅ pass (2026-05-30)
