-- Revenue distribution lifecycle + reconciliation metadata

ALTER TYPE "earning_period_status" ADD VALUE IF NOT EXISTS 'REVIEW';
ALTER TYPE "earning_period_status" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "earning_period_status" ADD VALUE IF NOT EXISTS 'FAILED';

ALTER TABLE "earning_periods"
  ADD COLUMN IF NOT EXISTS "calculation_snapshot" JSONB,
  ADD COLUMN IF NOT EXISTS "run_idempotency_key" TEXT,
  ADD COLUMN IF NOT EXISTS "last_error" TEXT,
  ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "approved_by_user_id" UUID;

CREATE UNIQUE INDEX IF NOT EXISTS "earning_periods_run_idempotency_key_key"
  ON "earning_periods" ("run_idempotency_key")
  WHERE "run_idempotency_key" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "earning_periods_status_created_at_idx"
  ON "earning_periods" ("status", "created_at");

ALTER TABLE "earning_periods"
  ADD CONSTRAINT "earning_periods_approved_by_user_id_fkey"
  FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "earning_distributions"
  ADD COLUMN IF NOT EXISTS "platform_share_amount" DECIMAL(20,8) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "artist_share_amount" DECIMAL(20,8) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "holders_total_paid" DECIMAL(20,8) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "rounding_delta" DECIMAL(20,8) NOT NULL DEFAULT 0;
