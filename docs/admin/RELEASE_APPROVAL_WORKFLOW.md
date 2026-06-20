# Release approval workflow (Spliton admin)

## Стадии

`DRAFT` → `CONTENT_REVIEW` → `LEGAL_REVIEW` → `FINANCE_REVIEW` → `COMPLIANCE_REVIEW` → `READY_TO_PUBLISH` → `PUBLISHED`

Дополнительно: `PAUSED`, `REJECTED`, `ARCHIVED`.

## API

- `GET /api/admin/v1/releases/:id/approval` — checklist + timeline
- `POST /api/admin/v1/releases/:id/approval/decision` — approve / reject / request changes

## RBAC

| Роль | Действие |
|------|----------|
| CONTENT_MANAGER | content approval |
| ACCOUNTANT | finance approval |
| COMPLIANCE | compliance approval |
| SUPER_ADMIN | final publish |

## Publish gate

Публикация блокируется, если не пройдены критические пункты checklist или отсутствуют обязательные approvals.

## UI

Admin release drawer — approval tab (foundation; расширение UI — P1).

## Audit

Каждое решение пишется в admin audit log.
