# Admin: настройки сети депозита

Путь: **Admin → Payment requisites** (`/admin/payment-requisites`) или **Admin → Treasury** (legacy-блоки).

## RBAC

| Роль | Просмотр | Изменение |
|------|----------|-----------|
| SUPER_ADMIN | да | да |
| ACCOUNTANT | да | да |
| ADMIN, COMPLIANCE, BUSINESS_ANALYST, SUPPORT_MANAGER, SUPPORT | да | нет |
| Обычный пользователь | нет | нет |

## API (рекомендуемый)

`GET/PATCH /api/admin/v1/payment-requisites/network-settings`

Legacy: `GET/PATCH /api/admin/v1/treasury/deposit-network-settings`

## Поля

- Контракт USDT TRC20, отображаемое имя сети
- Минимальный / максимальный депозит
- Число подтверждений
- Время зачисления / доступность вывода (минуты)
- Включение deposit/withdrawal, статус (DRAFT / ACTIVE / ARCHIVED / DISABLED)
- Тексты предупреждений, инструкций и maintenance (RU / EN / ES / PT)
- Шаблоны explorer URL
- Порог предупреждения пула (`poolLowThreshold`)
- Provider mode (из env seed, меняется осознанно)

Для PATCH опасных полей укажите **reason** — запись попадёт в audit и `deposit_requisite_change_history`.

Нельзя включить ACTIVE/deposit без валидных network, contract и min amount.

## Пул адресов

`GET/POST /api/admin/v1/payment-requisites/address-pool`

`POST .../address-pool/bulk` — массовое добавление

`POST .../address-pool/:id/disable|enable|archive`

Legacy: `POST /api/admin/v1/treasury/deposit-address-pool`

Подробнее: [PAYMENT_REQUISITES_ADMIN.md](./PAYMENT_REQUISITES_ADMIN.md)
