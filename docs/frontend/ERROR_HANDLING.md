# Error handling (frontend)

## Стандарт ответа API

```json
{
  "statusCode": 400,
  "code": "WALLET_INSUFFICIENT_BALANCE",
  "message": "Safe default message",
  "requestId": "…",
  "timestamp": "…"
}
```

Nest `throwAppError` также может вернуть `{ error: { code, message, details } }` — парсеры должны учитывать оба формата.

## Маппинг

- `apps/frontend/lib/i18n/dictionaries.ts` — `messageForApiError(code, locale, fallback?)`
- `apps/frontend/lib/i18n/format-api-error.ts` — `formatApiError(err, locale)` для сервисов и hooks
- `apps/frontend/hooks/use-api-error-message.ts` — React hook с текущей локалью
- `apps/frontend/lib/i18n/status-labels.ts` — перевод enum/status без raw значений
- Legacy wrapper: `apps/frontend/lib/api-error-messages.ts`
- Wallet/catalog: `walletErrorMessage()` → `formatApiError`

## Тесты

- `apps/frontend/lib/i18n/format-api-error.spec.ts`
