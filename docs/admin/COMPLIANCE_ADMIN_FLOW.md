# Spliton — Compliance / Risk Control Center

Страница: `/admin/compliance` — рабочий центр compliance-команды Spliton.

## KPI (GET `/api/admin/v1/compliance/summary`)

- openCount, criticalCount, highCount, onHoldCount
- blockedUsersCount, frozenOpsCount
- avgReviewHours, overdueCount, new24hCount, repeatOffendersCount
- bySeverity, byEntityType

## Вкладки UI

| Вкладка | Назначение |
|---------|------------|
| Обзор | KPI, charts severity/entity |
| Очередь проверки | `queueFilter=queue`, open flags |
| Риск-пользователи | `entityType=user` |
| Риск-выводы | `entityType=withdrawal` |
| Подозрительные сделки | `entityType=trade` |
| Замороженные операции | `queueFilter=frozen` |
| Заблокированные пользователи | `queueFilter=blocked` |
| Правила риска | `GET /compliance/risk-rules` (read-only catalog) |
| История решений | `GET /compliance/history` (audit `compliance.*`) |

## Risk Analytics (`/admin/analytics/risk`)

BI-страница для COMPLIANCE / BUSINESS_ANALYST / ACCOUNTANT: очередь OPEN flags, SLA aging, rules performance, repeat offenders, high-value withdrawals, freeze impact. Drill-down: `?flagId=` на `/admin/compliance`, выводы/рынок/пользователи — см. [ANALYTICS_DASHBOARDS.md](../analytics/ANALYTICS_DASHBOARDS.md#risk-analytics-dashboard-adminanalyticsrisk).

False positive rate на analytics — **approximation** через `REVIEWED` до отдельного disposition в API.

## Risk flag detail

`GET /api/admin/v1/compliance/risk-flags/:id?include=evidence,timeline,activity,audit,object`

По умолчанию — только базовые поля. Тяжёлые блоки — по `include`.

## Mutations (COMPLIANCE / SUPER_ADMIN / ADMIN)

| Action | Endpoint |
|--------|----------|
| Note | `POST .../notes` |
| Assign | `PATCH .../assign` (audit-only, assignee email) |
| Resolve | `POST .../resolve` (note required) |
| Dismiss | `POST .../dismiss` (false positive, note required) |
| Escalate | `POST .../escalate` |
| Freeze | `POST /compliance/operations/:id/freeze` |
| Release | `POST /compliance/operations/:id/release` |
| Block user | `POST /compliance/users/:id/block` |
| Unblock | `POST /compliance/users/:id/unblock` |

## Safety

- Resolve/dismiss/block/unblock/freeze require reason where specified
- Duplicate freeze rejected (`ALREADY_FROZEN`)
- Release only when active freeze exists
- Cannot block last SUPER_ADMIN
- Closed flag cannot change without reopen
- All mutations → `AdminAuditService` (`compliance.*` actions)

## RBAC

| Role | Access |
|------|--------|
| SUPER_ADMIN, ADMIN, COMPLIANCE | mutate |
| SUPPORT_MANAGER, ACCOUNTANT, BUSINESS_ANALYST | read lists/summary/detail |

Frontend: `useAdminPermissions` — `Compliance` area, read-only banner for analysts.

## Live mode

`NEXT_PUBLIC_ADMIN_DATA_SOURCE=live` — только API; empty state без fake `@example.com`.
Mock mode — `@spliton.demo` fixtures only.

## TODO

- `assignedToUserId` в `RiskFlag` (сейчас assign через audit)
- Dynamic rules engine
- Dedicated evidence metadata per rule in DB
