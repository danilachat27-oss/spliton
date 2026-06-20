-- Market overview: price history and trade aggregates
CREATE INDEX IF NOT EXISTS price_history_release_bucket_ts_idx
  ON price_history (release_id, bucket, ts DESC);

CREATE INDEX IF NOT EXISTS trades_release_executed_settled_idx
  ON trades (release_id, executed_at DESC)
  WHERE settlement_status = 'SETTLED';
