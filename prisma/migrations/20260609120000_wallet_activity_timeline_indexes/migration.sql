-- Deterministic wallet activity timeline (wallet_id + happened_at desc + id desc)
CREATE INDEX IF NOT EXISTS wallet_transactions_wallet_id_happened_at_id_idx
  ON wallet_transactions (wallet_id, happened_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS wallet_transactions_wallet_id_tx_type_status_idx
  ON wallet_transactions (wallet_id, tx_type, status);
