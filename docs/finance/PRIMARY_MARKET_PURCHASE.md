# Primary market purchase flow

Primary unit purchases run in a single database transaction with row-level locks and conditional inventory updates to prevent oversell under concurrent load.

## API

- `POST /api/v1/orders` — create primary purchase (JWT required)
- `GET /api/v1/orders` — user primary order history
- `GET /api/v1/orders/:id` — order detail
- `GET /api/admin/v1/orders/:id` — staff inspect + audit trail

### Idempotency

`Idempotency-Key` header (or `idempotencyKey` in body) is **required**. Replays with the same key return the same `orderId` and `idempotentReplay: true` without debiting again or creating a duplicate order.

Unique constraint: `(user_id, idempotency_key)` on `orders`.

## Transaction steps

1. Validate user is `ACTIVE`
2. `SELECT … FROM primary_raise_rounds … FOR UPDATE`
3. `SELECT … FROM releases … FOR UPDATE`
4. Validate round `LIVE`, release `ACTIVE`, units, hard cap, wallet balance
5. Create order (`CREATED`)
6. Debit wallet via ledger (`PAID`)
7. Record wallet tx, platform fee row, fee ledger
8. Atomic `UPDATE` on round/release with `sold_units + units <= total_units` and `units_available_primary >= units` (affected row check)
9. Update share lot (if present), user position, ownership ledger
10. Set order `SETTLED`, write audit log

## Order status lifecycle

| Status | Meaning |
|--------|---------|
| `CREATED` | Order row inserted |
| `PAID` | Wallet debited |
| `SETTLED` | Inventory and position updated |
| `FAILED` | Reserved for explicit failure persistence |
| `CANCELLED` | User/admin cancellation |

## Decimal handling

Amounts use `Prisma.Decimal` / DB `DECIMAL(20,8)`; API responses expose string values.

## Tests

`apps/backend/test/primary-order.e2e-spec.ts` covers success, idempotency, insufficient balance, sold out, and concurrent last-unit purchase.
