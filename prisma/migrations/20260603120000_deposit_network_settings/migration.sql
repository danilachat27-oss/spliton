-- CreateEnum
CREATE TYPE "deposit_address_pool_status" AS ENUM ('AVAILABLE', 'ASSIGNED', 'ACTIVE', 'ROTATED', 'DISABLED', 'COMPROMISED');

-- deposit_address_source (incl. ADMIN_POOL) — must exist before deposit_address_pool; treasury migration is idempotent.
DO $$ BEGIN
  CREATE TYPE "deposit_address_source" AS ENUM (
    'STATIC',
    'PROVIDER',
    'GENERATED',
    'MANUAL',
    'ADMIN_POOL'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE "deposit_network_settings" (
    "id" TEXT NOT NULL DEFAULT 'usdt-trc20',
    "asset" TEXT NOT NULL DEFAULT 'USDT',
    "network" TEXT NOT NULL DEFAULT 'TRC20',
    "chain" TEXT NOT NULL DEFAULT 'TRON',
    "token_contract_address" TEXT,
    "token_decimals" INTEGER NOT NULL DEFAULT 6,
    "min_deposit_amount" DECIMAL(20,8) NOT NULL DEFAULT 0.01,
    "min_confirmations" INTEGER NOT NULL DEFAULT 20,
    "estimated_credit_time_minutes" INTEGER NOT NULL DEFAULT 1,
    "withdraw_available_after_minutes" INTEGER NOT NULL DEFAULT 2,
    "deposit_enabled" BOOLEAN NOT NULL DEFAULT true,
    "withdrawal_enabled" BOOLEAN NOT NULL DEFAULT true,
    "provider_mode" TEXT NOT NULL DEFAULT 'mock',
    "provider_name" TEXT,
    "explorer_tx_url_template" TEXT,
    "explorer_address_url_template" TEXT,
    "explorer_token_url_template" TEXT,
    "user_warning_ru" TEXT,
    "user_warning_en" TEXT,
    "user_warning_ka" TEXT,
    "maintenance_message_ru" TEXT,
    "maintenance_message_en" TEXT,
    "maintenance_message_ka" TEXT,
    "updated_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_network_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_address_pool" (
    "id" UUID NOT NULL,
    "asset" TEXT NOT NULL DEFAULT 'USDT',
    "network" TEXT NOT NULL DEFAULT 'TRC20',
    "address" TEXT NOT NULL,
    "status" "deposit_address_pool_status" NOT NULL DEFAULT 'AVAILABLE',
    "source" "deposit_address_source" NOT NULL DEFAULT 'ADMIN_POOL',
    "assigned_wallet_id" UUID,
    "assigned_user_id" UUID,
    "provider_address_id" TEXT,
    "assigned_at" TIMESTAMP(3),
    "rotated_at" TIMESTAMP(3),
    "disabled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_address_pool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deposit_network_settings_asset_network_uidx" ON "deposit_network_settings"("asset", "network");

-- CreateIndex
CREATE UNIQUE INDEX "deposit_address_pool_address_uidx" ON "deposit_address_pool"("address");

-- CreateIndex
CREATE INDEX "deposit_address_pool_status_asset_network_idx" ON "deposit_address_pool"("status", "asset", "network");
