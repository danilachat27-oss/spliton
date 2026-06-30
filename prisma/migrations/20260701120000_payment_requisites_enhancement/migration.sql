-- Payment requisites enhancement (additive, safe)

-- Network settings lifecycle
DO $$ BEGIN
  CREATE TYPE "deposit_network_settings_status" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'DISABLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Pool archived status
ALTER TYPE "deposit_address_pool_status" ADD VALUE IF NOT EXISTS 'ARCHIVED';

-- deposit_network_settings columns
ALTER TABLE "deposit_network_settings" ADD COLUMN IF NOT EXISTS "network_display_name" TEXT;
ALTER TABLE "deposit_network_settings" ADD COLUMN IF NOT EXISTS "max_deposit_amount" DECIMAL(20,8);
ALTER TABLE "deposit_network_settings" ADD COLUMN IF NOT EXISTS "pool_low_threshold" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "deposit_network_settings" ADD COLUMN IF NOT EXISTS "status" "deposit_network_settings_status" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "deposit_network_settings" ADD COLUMN IF NOT EXISTS "user_warning_es" TEXT;
ALTER TABLE "deposit_network_settings" ADD COLUMN IF NOT EXISTS "user_warning_pt" TEXT;
ALTER TABLE "deposit_network_settings" ADD COLUMN IF NOT EXISTS "maintenance_message_es" TEXT;
ALTER TABLE "deposit_network_settings" ADD COLUMN IF NOT EXISTS "maintenance_message_pt" TEXT;
ALTER TABLE "deposit_network_settings" ADD COLUMN IF NOT EXISTS "instructions_ru" TEXT;
ALTER TABLE "deposit_network_settings" ADD COLUMN IF NOT EXISTS "instructions_en" TEXT;
ALTER TABLE "deposit_network_settings" ADD COLUMN IF NOT EXISTS "instructions_es" TEXT;
ALTER TABLE "deposit_network_settings" ADD COLUMN IF NOT EXISTS "instructions_pt" TEXT;
ALTER TABLE "deposit_network_settings" ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP(3);
ALTER TABLE "deposit_network_settings" ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMP(3);
ALTER TABLE "deposit_network_settings" ADD COLUMN IF NOT EXISTS "published_by_user_id" UUID;
ALTER TABLE "deposit_network_settings" ADD COLUMN IF NOT EXISTS "archived_by_user_id" UUID;

UPDATE "deposit_network_settings"
SET "status" = 'ACTIVE'
WHERE "status" IS NULL;

UPDATE "deposit_network_settings"
SET "network_display_name" = COALESCE("network_display_name", "asset" || ' · ' || "network")
WHERE "network_display_name" IS NULL;

-- deposit_address_pool audit columns
ALTER TABLE "deposit_address_pool" ADD COLUMN IF NOT EXISTS "created_by_user_id" UUID;
ALTER TABLE "deposit_address_pool" ADD COLUMN IF NOT EXISTS "disabled_by_user_id" UUID;
ALTER TABLE "deposit_address_pool" ADD COLUMN IF NOT EXISTS "disable_reason" TEXT;
ALTER TABLE "deposit_address_pool" ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMP(3);
ALTER TABLE "deposit_address_pool" ADD COLUMN IF NOT EXISTS "archived_by_user_id" UUID;

-- Dedicated change history (supplements audit_logs)
CREATE TABLE IF NOT EXISTS "deposit_requisite_change_history" (
    "id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "actor_user_id" UUID,
    "actor_role" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposit_requisite_change_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "deposit_requisite_change_history_entity_idx"
ON "deposit_requisite_change_history"("entity_type", "entity_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "deposit_requisite_change_history_created_at_idx"
ON "deposit_requisite_change_history"("created_at" DESC);
