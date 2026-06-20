-- prisma:disable-transaction
-- Deposit ingestion + withdrawal hardening
-- Enum ADD VALUE commits separately; CREDITED must exist before UPDATE below.

DO $$ BEGIN
  CREATE TYPE "deposit_ingestion_source" AS ENUM ('AUTO', 'MANUAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "deposit_watcher_status" AS ENUM ('IDLE', 'RUNNING', 'ERROR', 'DISABLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "deposit_status" ADD VALUE IF NOT EXISTS 'DETECTED';
ALTER TYPE "deposit_status" ADD VALUE IF NOT EXISTS 'PENDING_CONFIRMATIONS';
ALTER TYPE "deposit_status" ADD VALUE IF NOT EXISTS 'CREDITED';
ALTER TYPE "deposit_status" ADD VALUE IF NOT EXISTS 'IGNORED';

ALTER TYPE "withdrawal_status" ADD VALUE IF NOT EXISTS 'LOCKED';
ALTER TYPE "withdrawal_status" ADD VALUE IF NOT EXISTS 'REVIEW';
ALTER TYPE "withdrawal_status" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "withdrawal_status" ADD VALUE IF NOT EXISTS 'REJECTED';

ALTER TABLE "deposits"
  ADD COLUMN IF NOT EXISTS "ingestion_source" "deposit_ingestion_source" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS "suspicious_flag" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "provider_block_number" BIGINT,
  ADD COLUMN IF NOT EXISTS "token_contract" TEXT,
  ADD COLUMN IF NOT EXISTS "ignore_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "credited_at" TIMESTAMP(3);

ALTER TABLE "withdrawals"
  ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT,
  ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "suspicious_flag" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "withdrawals_idempotency_key_key"
  ON "withdrawals" ("idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "deposits_status_created_at_idx"
  ON "deposits" ("status", "created_at");

CREATE INDEX IF NOT EXISTS "deposits_ingestion_source_created_at_idx"
  ON "deposits" ("ingestion_source", "created_at");

CREATE INDEX IF NOT EXISTS "withdrawals_status_requested_at_idx"
  ON "withdrawals" ("status", "requested_at");

CREATE TABLE IF NOT EXISTS "deposit_watcher_states" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "network" TEXT NOT NULL,
  "asset_code" TEXT NOT NULL,
  "last_scanned_block" BIGINT NOT NULL DEFAULT 0,
  "last_run_at" TIMESTAMP(3),
  "status" "deposit_watcher_status" NOT NULL DEFAULT 'IDLE',
  "last_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "deposit_watcher_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "deposit_watcher_state_network_asset_key"
  ON "deposit_watcher_states" ("network", "asset_code");

CREATE TABLE IF NOT EXISTS "deposit_ingestion_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "deposit_id" UUID,
  "blockchain_txid" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "payload" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "deposit_ingestion_logs_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "deposit_ingestion_logs"
    ADD CONSTRAINT "deposit_ingestion_logs_deposit_id_fkey"
    FOREIGN KEY ("deposit_id") REFERENCES "deposits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "deposit_ingestion_logs_blockchain_txid_idx"
  ON "deposit_ingestion_logs" ("blockchain_txid");

CREATE INDEX IF NOT EXISTS "deposit_ingestion_logs_deposit_id_created_at_idx"
  ON "deposit_ingestion_logs" ("deposit_id", "created_at");
