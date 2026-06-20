# SLA and operator tasks (Spliton)

## Модель

Таблица `operator_sla_tasks` — задачи с `dueAt`, `breachedAt`, `priority`, `assignedToUserId`, `escalationLevel`.

## Типы (OperatorSlaTaskType)

- withdrawal review
- KYC review
- dispute response
- support first response
- compliance flag review
- deposit stuck review
- report generation

## API

- `GET /api/admin/v1/operator-sla/tasks?overdueOnly=true`

## Admin UI

`/admin/operator-tasks` — агрегированные очереди + блок SLA из API (live mode).

## Cron

`OperatorSlaService.markBreachedTasks()` — вызывать из worker/cron (P1 automation).

## Notifications

SLA due soon / breached — foundation через notifications module (P1 email/push).
