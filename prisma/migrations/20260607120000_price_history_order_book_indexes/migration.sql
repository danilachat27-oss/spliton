CREATE INDEX IF NOT EXISTS "price_history_release_bucket_ts_idx"
  ON "price_history" ("release_id", "bucket", "ts");

CREATE INDEX IF NOT EXISTS "order_book_snapshots_release_captured_idx"
  ON "order_book_snapshots" ("release_id", "captured_at" DESC);
