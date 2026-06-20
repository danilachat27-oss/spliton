-- Operational indexes (additive, safe for Supabase production)
-- See docs/database/INDEX_AUDIT.md

-- Admin user lists: filter by status, exclude soft-deleted
CREATE INDEX IF NOT EXISTS "users_status_active_idx"
  ON "users" ("status")
  WHERE "deleted_at" IS NULL;

-- Audit log: filter by action + time range
CREATE INDEX IF NOT EXISTS "audit_logs_action_created_at_idx"
  ON "audit_logs" ("action", "created_at" DESC);

-- Ledger idempotency / reconciliation by business reference
CREATE INDEX IF NOT EXISTS "wallet_transactions_reference_type_id_idx"
  ON "wallet_transactions" ("reference_type", "reference_id")
  WHERE "reference_type" IS NOT NULL;

-- Secondary market admin lists
CREATE INDEX IF NOT EXISTS "market_listings_status_created_at_idx"
  ON "market_listings" ("status", "created_at" DESC)
  WHERE "deleted_at" IS NULL;

-- Trades queue / analytics by settlement
CREATE INDEX IF NOT EXISTS "trades_settlement_status_executed_at_idx"
  ON "trades" ("settlement_status", "executed_at" DESC);

-- User positions: holder lookup by user (unique exists; index helps user portfolio queries)
CREATE INDEX IF NOT EXISTS "user_positions_user_id_idx"
  ON "user_positions" ("user_id");
