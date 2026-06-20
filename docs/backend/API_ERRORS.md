# API errors (backend)

Стабильные коды: `apps/backend/src/common/platform/errors/error-codes.ts`

Ответ через `HttpExceptionFilter`:

- `code` — клиентский ключ для i18n
- `message` — safe default (RU/EN neutral English acceptable as server default)
- `requestId` — correlation
- Production 5xx — message sanitized, `INTERNAL_ERROR`

## Domains

Auth, wallet, deposits, withdrawals, catalog, market, documents, reports, system/maintenance.

## Feature flags

`FeatureFlagsService` maps disabled flags to specific codes (not only `FEATURE_DISABLED`).

## Clients

Frontend maps codes in `apps/frontend/lib/i18n/dictionaries.ts`.

Добавление нового кода:

1. Add to `error-codes.ts`
2. Use `throwAppError(ErrorCodes.YOUR_CODE, '…')`
3. Add RU/EN/KA strings in frontend dictionaries
4. Test in `dictionaries.spec.ts`
