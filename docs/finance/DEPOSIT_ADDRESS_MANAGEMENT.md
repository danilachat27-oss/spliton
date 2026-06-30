# Управление адресами депозита (USDT TRC20)

## Модели

- `deposit_network_settings` — контракт, лимиты, тайминги, флаги, тексты RU/EN/ES/PT, explorer URLs, статус lifecycle.
- `deposit_address_pool` — пул адресов (AVAILABLE → ASSIGNED при первом запросе пользователя).
- `user_deposit_addresses` — активный адрес, привязанный к кошельку пользователя.
- `deposit_requisite_change_history` — история изменений реквизитов (audit trail на странице admin).

## Назначение адреса (Вариант B + dev fallback)

1. Если есть `user_deposit_addresses` ACTIVE — вернуть его.
2. Если у кошелька уже есть `wallet.address` — зафиксировать как STATIC.
3. Иначе взять свободный адрес из `deposit_address_pool`.
4. В dev: `T_DEV_*` только при `NODE_ENV !== production` и `ALLOW_DEV_DEPOSIT_ADDRESS` или non-prod.
5. В production `T_DEV_*` запрещён.

## API пользователя

`GET /api/v1/wallet/deposit-info?asset=USDT&network=TRC20&lang=ru` (JWT)

Возвращает address, `qrPayload` (= address), `qrDataUrl` (PNG data URL), min deposit, timings, contract, warnings, `providerStatus`.

Коды ошибок: `DEPOSIT_DISABLED`, `DEPOSIT_ADDRESS_UNAVAILABLE`, `DEPOSIT_MISCONFIGURED`.

## Admin

`GET/PATCH /api/admin/v1/payment-requisites/network-settings`  
`GET/POST /api/admin/v1/payment-requisites/address-pool` (+ bulk, disable, enable, archive)  
`GET .../preview?lang=` · `GET .../history`

Legacy treasury routes сохранены.

UI: **`/admin/payment-requisites`** (основной) или **Admin → Treasury**.

Документация: [PAYMENT_REQUISITES_ADMIN.md](../admin/PAYMENT_REQUISITES_ADMIN.md)

Опасные изменения требуют `reason` в body. Audit: `payment_requisites.*`, `treasury.deposit_*`.

## Frontend (live)

При `NEXT_PUBLIC_WALLET_DATA_SOURCE=live` страница `/assets/payouts/deposit`:

- запрашивает `GET /api/v1/wallet/deposit-info` (JWT);
- QR из `qrDataUrl` (backend: `qrPayload` = TRC20 address);
- адрес, min deposit, timings, контракт — только из API;
- mock/demo только при `NEXT_PUBLIC_WALLET_DATA_SOURCE=mock`.

## QR

Генерируется на backend (`qrcode`), payload = строка TRC20-адреса.

## Production checklist

- `TRON_USDT_CONTRACT` задан или контракт в admin settings.
- Пул адресов не пуст (или provider).
- `deposit_enabled = true`.
- `TRON_PROVIDER_MODE` не `mock` в production.
