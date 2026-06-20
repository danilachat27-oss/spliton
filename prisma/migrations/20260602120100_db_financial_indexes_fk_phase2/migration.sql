-- Phase 2 indexes, uniqueness, FK hardening (additive)

-- Payout: one row per holder per distribution run
CREATE UNIQUE INDEX IF NOT EXISTS "payouts_user_id_earning_distribution_id_key"
  ON "payouts" ("user_id", "earning_distribution_id");

-- Wallet ledger: time-ordered history per wallet (analytics + user statement)
CREATE INDEX IF NOT EXISTS "wallet_transactions_wallet_id_happened_at_idx"
  ON "wallet_transactions" ("wallet_id", "happened_at" DESC);

-- Portfolio by user (positions list / distribution snapshot)
CREATE INDEX IF NOT EXISTS "user_positions_user_id_release_id_idx"
  ON "user_positions" ("user_id", "release_id");

-- Payouts admin / release analytics
CREATE INDEX IF NOT EXISTS "payouts_release_id_status_idx"
  ON "payouts" ("release_id", "status");

-- Report worker queue (pending/processing only; rebuilt in fix_align_schema_after_reset)
CREATE INDEX IF NOT EXISTS "report_jobs_queue_status_created_at_idx"
  ON "report_jobs" ("status", "created_at")
  WHERE "status" IN ('PENDING', 'PROCESSING');

-- Audit: operator + action filters
CREATE INDEX IF NOT EXISTS "audit_logs_actor_role_action_created_at_idx"
  ON "audit_logs" ("actor_role", "action", "created_at" DESC);

-- Compliance: active flags by severity
CREATE INDEX IF NOT EXISTS "risk_flags_severity_active_created_at_idx"
  ON "risk_flags" ("severity", "is_active", "created_at" DESC);

-- Ownership ledger: release-scoped history
CREATE INDEX IF NOT EXISTS "ownership_ledger_release_id_happened_at_idx"
  ON "ownership_ledger" ("release_id", "happened_at" DESC);

-- Orders: release queue
CREATE INDEX IF NOT EXISTS "orders_release_id_created_at_idx"
  ON "orders" ("release_id", "created_at" DESC);

-- Admin search (optional extension — safe IF NOT EXISTS)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "users_email_trgm_idx"
  ON "users" USING gin ("email" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "releases_title_trgm_idx"
  ON "releases" USING gin ("title" gin_trgm_ops);

-- Protect holdings when user row is hard-deleted (financial history preserved)
ALTER TABLE "user_positions" DROP CONSTRAINT IF EXISTS "user_positions_user_id_fkey";

ALTER TABLE "user_positions"
  ADD CONSTRAINT "user_positions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
