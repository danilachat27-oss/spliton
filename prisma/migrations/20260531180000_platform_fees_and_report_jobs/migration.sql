-- CreateEnum
CREATE TYPE "report_job_status" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "platform_fee_settings" (
    "id" UUID NOT NULL,
    "primary_purchase_fee_pct" DECIMAL(10,6) NOT NULL,
    "withdrawal_fee_fixed" DECIMAL(20,8) NOT NULL,
    "withdrawal_fee_pct" DECIMAL(10,6),
    "secondary_market_fee_pct" DECIMAL(10,6) NOT NULL,
    "premium_fee_monthly" DECIMAL(20,8),
    "effective_from" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" UUID,
    "updated_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_fee_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_jobs" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "status" "report_job_status" NOT NULL DEFAULT 'PENDING',
    "date_from" TIMESTAMP(3),
    "date_to" TIMESTAMP(3),
    "requested_by_id" UUID NOT NULL,
    "file_content" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "report_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_fee_settings_is_active_effective_from_idx" ON "platform_fee_settings"("is_active", "effective_from");

-- CreateIndex
CREATE INDEX "report_jobs_requested_by_id_created_at_idx" ON "report_jobs"("requested_by_id", "created_at");

-- CreateIndex
CREATE INDEX "report_jobs_status_created_at_idx" ON "report_jobs"("status", "created_at");

-- AddForeignKey
ALTER TABLE "platform_fee_settings" ADD CONSTRAINT "platform_fee_settings_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_fee_settings" ADD CONSTRAINT "platform_fee_settings_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_jobs" ADD CONSTRAINT "report_jobs_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed default active platform fee settings
INSERT INTO "platform_fee_settings" (
    "id",
    "primary_purchase_fee_pct",
    "withdrawal_fee_fixed",
    "withdrawal_fee_pct",
    "secondary_market_fee_pct",
    "premium_fee_monthly",
    "effective_from",
    "is_active",
    "created_at",
    "updated_at"
) VALUES (
    gen_random_uuid(),
    2.500000,
    5.00000000,
    NULL,
    1.000000,
    0.00000000,
    CURRENT_TIMESTAMP,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
