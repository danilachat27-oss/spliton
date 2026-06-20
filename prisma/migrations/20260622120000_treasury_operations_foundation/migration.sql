-- Treasury & real-money operations foundation (Spliton)

CREATE TYPE "withdrawal_provider_status" AS ENUM (
  'NOT_SENT',
  'QUEUED_FOR_PROVIDER',
  'SENT_TO_PROVIDER',
  'BROADCASTED',
  'CONFIRMED',
  'FAILED'
);

CREATE TYPE "treasury_account_type" AS ENUM (
  'USER_LIABILITY',
  'PLATFORM_FEES',
  'DEPOSIT_CLEARING',
  'WITHDRAWAL_CLEARING',
  'PAYOUT_CLEARING',
  'HOT_WALLET',
  'COLD_WALLET',
  'REVENUE_DISTRIBUTION',
  'MANUAL_ADJUSTMENT',
  'SUSPENSE'
);

CREATE TYPE "treasury_account_status" AS ENUM ('ACTIVE', 'DISABLED');

CREATE TYPE "deposit_address_status" AS ENUM ('ACTIVE', 'ROTATED', 'DISABLED', 'COMPROMISED');

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

CREATE TYPE "withdrawal_approval_decision" AS ENUM ('APPROVED', 'REJECTED', 'HOLD');

CREATE TYPE "treasury_discrepancy_severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "treasury_discrepancy_status" AS ENUM ('OPEN', 'INVESTIGATED', 'RESOLVED');

ALTER TABLE "withdrawals"
  ADD COLUMN IF NOT EXISTS "provider_request_id" TEXT,
  ADD COLUMN IF NOT EXISTS "provider_status" "withdrawal_provider_status",
  ADD COLUMN IF NOT EXISTS "provider_tx_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "broadcast_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "confirmed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "confirmations" INTEGER,
  ADD COLUMN IF NOT EXISTS "provider_error_safe" TEXT,
  ADD COLUMN IF NOT EXISTS "retry_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "manual_complete_override" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "manual_complete_reason" TEXT;

CREATE INDEX IF NOT EXISTS "withdrawals_provider_status_idx" ON "withdrawals"("provider_status");

CREATE TABLE "treasury_accounts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "type" "treasury_account_type" NOT NULL,
  "asset" TEXT NOT NULL DEFAULT 'USDT',
  "network" TEXT NOT NULL DEFAULT 'TRC20',
  "address" TEXT,
  "label" TEXT NOT NULL,
  "status" "treasury_account_status" NOT NULL DEFAULT 'ACTIVE',
  "balance_expected" DECIMAL(20,8) NOT NULL DEFAULT 0,
  "balance_observed" DECIMAL(20,8),
  "min_balance_threshold" DECIMAL(20,8),
  "max_balance_threshold" DECIMAL(20,8),
  "last_reconciled_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "treasury_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "treasury_accounts_type_asset_network_uidx"
  ON "treasury_accounts"("type", "asset", "network");

CREATE TABLE "treasury_operational_limits" (
  "id" TEXT NOT NULL DEFAULT 'platform',
  "user_daily_withdrawal_usdt" DECIMAL(20,8) NOT NULL DEFAULT 10000,
  "user_monthly_withdrawal_usdt" DECIMAL(20,8) NOT NULL DEFAULT 50000,
  "user_daily_trade_usdt" DECIMAL(20,8) NOT NULL DEFAULT 25000,
  "max_open_listing_usdt" DECIMAL(20,8) NOT NULL DEFAULT 100000,
  "max_failed_withdrawal_attempts" INTEGER NOT NULL DEFAULT 5,
  "max_auto_credit_deposit_usdt" DECIMAL(20,8) NOT NULL DEFAULT 5000,
  "max_auto_complete_withdrawal_usdt" DECIMAL(20,8) NOT NULL DEFAULT 500,
  "medium_withdrawal_usdt" DECIMAL(20,8) NOT NULL DEFAULT 1000,
  "large_withdrawal_usdt" DECIMAL(20,8) NOT NULL DEFAULT 5000,
  "hot_wallet_max_daily_outflow_usdt" DECIMAL(20,8) NOT NULL DEFAULT 50000,
  "report_export_max_rows" INTEGER NOT NULL DEFAULT 50000,
  "updated_by_user_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "treasury_operational_limits_pkey" PRIMARY KEY ("id")
);

INSERT INTO "treasury_operational_limits" ("id", "updated_at")
VALUES ('platform', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE "withdrawal_approvals" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "withdrawal_id" UUID NOT NULL,
  "approver_user_id" UUID NOT NULL,
  "approver_role" TEXT NOT NULL,
  "decision" "withdrawal_approval_decision" NOT NULL,
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "withdrawal_approvals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "withdrawal_approvals_withdrawal_role_decision_uidx"
  ON "withdrawal_approvals"("withdrawal_id", "approver_role", "decision");

CREATE INDEX "withdrawal_approvals_withdrawal_id_idx" ON "withdrawal_approvals"("withdrawal_id");

ALTER TABLE "withdrawal_approvals"
  ADD CONSTRAINT "withdrawal_approvals_withdrawal_id_fkey"
  FOREIGN KEY ("withdrawal_id") REFERENCES "withdrawals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "withdrawal_approvals"
  ADD CONSTRAINT "withdrawal_approvals_approver_user_id_fkey"
  FOREIGN KEY ("approver_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "treasury_reconciliation_runs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "dry_run" BOOLEAN NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "discrepancy_count" INTEGER NOT NULL,
  "report_summary" JSONB,
  "started_by_user_id" UUID,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "treasury_reconciliation_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "treasury_reconciliation_runs_started_at_idx"
  ON "treasury_reconciliation_runs"("started_at" DESC);

CREATE TABLE "treasury_reconciliation_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "run_id" UUID NOT NULL,
  "treasury_account_id" UUID NOT NULL,
  "expected_amount" DECIMAL(20,8) NOT NULL,
  "observed_amount" DECIMAL(20,8) NOT NULL,
  "delta_amount" DECIMAL(20,8) NOT NULL,
  "severity" "treasury_discrepancy_severity" NOT NULL,
  "status" "treasury_discrepancy_status" NOT NULL DEFAULT 'OPEN',
  "resolve_reason" TEXT,
  "resolved_by_user_id" UUID,
  "resolved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "treasury_reconciliation_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "treasury_reconciliation_items_run_id_idx" ON "treasury_reconciliation_items"("run_id");
CREATE INDEX "treasury_reconciliation_items_status_idx" ON "treasury_reconciliation_items"("status");

ALTER TABLE "treasury_reconciliation_items"
  ADD CONSTRAINT "treasury_reconciliation_items_run_id_fkey"
  FOREIGN KEY ("run_id") REFERENCES "treasury_reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "treasury_reconciliation_items"
  ADD CONSTRAINT "treasury_reconciliation_items_treasury_account_id_fkey"
  FOREIGN KEY ("treasury_account_id") REFERENCES "treasury_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "user_deposit_addresses" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "wallet_id" UUID NOT NULL,
  "address" TEXT NOT NULL,
  "status" "deposit_address_status" NOT NULL DEFAULT 'ACTIVE',
  "source" "deposit_address_source" NOT NULL DEFAULT 'GENERATED',
  "rotated_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_deposit_addresses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_deposit_addresses_wallet_status_idx" ON "user_deposit_addresses"("wallet_id", "status");
CREATE INDEX "user_deposit_addresses_address_idx" ON "user_deposit_addresses"("address");

ALTER TABLE "user_deposit_addresses"
  ADD CONSTRAINT "user_deposit_addresses_wallet_id_fkey"
  FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
