-- Step 2: schema changes + data migration (run after enum values are committed)

ALTER TABLE "risk_flags"
  ADD COLUMN IF NOT EXISTS "assigned_to_user_id" UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'risk_flags_assigned_to_user_id_fkey'
  ) THEN
    ALTER TABLE "risk_flags"
      ADD CONSTRAINT "risk_flags_assigned_to_user_id_fkey"
      FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "risk_flags_assigned_to_user_id_idx"
  ON "risk_flags" ("assigned_to_user_id");

CREATE INDEX IF NOT EXISTS "risk_flags_flag_code_entity_active_idx"
  ON "risk_flags" ("user_id", "flag_code", "entity_id", "is_active");

CREATE TABLE IF NOT EXISTS "compliance_notes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "risk_flag_id" UUID,
  "user_id" UUID,
  "author_user_id" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "compliance_notes_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'compliance_notes_risk_flag_id_fkey'
  ) THEN
    ALTER TABLE "compliance_notes"
      ADD CONSTRAINT "compliance_notes_risk_flag_id_fkey"
      FOREIGN KEY ("risk_flag_id") REFERENCES "risk_flags"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'compliance_notes_user_id_fkey'
  ) THEN
    ALTER TABLE "compliance_notes"
      ADD CONSTRAINT "compliance_notes_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'compliance_notes_author_user_id_fkey'
  ) THEN
    ALTER TABLE "compliance_notes"
      ADD CONSTRAINT "compliance_notes_author_user_id_fkey"
      FOREIGN KEY ("author_user_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "compliance_notes_risk_flag_id_created_at_idx"
  ON "compliance_notes" ("risk_flag_id", "created_at");

UPDATE "risk_flags" SET "status" = 'IN_REVIEW' WHERE "status" = 'ON_HOLD';
UPDATE "risk_flags" SET "status" = 'RESOLVED' WHERE "status" = 'REVIEWED' AND "is_active" = false AND ("note" IS NULL OR "note" NOT LIKE '%[false_positive]%');
UPDATE "risk_flags" SET "status" = 'DISMISSED' WHERE "status" = 'REVIEWED' AND "is_active" = false AND "note" LIKE '%[false_positive]%';
