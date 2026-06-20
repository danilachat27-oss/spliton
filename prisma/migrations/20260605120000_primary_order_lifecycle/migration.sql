-- Primary order lifecycle statuses + order metadata for purchases

ALTER TYPE "order_status" ADD VALUE IF NOT EXISTS 'CREATED';
ALTER TYPE "order_status" ADD VALUE IF NOT EXISTS 'PAID';
ALTER TYPE "order_status" ADD VALUE IF NOT EXISTS 'SETTLED';
ALTER TYPE "order_status" ADD VALUE IF NOT EXISTS 'FAILED';

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "primary_raise_round_id" UUID,
  ADD COLUMN IF NOT EXISTS "gross_amount" DECIMAL(20,8),
  ADD COLUMN IF NOT EXISTS "fee_amount" DECIMAL(20,8),
  ADD COLUMN IF NOT EXISTS "net_amount" DECIMAL(20,8),
  ADD COLUMN IF NOT EXISTS "unit_price" DECIMAL(20,8);

CREATE INDEX IF NOT EXISTS "orders_primary_raise_round_id_idx"
  ON "orders" ("primary_raise_round_id");

CREATE INDEX IF NOT EXISTS "orders_user_id_idempotency_key_idx"
  ON "orders" ("user_id", "idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;
