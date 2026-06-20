-- CreateEnum
CREATE TYPE "notification_audience_type" AS ENUM ('USER', 'ADMIN', 'ROLE');
CREATE TYPE "notification_severity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');
CREATE TYPE "notification_delivery_channel" AS ENUM ('IN_APP', 'EMAIL');
CREATE TYPE "notification_delivery_status" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "in_app_notifications" (
    "id" UUID NOT NULL,
    "recipient_user_id" UUID,
    "recipient_role_code" TEXT,
    "audience" "notification_audience_type" NOT NULL DEFAULT 'USER',
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" "notification_severity" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "action_url" TEXT,
    "related_entity_type" TEXT,
    "related_entity_id" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "read_at" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "in_app_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" UUID NOT NULL,
    "notification_id" UUID NOT NULL,
    "channel" "notification_delivery_channel" NOT NULL,
    "status" "notification_delivery_status" NOT NULL DEFAULT 'PENDING',
    "provider_message_id" TEXT,
    "error" TEXT,
    "sent_at" TIMESTAMP(3),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "user_id" UUID NOT NULL,
    "email_finance" BOOLEAN NOT NULL DEFAULT true,
    "email_security" BOOLEAN NOT NULL DEFAULT true,
    "email_market" BOOLEAN NOT NULL DEFAULT false,
    "email_support" BOOLEAN NOT NULL DEFAULT true,
    "email_news" BOOLEAN NOT NULL DEFAULT false,
    "in_app_finance" BOOLEAN NOT NULL DEFAULT true,
    "in_app_market" BOOLEAN NOT NULL DEFAULT true,
    "in_app_support" BOOLEAN NOT NULL DEFAULT true,
    "in_app_news" BOOLEAN NOT NULL DEFAULT true,
    "muted_categories" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "notification_event_dedup" (
    "idempotency_key" TEXT NOT NULL,
    "notification_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_event_dedup_pkey" PRIMARY KEY ("idempotency_key")
);

-- CreateIndex
CREATE UNIQUE INDEX "in_app_notifications_idempotency_key_key" ON "in_app_notifications"("idempotency_key");
CREATE INDEX "in_app_notifications_user_read_created_idx" ON "in_app_notifications"("recipient_user_id", "read_at", "created_at");
CREATE INDEX "in_app_notifications_audience_role_created_idx" ON "in_app_notifications"("audience", "recipient_role_code", "created_at");
CREATE INDEX "in_app_notifications_category_severity_created_idx" ON "in_app_notifications"("category", "severity", "created_at");
CREATE INDEX "notification_deliveries_notification_channel_idx" ON "notification_deliveries"("notification_id", "channel");
CREATE INDEX "notification_deliveries_status_created_idx" ON "notification_deliveries"("status", "created_at");
CREATE INDEX "notification_event_dedup_expires_at_idx" ON "notification_event_dedup"("expires_at");

-- AddForeignKey
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "in_app_notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
