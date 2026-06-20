-- prisma:disable-transaction

DO $$ BEGIN
  CREATE TYPE "report_format" AS ENUM ('CSV', 'XLSX', 'PDF', 'DOCX');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "generated_document_status" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "generated_document_kind" AS ENUM (
    'DEPOSIT_RECEIPT',
    'WITHDRAWAL_RECEIPT',
    'WALLET_STATEMENT',
    'PRIMARY_ORDER_RECEIPT',
    'TRADE_RECEIPT',
    'PAYOUT_RECEIPT',
    'PORTFOLIO_STATEMENT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "report_jobs" ADD COLUMN IF NOT EXISTS "format" "report_format" NOT NULL DEFAULT 'CSV';
ALTER TABLE "report_jobs" ADD COLUMN IF NOT EXISTS "mime_type" TEXT;
ALTER TABLE "report_jobs" ADD COLUMN IF NOT EXISTS "file_checksum" TEXT;
ALTER TABLE "report_jobs" ADD COLUMN IF NOT EXISTS "row_count" INTEGER;
ALTER TABLE "report_jobs" ADD COLUMN IF NOT EXISTS "filters_json" JSONB;

CREATE INDEX IF NOT EXISTS "report_jobs_type_created_at_idx" ON "report_jobs" ("type", "created_at");

CREATE TABLE IF NOT EXISTS "generated_documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "kind" "generated_document_kind" NOT NULL,
  "format" "report_format" NOT NULL,
  "status" "generated_document_status" NOT NULL DEFAULT 'QUEUED',
  "owner_user_id" UUID NOT NULL,
  "entity_type" TEXT,
  "entity_id" UUID,
  "file_content_base64" TEXT,
  "storage_key" TEXT,
  "mime_type" TEXT,
  "file_size_bytes" INTEGER,
  "file_checksum" TEXT,
  "row_count" INTEGER,
  "filters_json" JSONB,
  "download_count" INTEGER NOT NULL DEFAULT 0,
  "last_downloaded_at" TIMESTAMP(3),
  "error_message" TEXT,
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "generated_documents"
    ADD CONSTRAINT "generated_documents_owner_user_id_fkey"
    FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "generated_documents_owner_created_at_idx"
  ON "generated_documents" ("owner_user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "generated_documents_status_created_at_idx"
  ON "generated_documents" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "generated_documents_expires_at_idx"
  ON "generated_documents" ("expires_at");
CREATE INDEX IF NOT EXISTS "generated_documents_kind_created_at_idx"
  ON "generated_documents" ("kind", "created_at");
