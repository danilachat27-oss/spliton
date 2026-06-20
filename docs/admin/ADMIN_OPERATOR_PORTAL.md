# Spliton Operator Portal

Операторская панель Spliton (`/admin`) — SaaS back-office для финансов, поддержки, контента, статуса системы и настроек.

## Основные разделы (live API)

| Раздел | Route | API prefix |
|--------|-------|------------|
| Support Operations | `/admin/support` | `GET/POST/PATCH /api/admin/v1/support/tickets` |
| Настройки / комиссии | `/admin/settings` | `GET/PATCH /api/admin/v1/settings/financial-rules` |
| Новости CMS | `/admin/news` | `/api/admin/v1/news` |
| Статус системы | `/admin/system-status` | `/api/admin/v1/system-status` |
| Публичный статус | `/system-status` | `GET /api/v1/system-status` |
| Публичные новости | `/news`, `/news/[slug]` | `GET /api/v1/news` |

## Пользовательская поддержка

- `/dashboard/support`, `/dashboard/support/[id]`
- `POST/GET /api/v1/support/tickets`, messages, close

## RBAC (кратко)

- **SUPER_ADMIN** — финансовые правила, system status, всё остальное
- **SUPPORT_MANAGER / SUPPORT** — тикеты (mutate: manager)
- **NEWS_MANAGER** — новости
- **BUSINESS_ANALYST** — read-only аналитика + просмотр support summary/list
- **ACCOUNTANT / COMPLIANCE** — financial/risk tickets, notes

## Миграции (additive)

- `20260601000000_spliton_operator_portal` — support messages, financial rules, news, system status
- `20260601010000_news_manager_role` — enum `NEWS_MANAGER`

Подробнее: `SUPPORT_ADMIN_FLOW.md`, `SETTINGS_ADMIN_FLOW.md`, `NEWS_ADMIN_FLOW.md`, `SYSTEM_STATUS_ADMIN_FLOW.md`.
