# Operator Portal — Overview

Spliton **Operator Portal** (`/admin`) — внутренняя панель для команды платформы: финансы, контент, compliance, поддержка, аналитика. Отделена от пользовательского кабинета инвестора/артиста.

## Быстрый старт

| URL | Назначение |
|-----|------------|
| `/admin/login` | Вход сотрудников (staff JWT) |
| `/admin` | Executive dashboard |
| `/admin/analytics/*` | BI / аналитика |
| `/admin/*` | Операционные разделы (RBAC) |

Публичный сайт **не** содержит ссылку «Админка» — только прямой URL.

## Роли (staff)

| Роль | Фокус |
|------|--------|
| `SUPER_ADMIN` | Полный доступ, назначение ролей |
| `ACCOUNTANT` | Финансы, отчёты, доход платформы |
| `CONTENT_MANAGER` | Треки, раунды |
| `SUPPORT_MANAGER` | Пользователи (read), поддержка |
| `COMPLIANCE` | Риски, выводы, вторичный рынок |
| `BUSINESS_ANALYST` | Аналитика и отчёты **только read** |

Роли продукта (`USER`, `INVESTOR`, `ARTIST`) — **без** доступа в портал.

Подробнее: [ADMIN_ROLES_AND_ACCESS.md](ADMIN_ROLES_AND_ACCESS.md), [Business Analyst](../analytics/BUSINESS_ANALYST_ROLE.md).

## Разделы портала

Семь групп sidebar (конфиг: `apps/frontend/features/admin/config/admin-sections.ts`):

1. **Главное** — обзор, задачи, риск-сигналы  
2. **Пользователи** — users, roles, audit  
3. **Контент** — треки, раунды, владения  
4. **Финансы** — кошельки, депозиты, выводы, revenue, platform revenue  
5. **Рынок** — вторичный рынок  
6. **Операции** — поддержка, compliance, отчёты  
7. **Система** — настройки (fees — live)

Маршруты и IA: [ADMIN_OPERATOR_PORTAL.md](ADMIN_OPERATOR_PORTAL.md).

## Live vs Mock

| Переменная | Значения | Эффект |
|------------|----------|--------|
| `NEXT_PUBLIC_ADMIN_DATA_SOURCE` | `mock` (default) / `live` | Данные разделов admin |
| `NEXT_PUBLIC_WALLET_DATA_SOURCE` | `mock` / `live` | User wallet UI |

В **live** режиме графики аналитики не подставляют fake values — пустые/нулевые данные при отсутствии записей.

Актуальная матрица модулей: [ADMIN_LIVE_API_PROGRESS.md](ADMIN_LIVE_API_PROGRESS.md).

## Архитектура (кратко)

```
apps/frontend/app/admin/          → маршруты Next.js
apps/frontend/features/admin/     → UI, RBAC, hooks, mocks
apps/frontend/services/admin/     → mock | live API
apps/backend/modules/admin/       → /api/admin/v1/*
```

Admin API **отделён** от user API (`/api/v1/...`). Финансовые мутации оператора не идут через user endpoints.

## Связанные документы

| Тема | Документ |
|------|----------|
| Auth, guards | [ADMIN_AUTH_AND_ACCESS.md](ADMIN_AUTH_AND_ACCESS.md) |
| UI, русский язык | [ADMIN_UI_UX.md](ADMIN_UI_UX.md) |
| Аналитика | [Analytics Overview](../analytics/ANALYTICS_OVERVIEW.md) |
| Финансы / ledger | [Wallet Ledger](../finance/WALLET_LEDGER.md) |
| E2E | [Admin E2E Tests](../testing/ADMIN_E2E_TESTS.md) |
| Production backlog | [TODO Production](../operations/TODO_PRODUCTION.md) |

## Архив

Исторические отчёты и снимки статуса: [../archive/reports/](../archive/reports/).
