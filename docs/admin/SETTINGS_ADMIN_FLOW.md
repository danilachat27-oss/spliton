# Settings / Financial Configuration

Route: `/admin/settings`

## Financial rules API

- `GET /api/admin/v1/settings/financial-rules` — список активных правил (код, категория, valueType, value, min/max)
- `GET /api/admin/v1/settings/financial-rules/:id/history` — история изменений
- `PATCH /api/admin/v1/settings/financial-rules/:id` — только **SUPER_ADMIN** (value, reason, effectiveFrom)

При изменении кодов `primary_purchase_percent`, `withdrawal_fixed_usdt`, `secondary_market_percent` синхронизируется активная строка `platform_fee_settings` (ledger-расчёты не ломаются).

## Audit

- `settings.fee.update`

## UI

Вкладка «Комиссии» в settings-section; расширение вкладок (лимиты, сети, безопасность) — по мере подключения env/overview API.
