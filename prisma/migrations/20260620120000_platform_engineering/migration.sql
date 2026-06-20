-- Platform engineering: idempotency records + event outbox

CREATE TYPE "idempotency_record_status" AS ENUM ('COMPLETED');

CREATE TYPE "event_outbox_status" AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'DEAD_LETTER'
);

CREATE TABLE "idempotency_records" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "actor_type" TEXT NOT NULL,
  "actor_id" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "idempotency_key" TEXT NOT NULL,
  "request_hash" TEXT NOT NULL,
  "status_code" INTEGER,
  "response_body" JSONB,
  "status" "idempotency_record_status" NOT NULL DEFAULT 'COMPLETED',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "idempotency_records_actor_action_key_uidx"
  ON "idempotency_records"("actor_type", "actor_id", "action", "idempotency_key");

CREATE INDEX "idempotency_records_expires_at_idx" ON "idempotency_records"("expires_at");

CREATE TABLE "event_outbox" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "event_type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "event_outbox_status" NOT NULL DEFAULT 'PENDING',
  "idempotency_key" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 8,
  "next_retry_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_error" TEXT,
  "processed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "event_outbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_outbox_idempotency_key_uidx" ON "event_outbox"("idempotency_key");

CREATE INDEX "event_outbox_status_next_retry_idx" ON "event_outbox"("status", "next_retry_at");
