-- Admin portal foundation: tracks metadata, rounds, support, compliance extensions

CREATE TYPE "primary_raise_round_status" AS ENUM ('DRAFT', 'LIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "support_ticket_status" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'ESCALATED', 'CLOSED');
CREATE TYPE "support_ticket_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "support_ticket_category" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'ACCOUNT', 'SECONDARY_MARKET', 'PAYOUTS', 'TECHNICAL', 'OTHER');
CREATE TYPE "compliance_risk_status" AS ENUM ('OPEN', 'REVIEWED', 'BLOCKED', 'ON_HOLD');

ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "cover_url" TEXT;
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "genre" TEXT;
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "platform_share_pct" DECIMAL(10,6);
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "artist_share_pct" DECIMAL(10,6);
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "holder_share_pct" DECIMAL(10,6);
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "raise_target_usdt" DECIMAL(20,8);
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "hard_cap_usdt" DECIMAL(20,8);
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "promo_budget_usdt" DECIMAL(20,8);
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "artist_upfront_usdt" DECIMAL(20,8);
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "platform_upfront_usdt" DECIMAL(20,8);

ALTER TABLE "risk_flags" ADD COLUMN IF NOT EXISTS "entity_type" TEXT;
ALTER TABLE "risk_flags" ADD COLUMN IF NOT EXISTS "entity_id" UUID;
ALTER TABLE "risk_flags" ADD COLUMN IF NOT EXISTS "status" "compliance_risk_status" NOT NULL DEFAULT 'OPEN';
ALTER TABLE "risk_flags" ADD COLUMN IF NOT EXISTS "risk_score" INTEGER;
ALTER TABLE "risk_flags" ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP(3);
ALTER TABLE "risk_flags" ADD COLUMN IF NOT EXISTS "reviewed_by_user_id" UUID;

CREATE TABLE IF NOT EXISTS "primary_raise_rounds" (
    "id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "status" "primary_raise_round_status" NOT NULL DEFAULT 'DRAFT',
    "raise_target_usdt" DECIMAL(20,8) NOT NULL,
    "hard_cap_usdt" DECIMAL(20,8) NOT NULL,
    "raised_amount_usdt" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "total_units" DECIMAL(20,8) NOT NULL,
    "sold_units" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "primary_raise_rounds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "support_tickets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "category" "support_ticket_category" NOT NULL,
    "priority" "support_ticket_priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "support_ticket_status" NOT NULL DEFAULT 'OPEN',
    "assigned_to_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "support_ticket_notes" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "compliance_freezes" (
    "id" UUID NOT NULL,
    "operation_type" TEXT NOT NULL,
    "operation_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "frozen_by_user_id" UUID NOT NULL,
    "released_by_user_id" UUID,
    "frozen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_freezes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "primary_raise_rounds_release_id_status_idx" ON "primary_raise_rounds"("release_id", "status");
CREATE INDEX IF NOT EXISTS "primary_raise_rounds_status_start_date_idx" ON "primary_raise_rounds"("status", "start_date");
CREATE INDEX IF NOT EXISTS "support_tickets_status_priority_created_at_idx" ON "support_tickets"("status", "priority", "created_at");
CREATE INDEX IF NOT EXISTS "support_tickets_user_id_created_at_idx" ON "support_tickets"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "support_tickets_assigned_to_user_id_status_idx" ON "support_tickets"("assigned_to_user_id", "status");
CREATE INDEX IF NOT EXISTS "support_ticket_notes_ticket_id_created_at_idx" ON "support_ticket_notes"("ticket_id", "created_at");
CREATE INDEX IF NOT EXISTS "compliance_freezes_operation_type_operation_id_is_active_idx" ON "compliance_freezes"("operation_type", "operation_id", "is_active");
CREATE INDEX IF NOT EXISTS "risk_flags_entity_type_entity_id_idx" ON "risk_flags"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "risk_flags_status_created_at_idx" ON "risk_flags"("status", "created_at");

ALTER TABLE "primary_raise_rounds" ADD CONSTRAINT "primary_raise_rounds_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_ticket_notes" ADD CONSTRAINT "support_ticket_notes_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_ticket_notes" ADD CONSTRAINT "support_ticket_notes_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "risk_flags" ADD CONSTRAINT "risk_flags_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "compliance_freezes" ADD CONSTRAINT "compliance_freezes_frozen_by_user_id_fkey" FOREIGN KEY ("frozen_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "compliance_freezes" ADD CONSTRAINT "compliance_freezes_released_by_user_id_fkey" FOREIGN KEY ("released_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
