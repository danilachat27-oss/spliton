CREATE INDEX IF NOT EXISTS ownership_ledger_user_release_happened_idx
  ON ownership_ledger (user_id, release_id, happened_at DESC);

CREATE INDEX IF NOT EXISTS earning_distributions_release_created_idx
  ON earning_distributions (release_id, created_at DESC);
