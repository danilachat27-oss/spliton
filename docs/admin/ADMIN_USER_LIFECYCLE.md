# Admin: lifecycle пользователя (Spliton)

Страница детали пользователя: `/admin/users/:id`.

## Вкладки и данные

| Область | Что видит оператор |
|---------|-------------------|
| Профиль | email, статус, роли, verification |
| Кошелёк | баланс, транзакции |
| Позиции | holdings / units |
| Депозиты / выводы | заявки и статусы |
| Ордера / сделки | primary / secondary |
| Документы | квитанции и выписки (RBAC) |
| Support | тикеты пользователя |
| Compliance | флаги, holds, заметки |
| Consents | принятые политики |
| Security | сессии, события (audit) |
| Audit trail | действия по user entity |

## Действия (RBAC + audit)

- block / unblock
- freeze / unfreeze wallet
- compliance note
- resend email verification (если разрешено ролью)
- просмотр документов
- export user report (роли с правом reports)

## Связь с user API

User-facing endpoints (`/api/v1/me`, onboarding, notifications, documents) дублируют данные в read-only виде для владельца аккаунта. Админ видит расширенный контекст и может выполнять операторские действия.

## Тесты

- user isolation (cannot read another user's data)
- admin RBAC on sensitive actions
- audit log entry on block/freeze/export
