-- Secondary market listing query indexes for live catalog

CREATE INDEX IF NOT EXISTS "market_listings_release_id_status_active_idx"
  ON "market_listings" ("release_id", "status")
  WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "trades_release_id_executed_at_idx"
  ON "trades" ("release_id", "executed_at" DESC);
