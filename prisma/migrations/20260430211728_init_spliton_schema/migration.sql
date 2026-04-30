-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED', 'DELETED');

-- CreateEnum
CREATE TYPE "user_role_code" AS ENUM ('INVESTOR', 'ARTIST', 'ADMIN', 'SUPPORT');

-- CreateEnum
CREATE TYPE "release_status" AS ENUM ('DRAFT', 'REVIEW', 'ACTIVE', 'PAUSED', 'SOLD_OUT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "payout_frequency" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "share_lot_type" AS ENUM ('PRIMARY', 'SECONDARY_POOL', 'TREASURY');

-- CreateEnum
CREATE TYPE "artist_release_role" AS ENUM ('MAIN', 'FEATURED', 'PRODUCER', 'LABEL');

-- CreateEnum
CREATE TYPE "ownership_event_type" AS ENUM ('PRIMARY_BUY', 'SECONDARY_BUY', 'SECONDARY_SELL', 'LOCK_FOR_SELL', 'UNLOCK_AFTER_CANCEL', 'PAYOUT_SNAPSHOT', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "listing_status" AS ENUM ('ACTIVE', 'PAUSED', 'SOLD_OUT', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "order_side" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "order_type" AS ENUM ('LIMIT', 'MARKET');

-- CreateEnum
CREATE TYPE "time_in_force" AS ENUM ('GTC', 'IOC', 'FOK', 'DAY');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "trade_settlement_status" AS ENUM ('PENDING', 'SETTLED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "price_bucket" AS ENUM ('M1', 'M5', 'M15', 'H1', 'H4', 'D1');

-- CreateEnum
CREATE TYPE "wallet_status" AS ENUM ('ACTIVE', 'BLOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "wallet_tx_type" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRADE_LOCK', 'TRADE_SETTLEMENT', 'PAYOUT', 'FEE', 'REFUND', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "wallet_tx_direction" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "wallet_tx_status" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED');

-- CreateEnum
CREATE TYPE "withdrawal_status" AS ENUM ('REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "deposit_status" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "earning_period_status" AS ENUM ('OPEN', 'CALCULATED', 'DISTRIBUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "payout_status" AS ENUM ('PENDING', 'ACCRUED', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "kyc_status" AS ENUM ('NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "kyc_document_status" AS ENUM ('UPLOADED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "notification_status" AS ENUM ('PENDING', 'SENT', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "actor_role" AS ENUM ('SYSTEM', 'USER', 'ADMIN', 'SUPPORT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "auth_provider" TEXT NOT NULL DEFAULT 'email',
    "status" "user_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" UUID NOT NULL,
    "display_name" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "country_code" TEXT,
    "timezone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "code" "user_role_code" NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artists" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labels" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "releases" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "segment" TEXT,
    "status" "release_status" NOT NULL DEFAULT 'DRAFT',
    "payout_frequency" "payout_frequency" NOT NULL,
    "total_units" DECIMAL(20,8) NOT NULL,
    "units_available_primary" DECIMAL(20,8) NOT NULL,
    "primary_unit_price" DECIMAL(20,8) NOT NULL,
    "label_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release_artists" (
    "id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "role" "artist_release_role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "release_artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release_metrics_daily" (
    "id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "as_of_date" DATE NOT NULL,
    "yield_pct" DECIMAL(10,6),
    "payouts_total" DECIMAL(20,8),
    "activity_score" DECIMAL(10,4),
    "liquidity_score" DECIMAL(10,4),
    "volume_24h_notional" DECIMAL(20,8),
    "volume_24h_units" DECIMAL(20,8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "release_metrics_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release_share_lots" (
    "id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "lot_type" "share_lot_type" NOT NULL,
    "units_total" DECIMAL(20,8) NOT NULL,
    "units_remaining" DECIMAL(20,8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "release_share_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_positions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "units_total" DECIMAL(20,8) NOT NULL,
    "units_available" DECIMAL(20,8) NOT NULL,
    "units_locked" DECIMAL(20,8) NOT NULL,
    "avg_entry_price" DECIMAL(20,8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_listings" (
    "id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "seller_user_id" UUID NOT NULL,
    "listing_type" TEXT NOT NULL DEFAULT 'standard',
    "price_per_unit" DECIMAL(20,8) NOT NULL,
    "units_total" DECIMAL(20,8) NOT NULL,
    "units_available" DECIMAL(20,8) NOT NULL,
    "status" "listing_status" NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "market_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "listing_id" UUID,
    "side" "order_side" NOT NULL,
    "order_type" "order_type" NOT NULL,
    "time_in_force" "time_in_force" NOT NULL,
    "price_limit" DECIMAL(20,8),
    "units_total" DECIMAL(20,8) NOT NULL,
    "units_filled" DECIMAL(20,8) NOT NULL,
    "status" "order_status" NOT NULL,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "buy_order_id" UUID NOT NULL,
    "sell_order_id" UUID NOT NULL,
    "buyer_user_id" UUID NOT NULL,
    "seller_user_id" UUID NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "units" DECIMAL(20,8) NOT NULL,
    "gross_amount" DECIMAL(20,8) NOT NULL,
    "fee_total" DECIMAL(20,8) NOT NULL,
    "settlement_status" "trade_settlement_status" NOT NULL,
    "executed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_fills" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "trade_id" UUID NOT NULL,
    "side" "order_side" NOT NULL,
    "units" DECIMAL(20,8) NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "gross_amount" DECIMAL(20,8) NOT NULL,
    "fee_amount" DECIMAL(20,8) NOT NULL,
    "net_amount" DECIMAL(20,8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_fills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "bucket" "price_bucket" NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "open_price" DECIMAL(20,8) NOT NULL,
    "high_price" DECIMAL(20,8) NOT NULL,
    "low_price" DECIMAL(20,8) NOT NULL,
    "close_price" DECIMAL(20,8) NOT NULL,
    "volume_units" DECIMAL(20,8) NOT NULL,
    "volume_notional" DECIMAL(20,8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "asset_code" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT,
    "status" "wallet_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_balances" (
    "wallet_id" UUID NOT NULL,
    "available" DECIMAL(20,8) NOT NULL,
    "locked" DECIMAL(20,8) NOT NULL,
    "pending" DECIMAL(20,8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_balances_pkey" PRIMARY KEY ("wallet_id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "tx_type" "wallet_tx_type" NOT NULL,
    "direction" "wallet_tx_direction" NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "fee_amount" DECIMAL(20,8) NOT NULL,
    "net_amount" DECIMAL(20,8) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "wallet_tx_status" NOT NULL,
    "reference_type" TEXT,
    "reference_id" UUID,
    "happened_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "settled_at" TIMESTAMP(3),

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" UUID NOT NULL,
    "wallet_tx_id" UUID NOT NULL,
    "blockchain_txid" TEXT,
    "from_address" TEXT,
    "to_address" TEXT,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "required_confirmations" INTEGER NOT NULL DEFAULT 1,
    "status" "deposit_status" NOT NULL,
    "received_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" UUID NOT NULL,
    "wallet_tx_id" UUID NOT NULL,
    "to_address" TEXT NOT NULL,
    "blockchain_txid" TEXT,
    "status" "withdrawal_status" NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fees" (
    "id" UUID NOT NULL,
    "wallet_transaction_id" UUID,
    "fee_code" TEXT NOT NULL,
    "subject_type" TEXT NOT NULL,
    "subject_id" UUID,
    "rate" DECIMAL(10,6),
    "fixed_amount" DECIMAL(20,8),
    "amount_charged" DECIMAL(20,8) NOT NULL,
    "currency" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "earning_periods" (
    "id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "status" "earning_period_status" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "earning_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "earning_reports" (
    "id" UUID NOT NULL,
    "earning_period_id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "gross_revenue" DECIMAL(20,8) NOT NULL,
    "net_revenue" DECIMAL(20,8) NOT NULL,
    "report_hash" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "earning_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "earning_distributions" (
    "id" UUID NOT NULL,
    "earning_period_id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "total_distributable" DECIMAL(20,8) NOT NULL,
    "per_unit_amount" DECIMAL(20,8) NOT NULL,
    "snapshot_eligible_units" DECIMAL(20,8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "earning_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "earning_distribution_id" UUID NOT NULL,
    "wallet_tx_id" UUID,
    "units_eligible" DECIMAL(20,8) NOT NULL,
    "amount_gross" DECIMAL(20,8) NOT NULL,
    "amount_net" DECIMAL(20,8) NOT NULL,
    "status" "payout_status" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ownership_ledger" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "event_type" "ownership_event_type" NOT NULL,
    "units_delta" DECIMAL(20,8) NOT NULL,
    "price_per_unit" DECIMAL(20,8),
    "trade_id" UUID,
    "order_fill_id" UUID,
    "wallet_transaction_id" UUID,
    "happened_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ownership_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_actions" (
    "id" UUID NOT NULL,
    "admin_user_id" UUID NOT NULL,
    "action_type" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "actor_role" "actor_role" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "action" TEXT NOT NULL,
    "before_jsonb" JSONB,
    "after_jsonb" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_verifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "kyc_status" NOT NULL DEFAULT 'NOT_STARTED',
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" UUID,
    "reject_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" UUID NOT NULL,
    "kyc_verification_id" UUID NOT NULL,
    "doc_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "status" "kyc_document_status" NOT NULL DEFAULT 'UPLOADED',
    "uploaded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "payload_jsonb" JSONB,
    "status" "notification_status" NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device" TEXT NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "last_active_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release_documents" (
    "id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "doc_type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploaded_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "release_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release_analytics_snapshots" (
    "id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "as_of_ts" TIMESTAMP(3) NOT NULL,
    "period_code" TEXT NOT NULL,
    "yield_pct" DECIMAL(10,6),
    "payouts_total" DECIMAL(20,8),
    "volume_notional" DECIMAL(20,8),
    "volume_units" DECIMAL(20,8),
    "liquidity_score" DECIMAL(10,4),
    "activity_score" DECIMAL(10,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "release_analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_book_snapshots" (
    "id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL,
    "top_bid_price" DECIMAL(20,8),
    "top_ask_price" DECIMAL(20,8),
    "spread_amount" DECIMAL(20,8),
    "bid_depth_units" DECIMAL(20,8),
    "ask_depth_units" DECIMAL(20,8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_book_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_claims" (
    "id" UUID NOT NULL,
    "payout_id" UUID NOT NULL,
    "claimant_user_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_flags" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "flag_code" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "artists_slug_key" ON "artists"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "labels_slug_key" ON "labels"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "releases_slug_key" ON "releases"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "releases_symbol_key" ON "releases"("symbol");

-- CreateIndex
CREATE INDEX "releases_status_created_at_idx" ON "releases"("status", "created_at");

-- CreateIndex
CREATE INDEX "release_artists_artist_id_idx" ON "release_artists"("artist_id");

-- CreateIndex
CREATE UNIQUE INDEX "release_artists_release_id_artist_id_role_key" ON "release_artists"("release_id", "artist_id", "role");

-- CreateIndex
CREATE INDEX "release_metrics_daily_release_id_as_of_date_idx" ON "release_metrics_daily"("release_id", "as_of_date");

-- CreateIndex
CREATE UNIQUE INDEX "release_metrics_daily_release_id_as_of_date_key" ON "release_metrics_daily"("release_id", "as_of_date");

-- CreateIndex
CREATE INDEX "release_share_lots_release_id_lot_type_idx" ON "release_share_lots"("release_id", "lot_type");

-- CreateIndex
CREATE INDEX "user_positions_release_id_idx" ON "user_positions"("release_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_positions_user_id_release_id_key" ON "user_positions"("user_id", "release_id");

-- CreateIndex
CREATE INDEX "market_listings_release_id_status_idx" ON "market_listings"("release_id", "status");

-- CreateIndex
CREATE INDEX "market_listings_seller_user_id_status_idx" ON "market_listings"("seller_user_id", "status");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_release_id_status_side_idx" ON "orders"("release_id", "status", "side");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "trades_release_id_executed_at_idx" ON "trades"("release_id", "executed_at");

-- CreateIndex
CREATE INDEX "trades_buy_order_id_idx" ON "trades"("buy_order_id");

-- CreateIndex
CREATE INDEX "trades_sell_order_id_idx" ON "trades"("sell_order_id");

-- CreateIndex
CREATE INDEX "order_fills_order_id_idx" ON "order_fills"("order_id");

-- CreateIndex
CREATE INDEX "order_fills_trade_id_idx" ON "order_fills"("trade_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_fills_trade_id_order_id_key" ON "order_fills"("trade_id", "order_id");

-- CreateIndex
CREATE INDEX "price_history_release_id_bucket_ts_idx" ON "price_history"("release_id", "bucket", "ts");

-- CreateIndex
CREATE UNIQUE INDEX "price_history_release_id_bucket_ts_key" ON "price_history"("release_id", "bucket", "ts");

-- CreateIndex
CREATE INDEX "wallets_user_id_idx" ON "wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_asset_code_network_key" ON "wallets"("user_id", "asset_code", "network");

-- CreateIndex
CREATE INDEX "wallet_transactions_wallet_id_created_at_idx" ON "wallet_transactions"("wallet_id", "created_at");

-- CreateIndex
CREATE INDEX "wallet_transactions_wallet_id_tx_type_status_idx" ON "wallet_transactions"("wallet_id", "tx_type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "deposits_wallet_tx_id_key" ON "deposits"("wallet_tx_id");

-- CreateIndex
CREATE UNIQUE INDEX "deposits_blockchain_txid_key" ON "deposits"("blockchain_txid");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawals_wallet_tx_id_key" ON "withdrawals"("wallet_tx_id");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawals_blockchain_txid_key" ON "withdrawals"("blockchain_txid");

-- CreateIndex
CREATE INDEX "fees_wallet_transaction_id_idx" ON "fees"("wallet_transaction_id");

-- CreateIndex
CREATE INDEX "fees_subject_type_subject_id_idx" ON "fees"("subject_type", "subject_id");

-- CreateIndex
CREATE INDEX "earning_periods_release_id_status_idx" ON "earning_periods"("release_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "earning_periods_release_id_period_start_period_end_key" ON "earning_periods"("release_id", "period_start", "period_end");

-- CreateIndex
CREATE INDEX "earning_reports_earning_period_id_idx" ON "earning_reports"("earning_period_id");

-- CreateIndex
CREATE INDEX "earning_distributions_earning_period_id_idx" ON "earning_distributions"("earning_period_id");

-- CreateIndex
CREATE INDEX "earning_distributions_release_id_idx" ON "earning_distributions"("release_id");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_wallet_tx_id_key" ON "payouts"("wallet_tx_id");

-- CreateIndex
CREATE INDEX "payouts_user_id_status_idx" ON "payouts"("user_id", "status");

-- CreateIndex
CREATE INDEX "payouts_earning_distribution_id_idx" ON "payouts"("earning_distribution_id");

-- CreateIndex
CREATE INDEX "ownership_ledger_user_id_release_id_happened_at_idx" ON "ownership_ledger"("user_id", "release_id", "happened_at");

-- CreateIndex
CREATE INDEX "ownership_ledger_trade_id_idx" ON "ownership_ledger"("trade_id");

-- CreateIndex
CREATE INDEX "ownership_ledger_order_fill_id_idx" ON "ownership_ledger"("order_fill_id");

-- CreateIndex
CREATE INDEX "ownership_ledger_wallet_transaction_id_idx" ON "ownership_ledger"("wallet_transaction_id");

-- CreateIndex
CREATE INDEX "admin_actions_admin_user_id_created_at_idx" ON "admin_actions"("admin_user_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_actions_target_type_target_id_idx" ON "admin_actions"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "kyc_verifications_user_id_status_idx" ON "kyc_verifications"("user_id", "status");

-- CreateIndex
CREATE INDEX "kyc_documents_kyc_verification_id_idx" ON "kyc_documents"("kyc_verification_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_status_created_at_idx" ON "notifications"("user_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_last_active_at_idx" ON "user_sessions"("user_id", "last_active_at");

-- CreateIndex
CREATE INDEX "release_documents_release_id_doc_type_idx" ON "release_documents"("release_id", "doc_type");

-- CreateIndex
CREATE INDEX "release_analytics_snapshots_release_id_period_code_as_of_ts_idx" ON "release_analytics_snapshots"("release_id", "period_code", "as_of_ts");

-- CreateIndex
CREATE INDEX "order_book_snapshots_release_id_captured_at_idx" ON "order_book_snapshots"("release_id", "captured_at");

-- CreateIndex
CREATE INDEX "payout_claims_claimant_user_id_status_idx" ON "payout_claims"("claimant_user_id", "status");

-- CreateIndex
CREATE INDEX "risk_flags_user_id_is_active_created_at_idx" ON "risk_flags"("user_id", "is_active", "created_at");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_artists" ADD CONSTRAINT "release_artists_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_artists" ADD CONSTRAINT "release_artists_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_metrics_daily" ADD CONSTRAINT "release_metrics_daily_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_share_lots" ADD CONSTRAINT "release_share_lots_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_positions" ADD CONSTRAINT "user_positions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_positions" ADD CONSTRAINT "user_positions_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_listings" ADD CONSTRAINT "market_listings_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_listings" ADD CONSTRAINT "market_listings_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "market_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_buy_order_id_fkey" FOREIGN KEY ("buy_order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_sell_order_id_fkey" FOREIGN KEY ("sell_order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_buyer_user_id_fkey" FOREIGN KEY ("buyer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fills" ADD CONSTRAINT "order_fills_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fills" ADD CONSTRAINT "order_fills_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_balances" ADD CONSTRAINT "wallet_balances_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_wallet_tx_id_fkey" FOREIGN KEY ("wallet_tx_id") REFERENCES "wallet_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_wallet_tx_id_fkey" FOREIGN KEY ("wallet_tx_id") REFERENCES "wallet_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fees" ADD CONSTRAINT "fees_wallet_transaction_id_fkey" FOREIGN KEY ("wallet_transaction_id") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earning_periods" ADD CONSTRAINT "earning_periods_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earning_reports" ADD CONSTRAINT "earning_reports_earning_period_id_fkey" FOREIGN KEY ("earning_period_id") REFERENCES "earning_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earning_distributions" ADD CONSTRAINT "earning_distributions_earning_period_id_fkey" FOREIGN KEY ("earning_period_id") REFERENCES "earning_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earning_distributions" ADD CONSTRAINT "earning_distributions_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_earning_distribution_id_fkey" FOREIGN KEY ("earning_distribution_id") REFERENCES "earning_distributions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_wallet_tx_id_fkey" FOREIGN KEY ("wallet_tx_id") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_ledger" ADD CONSTRAINT "ownership_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_ledger" ADD CONSTRAINT "ownership_ledger_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_ledger" ADD CONSTRAINT "ownership_ledger_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_ledger" ADD CONSTRAINT "ownership_ledger_order_fill_id_fkey" FOREIGN KEY ("order_fill_id") REFERENCES "order_fills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_ledger" ADD CONSTRAINT "ownership_ledger_wallet_transaction_id_fkey" FOREIGN KEY ("wallet_transaction_id") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_kyc_verification_id_fkey" FOREIGN KEY ("kyc_verification_id") REFERENCES "kyc_verifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_documents" ADD CONSTRAINT "release_documents_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_analytics_snapshots" ADD CONSTRAINT "release_analytics_snapshots_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_book_snapshots" ADD CONSTRAINT "order_book_snapshots_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_claims" ADD CONSTRAINT "payout_claims_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "payouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_flags" ADD CONSTRAINT "risk_flags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
