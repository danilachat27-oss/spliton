# API contracts (Spliton v1)

## Base paths

| Surface | Prefix |
|---------|--------|
| User & public | `/api/v1` |
| Admin | `/api/admin/v1` |
| Health | `/health/live`, `/health/ready` |

## Error shape

All HTTP errors return:

```json
{
  "statusCode": 409,
  "code": "IDEMPOTENCY_CONFLICT",
  "message": "Human-readable message",
  "details": {},
  "timestamp": "ISO-8601",
  "path": "/api/v1/...",
  "method": "POST",
  "requestId": "uuid"
}
```

Stable codes: see `apps/backend/src/common/platform/errors/error-codes.ts`.

Frontend mapping: `apps/frontend/lib/api-error-messages.ts`.

## OpenAPI

Set `OPENAPI_ENABLED=true` and open `/api/docs` (when `@nestjs/swagger` installed).

## Validation

DTOs use `class-validator` + global `ValidationPipe` (whitelist, forbidNonWhitelisted).

## Idempotency

Financial mutations accept `idempotencyKey` (body) or `Idempotency-Key` header where documented.
