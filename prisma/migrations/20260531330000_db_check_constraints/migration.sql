-- Additive CHECK constraints (prechecks passed 2026-05-31 — scripts/db-constraint-prechecks.mjs)

-- wallet_balances
ALTER TABLE "wallet_balances"
  ADD CONSTRAINT "wallet_balances_available_non_negative" CHECK ("available" >= 0);

ALTER TABLE "wallet_balances"
  ADD CONSTRAINT "wallet_balances_locked_non_negative" CHECK ("locked" >= 0);

ALTER TABLE "wallet_balances"
  ADD CONSTRAINT "wallet_balances_pending_non_negative" CHECK ("pending" >= 0);

-- user_positions
ALTER TABLE "user_positions"
  ADD CONSTRAINT "user_positions_units_total_non_negative" CHECK ("units_total" >= 0);

ALTER TABLE "user_positions"
  ADD CONSTRAINT "user_positions_units_available_non_negative" CHECK ("units_available" >= 0);

ALTER TABLE "user_positions"
  ADD CONSTRAINT "user_positions_units_locked_non_negative" CHECK ("units_locked" >= 0);

ALTER TABLE "user_positions"
  ADD CONSTRAINT "user_positions_units_allocation_valid"
  CHECK ("units_available" + "units_locked" <= "units_total");

-- releases (tracks)
ALTER TABLE "releases"
  ADD CONSTRAINT "releases_total_units_non_negative" CHECK ("total_units" >= 0);

ALTER TABLE "releases"
  ADD CONSTRAINT "releases_units_available_primary_valid"
  CHECK ("units_available_primary" >= 0 AND "units_available_primary" <= "total_units");

ALTER TABLE "releases"
  ADD CONSTRAINT "releases_share_pct_sum_100_when_set"
  CHECK (
    "platform_share_pct" IS NULL
    OR "artist_share_pct" IS NULL
    OR "holder_share_pct" IS NULL
    OR ABS("platform_share_pct" + "artist_share_pct" + "holder_share_pct" - 100) <= 0.0001
  );

-- primary_raise_rounds
ALTER TABLE "primary_raise_rounds"
  ADD CONSTRAINT "primary_raise_rounds_total_units_non_negative" CHECK ("total_units" >= 0);

ALTER TABLE "primary_raise_rounds"
  ADD CONSTRAINT "primary_raise_rounds_sold_units_non_negative" CHECK ("sold_units" >= 0);

ALTER TABLE "primary_raise_rounds"
  ADD CONSTRAINT "primary_raise_rounds_sold_lte_total"
  CHECK ("sold_units" <= "total_units");

ALTER TABLE "primary_raise_rounds"
  ADD CONSTRAINT "primary_raise_rounds_raise_target_non_negative"
  CHECK ("raise_target_usdt" >= 0);

ALTER TABLE "primary_raise_rounds"
  ADD CONSTRAINT "primary_raise_rounds_hard_cap_non_negative"
  CHECK ("hard_cap_usdt" >= 0);

-- deposits / withdrawals amounts live on wallet_transactions
ALTER TABLE "wallet_transactions"
  ADD CONSTRAINT "wallet_transactions_amount_positive" CHECK ("amount" > 0);

ALTER TABLE "wallet_transactions"
  ADD CONSTRAINT "wallet_transactions_fee_non_negative" CHECK ("fee_amount" >= 0);

ALTER TABLE "wallet_transactions"
  ADD CONSTRAINT "wallet_transactions_net_non_negative" CHECK ("net_amount" >= 0);
