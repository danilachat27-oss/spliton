# Domain events & outbox

## Table `event_outbox`

Events are persisted with status `PENDING` → `PROCESSING` → `COMPLETED` or `DEAD_LETTER`.

## Event types (initial)

- `notification.user` — deliver in-app + optional email via `NotificationService`
- `notification.admin_roles` — role-targeted admin notifications

## Producer

`NotificationEventsService` enqueues finance/market notifications instead of calling email/notification inline.

## Consumer

`OutboxWorker` in `NotificationsModule` polls every `EVENT_OUTBOX_POLL_MS` (default 10s).

Disable worker: `EVENT_OUTBOX_WORKER_ENABLED=false` (tests only).

## Admin

- `GET /api/admin/v1/safety/console` — outbox stats
- `GET /api/admin/v1/safety/outbox/dead-letter`
- `POST /api/admin/v1/safety/outbox/:id/requeue` — SUPER_ADMIN/ADMIN + audit
