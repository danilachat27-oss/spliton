-- Analytics query indexes (additive, safe for production)

CREATE INDEX IF NOT EXISTS "wallet_transactions_happened_at_tx_type_status_idx"
  ON "wallet_transactions" ("happened_at", "tx_type", "status");

CREATE INDEX IF NOT EXISTS "deposits_status_created_at_idx"
  ON "deposits" ("status", "created_at");

CREATE INDEX IF NOT EXISTS "withdrawals_status_requested_at_idx"
  ON "withdrawals" ("status", "requested_at");

CREATE INDEX IF NOT EXISTS "fees_created_at_fee_code_idx"
  ON "fees" ("created_at", "fee_code");
