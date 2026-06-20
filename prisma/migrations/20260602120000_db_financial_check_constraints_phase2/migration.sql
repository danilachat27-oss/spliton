-- Phase 2 financial CHECK constraints (run after npm run db:constraint-prechecks)
-- See docs/database/DB_CONSTRAINT_PRECHECKS.md

-- market_listings
ALTER TABLE "market_listings"
  ADD CONSTRAINT "market_listings_price_per_unit_positive"
  CHECK ("price_per_unit" > 0);

ALTER TABLE "market_listings"
  ADD CONSTRAINT "market_listings_units_total_positive"
  CHECK ("units_total" > 0);

ALTER TABLE "market_listings"
  ADD CONSTRAINT "market_listings_units_available_non_negative"
  CHECK ("units_available" >= 0);

ALTER TABLE "market_listings"
  ADD CONSTRAINT "market_listings_units_available_lte_total"
  CHECK ("units_available" <= "units_total");

-- orders
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_units_total_positive"
  CHECK ("units_total" > 0);

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_units_filled_non_negative"
  CHECK ("units_filled" >= 0);

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_units_filled_lte_total"
  CHECK ("units_filled" <= "units_total");

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_price_limit_non_negative"
  CHECK ("price_limit" IS NULL OR "price_limit" >= 0);

-- trades
ALTER TABLE "trades"
  ADD CONSTRAINT "trades_price_positive"
  CHECK ("price" > 0);

ALTER TABLE "trades"
  ADD CONSTRAINT "trades_units_positive"
  CHECK ("units" > 0);

ALTER TABLE "trades"
  ADD CONSTRAINT "trades_gross_amount_non_negative"
  CHECK ("gross_amount" >= 0);

ALTER TABLE "trades"
  ADD CONSTRAINT "trades_fee_total_non_negative"
  CHECK ("fee_total" >= 0);

ALTER TABLE "trades"
  ADD CONSTRAINT "trades_fee_lte_gross"
  CHECK ("fee_total" <= "gross_amount");

-- order_fills
ALTER TABLE "order_fills"
  ADD CONSTRAINT "order_fills_units_positive"
  CHECK ("units" > 0);

ALTER TABLE "order_fills"
  ADD CONSTRAINT "order_fills_price_positive"
  CHECK ("price" > 0);

ALTER TABLE "order_fills"
  ADD CONSTRAINT "order_fills_gross_non_negative"
  CHECK ("gross_amount" >= 0);

ALTER TABLE "order_fills"
  ADD CONSTRAINT "order_fills_fee_non_negative"
  CHECK ("fee_amount" >= 0);

ALTER TABLE "order_fills"
  ADD CONSTRAINT "order_fills_net_non_negative"
  CHECK ("net_amount" >= 0);

ALTER TABLE "order_fills"
  ADD CONSTRAINT "order_fills_fee_lte_gross"
  CHECK ("fee_amount" <= "gross_amount");

-- payouts
ALTER TABLE "payouts"
  ADD CONSTRAINT "payouts_units_eligible_non_negative"
  CHECK ("units_eligible" >= 0);

ALTER TABLE "payouts"
  ADD CONSTRAINT "payouts_amount_gross_non_negative"
  CHECK ("amount_gross" >= 0);

ALTER TABLE "payouts"
  ADD CONSTRAINT "payouts_amount_net_non_negative"
  CHECK ("amount_net" >= 0);

ALTER TABLE "payouts"
  ADD CONSTRAINT "payouts_amount_net_lte_gross"
  CHECK ("amount_net" <= "amount_gross");

-- fees
ALTER TABLE "fees"
  ADD CONSTRAINT "fees_amount_charged_non_negative"
  CHECK ("amount_charged" >= 0);

ALTER TABLE "fees"
  ADD CONSTRAINT "fees_rate_non_negative"
  CHECK ("rate" IS NULL OR "rate" >= 0);

ALTER TABLE "fees"
  ADD CONSTRAINT "fees_fixed_amount_non_negative"
  CHECK ("fixed_amount" IS NULL OR "fixed_amount" >= 0);

-- earning_distributions
ALTER TABLE "earning_distributions"
  ADD CONSTRAINT "earning_distributions_total_distributable_non_negative"
  CHECK ("total_distributable" >= 0);

ALTER TABLE "earning_distributions"
  ADD CONSTRAINT "earning_distributions_per_unit_amount_non_negative"
  CHECK ("per_unit_amount" >= 0);

ALTER TABLE "earning_distributions"
  ADD CONSTRAINT "earning_distributions_snapshot_units_non_negative"
  CHECK ("snapshot_eligible_units" >= 0);

-- release_share_lots
ALTER TABLE "release_share_lots"
  ADD CONSTRAINT "release_share_lots_units_total_non_negative"
  CHECK ("units_total" >= 0);

ALTER TABLE "release_share_lots"
  ADD CONSTRAINT "release_share_lots_units_remaining_non_negative"
  CHECK ("units_remaining" >= 0);

ALTER TABLE "release_share_lots"
  ADD CONSTRAINT "release_share_lots_units_remaining_lte_total"
  CHECK ("units_remaining" <= "units_total");

-- releases: primary price
ALTER TABLE "releases"
  ADD CONSTRAINT "releases_primary_unit_price_non_negative"
  CHECK ("primary_unit_price" >= 0);

-- user_positions: avg entry
ALTER TABLE "user_positions"
  ADD CONSTRAINT "user_positions_avg_entry_price_non_negative"
  CHECK ("avg_entry_price" >= 0);
