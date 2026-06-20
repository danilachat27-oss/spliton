# Idempotency framework

## Table `idempotency_records`

Unique key: `(actorType, actorId, action, idempotencyKey)`.

| Field | Purpose |
|-------|---------|
| requestHash | SHA-256 of normalized JSON body |
| responseBody | Cached JSON response |
| expiresAt | Default 24h TTL |

## Rules

- Same key + same hash → replay cached response
- Same key + different hash → `409 IDEMPOTENCY_CONFLICT`
- Expired rows deleted by retention job

## Service

`IdempotencyService.execute()` in `apps/backend/src/common/platform/idempotency/`.

## Domain-specific keys (existing)

- Primary purchase: `orders.idempotencyKey`
- Withdrawals: `withdrawals.idempotencyKey` + ledger correlation
- Revenue distribution: `runIdempotencyKey`

Primary purchase also validates body hash on replay.
