import { writeFileSync } from 'node:fs';

const sql = `-- prisma:disable-transaction
-- Legacy partial index references removed enum labels and blocks enum rebuild.
DROP INDEX IF EXISTS "report_jobs_queue_status_created_at_idx";

-- Align report_job_status enum with schema.prisma (skip if already aligned).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'report_job_status'
      AND e.enumlabel IN ('PENDING', 'PROCESSING')
  ) THEN
    ALTER TABLE "public"."report_jobs" ALTER COLUMN "status" DROP DEFAULT;
    CREATE TYPE "report_job_status_new" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'EXPIRED');
    ALTER TABLE "report_jobs" ALTER COLUMN "status" TYPE "report_job_status_new" USING (
      CASE "status"::text
        WHEN 'PENDING' THEN 'QUEUED'
        WHEN 'PROCESSING' THEN 'RUNNING'
        ELSE "status"::text
      END::"report_job_status_new"
    );
    ALTER TYPE "report_job_status" RENAME TO "report_job_status_old";
    ALTER TYPE "report_job_status_new" RENAME TO "report_job_status";
    DROP TYPE "public"."report_job_status_old";
    ALTER TABLE "report_jobs" ALTER COLUMN "status" SET DEFAULT 'QUEUED';
  END IF;
END $$;

-- DropIndex
DROP INDEX IF EXISTS "artists_name_trgm_idx";
DROP INDEX IF EXISTS "audit_logs_action_created_at_idx";
DROP INDEX IF EXISTS "earning_distributions_earning_period_id_idx";
DROP INDEX IF EXISTS "earning_distributions_release_created_idx";
DROP INDEX IF EXISTS "fees_created_at_fee_code_idx";
DROP INDEX IF EXISTS "order_book_snapshots_release_captured_idx";
DROP INDEX IF EXISTS "ownership_ledger_user_release_happened_idx";
DROP INDEX IF EXISTS "releases_genre_idx";
DROP INDEX IF EXISTS "releases_release_date_idx";
DROP INDEX IF EXISTS "releases_symbol_trgm_idx";
DROP INDEX IF EXISTS "releases_title_trgm_idx";
DROP INDEX IF EXISTS "trades_settlement_status_executed_at_idx";
DROP INDEX IF EXISTS "user_positions_user_id_idx";
DROP INDEX IF EXISTS "users_email_trgm_idx";
DROP INDEX IF EXISTS "wallet_transactions_happened_at_tx_type_status_idx";
DROP INDEX IF EXISTS "wallet_transactions_wallet_id_happened_at_id_idx";

-- AlterTable
ALTER TABLE "compliance_notes" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "deposit_ingestion_logs" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "deposit_watcher_states" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "earning_periods" ALTER COLUMN "approved_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "event_outbox" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "generated_documents" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "idempotency_records" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "ledger_postings" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "legal_policies" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "report_jobs" ALTER COLUMN "locked_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "started_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "system_alerts" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "treasury_accounts" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "treasury_reconciliation_items" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "treasury_reconciliation_runs" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "user_deposit_addresses" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "user_legal_consents" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "wallet_reconciliation_discrepancies" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "wallet_reconciliation_runs" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "withdrawal_approvals" ALTER COLUMN "id" DROP DEFAULT;

-- CreateIndex (replace legacy partial uniques with schema-aligned indexes)
DROP INDEX IF EXISTS "earning_periods_run_idempotency_key_key";
CREATE UNIQUE INDEX "earning_periods_run_idempotency_key_key" ON "earning_periods"("run_idempotency_key");
DROP INDEX IF EXISTS "orders_user_id_idempotency_key_key";
CREATE UNIQUE INDEX "orders_user_id_idempotency_key_key" ON "orders"("user_id", "idempotency_key");
CREATE INDEX IF NOT EXISTS "releases_public_status_idx" ON "releases"("status");
CREATE INDEX IF NOT EXISTS "wallet_transactions_reference_type_reference_id_idx" ON "wallet_transactions"("reference_type", "reference_id");
DROP INDEX IF EXISTS "withdrawals_idempotency_key_key";
CREATE UNIQUE INDEX "withdrawals_idempotency_key_key" ON "withdrawals"("idempotency_key");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "legal_policies" ADD CONSTRAINT "legal_policies_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "legal_policies" ADD CONSTRAINT "legal_policies_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "legal_policies" ADD CONSTRAINT "legal_policies_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RenameIndex
ALTER INDEX IF EXISTS "news_posts_slug_idx" RENAME TO "news_posts_slug_key";
ALTER INDEX IF EXISTS "system_status_components_code_idx" RENAME TO "system_status_components_code_key";
`;

writeFileSync(
  'prisma/migrations/20260624130000_fix_align_schema_after_reset/migration.sql',
  sql,
  'utf8',
);
console.log('migration.sql written');
