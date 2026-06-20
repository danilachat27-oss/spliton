-- Ledger double-entry foundation + reconciliation tables

CREATE TYPE "ledger_account" AS ENUM (
  'USER_AVAILABLE',
  'USER_LOCKED',
  'USER_PENDING',
  'PLATFORM_FEE',
  'PLATFORM_SETTLEMENT'
);

CREATE TYPE "ledger_posting_side" AS ENUM ('DEBIT', 'CREDIT');

CREATE TYPE "ledger_operation_type" AS ENUM (
  'DEPOSIT_SETTLE',
  'WITHDRAWAL_LOCK',
  'WITHDRAWAL_UNLOCK',
  'WITHDRAWAL_COMPLETE',
  'WITHDRAWAL_REJECT',
  'PRIMARY_PURCHASE',
  'SECONDARY_TRADE',
  'PAYOUT',
  'PLATFORM_FEE',
  'ADMIN_ADJUSTMENT',
  'REVERSAL',
  'OPENING_BALANCE'
);

CREATE TYPE "wallet_reconciliation_status" AS ENUM ('COMPLETED', 'FAILED');

ALTER TABLE "wallet_transactions"
  ADD COLUMN IF NOT EXISTS "operation_type" "ledger_operation_type",
  ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT,
  ADD COLUMN IF NOT EXISTS "actor_user_id" UUID,
  ADD COLUMN IF NOT EXISTS "actor_role" "actor_role",
  ADD COLUMN IF NOT EXISTS "reversal_of_tx_id" UUID,
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;

ALTER TABLE "wallet_transactions"
  ADD CONSTRAINT "wallet_transactions_reversal_of_tx_id_fkey"
  FOREIGN KEY ("reversal_of_tx_id") REFERENCES "wallet_transactions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "wallet_transactions_wallet_id_idempotency_key_key"
  ON "wallet_transactions" ("wallet_id", "idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "wallet_transactions_operation_type_created_at_idx"
  ON "wallet_transactions" ("operation_type", "created_at");

CREATE TABLE "ledger_postings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "wallet_id" UUID NOT NULL,
  "ledger_account" "ledger_account" NOT NULL,
  "side" "ledger_posting_side" NOT NULL,
  "amount" DECIMAL(20,8) NOT NULL,
  "currency" TEXT NOT NULL,
  "operation_type" "ledger_operation_type" NOT NULL,
  "source_entity_type" TEXT NOT NULL,
  "source_entity_id" UUID NOT NULL,
  "wallet_transaction_id" UUID,
  "actor_user_id" UUID,
  "actor_role" "actor_role" NOT NULL,
  "idempotency_key" TEXT,
  "reversal_of_posting_id" UUID,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ledger_postings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ledger_postings"
  ADD CONSTRAINT "ledger_postings_wallet_id_fkey"
  FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ledger_postings"
  ADD CONSTRAINT "ledger_postings_wallet_transaction_id_fkey"
  FOREIGN KEY ("wallet_transaction_id") REFERENCES "wallet_transactions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ledger_postings"
  ADD CONSTRAINT "ledger_postings_reversal_of_posting_id_fkey"
  FOREIGN KEY ("reversal_of_posting_id") REFERENCES "ledger_postings"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "ledger_postings_wallet_id_idempotency_key_key"
  ON "ledger_postings" ("wallet_id", "idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "ledger_postings_wallet_account_created_at_idx"
  ON "ledger_postings" ("wallet_id", "ledger_account", "created_at");

CREATE INDEX IF NOT EXISTS "ledger_postings_source_entity_idx"
  ON "ledger_postings" ("source_entity_type", "source_entity_id");

CREATE INDEX IF NOT EXISTS "ledger_postings_wallet_transaction_id_idx"
  ON "ledger_postings" ("wallet_transaction_id");

CREATE TABLE "wallet_reconciliation_runs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "dry_run" BOOLEAN NOT NULL,
  "status" "wallet_reconciliation_status" NOT NULL,
  "wallets_checked" INTEGER NOT NULL,
  "discrepancy_count" INTEGER NOT NULL,
  "report_summary" JSONB,
  "error_message" TEXT,
  "started_by_user_id" UUID,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "wallet_reconciliation_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "wallet_reconciliation_runs_started_at_idx"
  ON "wallet_reconciliation_runs" ("started_at" DESC);

CREATE TABLE "wallet_reconciliation_discrepancies" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "run_id" UUID NOT NULL,
  "wallet_id" UUID NOT NULL,
  "ledger_account" "ledger_account" NOT NULL,
  "expected_amount" DECIMAL(20,8) NOT NULL,
  "actual_amount" DECIMAL(20,8) NOT NULL,
  "delta_amount" DECIMAL(20,8) NOT NULL,
  "currency" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'ledger_postings',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_reconciliation_discrepancies_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "wallet_reconciliation_discrepancies"
  ADD CONSTRAINT "wallet_reconciliation_discrepancies_run_id_fkey"
  FOREIGN KEY ("run_id") REFERENCES "wallet_reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wallet_reconciliation_discrepancies"
  ADD CONSTRAINT "wallet_reconciliation_discrepancies_wallet_id_fkey"
  FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "wallet_reconciliation_discrepancies_run_id_idx"
  ON "wallet_reconciliation_discrepancies" ("run_id");

CREATE INDEX IF NOT EXISTS "wallet_reconciliation_discrepancies_wallet_id_idx"
  ON "wallet_reconciliation_discrepancies" ("wallet_id");

-- Opening balance postings so existing wallets reconcile (one-time migration baseline)
INSERT INTO "ledger_postings" (
  "wallet_id",
  "ledger_account",
  "side",
  "amount",
  "currency",
  "operation_type",
  "source_entity_type",
  "source_entity_id",
  "actor_role",
  "metadata"
)
SELECT
  w."id",
  'USER_AVAILABLE'::"ledger_account",
  'CREDIT'::"ledger_posting_side",
  b."available",
  w."asset_code",
  'OPENING_BALANCE'::"ledger_operation_type",
  'wallet_balance',
  w."id",
  'SYSTEM'::"actor_role",
  jsonb_build_object('migrated', true, 'field', 'available')
FROM "wallet_balances" b
JOIN "wallets" w ON w."id" = b."wallet_id"
WHERE b."available" > 0
  AND NOT EXISTS (
    SELECT 1 FROM "ledger_postings" lp
    WHERE lp."wallet_id" = w."id"
      AND lp."operation_type" = 'OPENING_BALANCE'
      AND lp."ledger_account" = 'USER_AVAILABLE'
  );

INSERT INTO "ledger_postings" (
  "wallet_id",
  "ledger_account",
  "side",
  "amount",
  "currency",
  "operation_type",
  "source_entity_type",
  "source_entity_id",
  "actor_role",
  "metadata"
)
SELECT
  w."id",
  'USER_LOCKED'::"ledger_account",
  'CREDIT'::"ledger_posting_side",
  b."locked",
  w."asset_code",
  'OPENING_BALANCE'::"ledger_operation_type",
  'wallet_balance',
  w."id",
  'SYSTEM'::"actor_role",
  jsonb_build_object('migrated', true, 'field', 'locked')
FROM "wallet_balances" b
JOIN "wallets" w ON w."id" = b."wallet_id"
WHERE b."locked" > 0
  AND NOT EXISTS (
    SELECT 1 FROM "ledger_postings" lp
    WHERE lp."wallet_id" = w."id"
      AND lp."operation_type" = 'OPENING_BALANCE'
      AND lp."ledger_account" = 'USER_LOCKED'
  );

INSERT INTO "ledger_postings" (
  "wallet_id",
  "ledger_account",
  "side",
  "amount",
  "currency",
  "operation_type",
  "source_entity_type",
  "source_entity_id",
  "actor_role",
  "metadata"
)
SELECT
  w."id",
  'USER_PENDING'::"ledger_account",
  'CREDIT'::"ledger_posting_side",
  b."pending",
  w."asset_code",
  'OPENING_BALANCE'::"ledger_operation_type",
  'wallet_balance',
  w."id",
  'SYSTEM'::"actor_role",
  jsonb_build_object('migrated', true, 'field', 'pending')
FROM "wallet_balances" b
JOIN "wallets" w ON w."id" = b."wallet_id"
WHERE b."pending" > 0
  AND NOT EXISTS (
    SELECT 1 FROM "ledger_postings" lp
    WHERE lp."wallet_id" = w."id"
      AND lp."operation_type" = 'OPENING_BALANCE'
      AND lp."ledger_account" = 'USER_PENDING'
  );
