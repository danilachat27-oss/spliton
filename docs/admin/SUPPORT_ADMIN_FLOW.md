# Spliton — Support / Operations

## Support workspace (`/admin/support`)

Операторская работа с тикетами: список, назначение, заметки, смена статуса. Категории и статусы — enum `support_ticket_category` / `support_ticket_status`.

## Operations Analytics (`/admin/analytics/operations`)

BI для SUPPORT_MANAGER, SUPER_ADMIN, BUSINESS_ANALYST (read-only), ACCOUNTANT (finance-related).

См. [ANALYTICS_DASHBOARDS.md](../analytics/ANALYTICS_DASHBOARDS.md#operations-analytics-dashboard-adminanalyticsoperations).

**Метрики SLA:** вычисляются на backend по `createdAt` + `priority` / `status` (отдельного поля SLA в БД нет). Escalated tickets — SLA 2ч.

**First response:** разница между `createdAt` тикета и первой заметкой от staff (`support_ticket_notes`, author ≠ user).

**Reopened:** до поля `reopenedAt` в схеме — `reopenedTickets` в analytics = 0 с пояснением в `resolution-quality.note`.
