# Admin: настройки сети депозита

Путь: **Admin → Treasury** → блок «USDT · TRC20».

## RBAC

| Роль | Просмотр | Изменение |
|------|----------|-----------|
| SUPER_ADMIN | да | да |
| ACCOUNTANT | да | да |
| COMPLIANCE | treasury console | pool disable |
| BUSINESS_ANALYST | read-only (console) | нет |
| NEWS_MANAGER | нет | нет |

## Поля

- Контракт USDT TRC20
- Минимальный депозит
- Число подтверждений
- Время зачисления / доступность вывода (минуты)
- Включение deposit/withdrawal
- Тексты предупреждений и maintenance (RU; EN/KA через API)
- Provider mode (из env seed, меняется осознанно)

Для PATCH опасных полей укажите **reason** — запись попадёт в audit.

## Пул адресов

`POST /api/admin/v1/treasury/deposit-address-pool` — добавить TRON-адрес (валидация base58).

Список: `GET .../deposit-address-pool`.
