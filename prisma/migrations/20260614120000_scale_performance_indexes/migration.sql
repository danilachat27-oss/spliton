-- Scale / list performance: user trade history and audit timeline scans
-- Supports: GET /api/v1/market/trades (buyer/seller + executedAt desc)
--           admin secondary market trade lists filtered by participant

CREATE INDEX IF NOT EXISTS trades_buyer_user_id_executed_at_idx
  ON trades (buyer_user_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS trades_seller_user_id_executed_at_idx
  ON trades (seller_user_id, executed_at DESC);

-- Audit log admin list default sort (createdAt desc, optional actor filter uses actor_user_id_created_at_idx)
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx
  ON audit_logs (created_at DESC);
