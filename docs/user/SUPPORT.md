# Поддержка (Spliton)

Пользовательский support flow в кабинете Spliton.

## Маршруты

| Страница | URL |
|----------|-----|
| Список обращений | `/dashboard/support` |
| Детали тикета | `/dashboard/support/:id` |
| Публичная справка | `/support` |
| Trust center | `/trust` |

## Возможности пользователя

- Создать обращение (категория, тема, сообщение).
- Просмотреть список своих тикетов и статусы.
- Открыть переписку по тикету.
- Получить in-app и email уведомления при ответе оператора или закрытии.

## API (user)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/api/v1/support/tickets` | Список своих тикетов |
| POST | `/api/v1/support/tickets` | Создать тикет |
| GET | `/api/v1/support/tickets/:id` | Детали (только владелец) |
| POST | `/api/v1/support/tickets/:id/messages` | Ответ пользователя |

## Безопасность

- Пользователь видит только свои тикеты.
- Админ-доступ через RBAC (`SUPPORT_MANAGER` и связанные роли) с audit.
- Связанные сущности (депозит, вывод, ордер) — опционально в payload.

## Связанные разделы

- [NOTIFICATIONS.md](./NOTIFICATIONS.md) — уведомления по support.
- [../admin/SUPPORT_ADMIN_FLOW.md](../admin/SUPPORT_ADMIN_FLOW.md) — операторская очередь.
