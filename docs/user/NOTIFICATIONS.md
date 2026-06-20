# Уведомления Spliton (пользователь)

## Каналы

- **In-app** — центр уведомлений в хедере кабинета и страница `/dashboard/notifications`.
- **Email** — через Postmark или dev outbox; только для важных категорий и с учётом настроек.

## Категории

| Категория | Примеры |
|-----------|---------|
| finance | депозит зачислен, заявка на вывод |
| market | первичная покупка, сделка на вторичном рынке |
| security | смена пароля (email нельзя отключить) |
| support | ответ оператора по тикету |
| news | важные объявления платформы (опционально) |

## API

- `GET /api/v1/notifications`
- `GET /api/v1/notifications/unread-count`
- `PATCH /api/v1/notifications/:id/read`
- `PATCH /api/v1/notifications/read-all`
- `GET/PATCH /api/v1/notification-preferences`

## Anti-spam

События используют `idempotencyKey` и таблицу `notification_event_dedup` (TTL 24ч).

## Тесты

`apps/backend/test/notifications.e2e-spec.ts`
