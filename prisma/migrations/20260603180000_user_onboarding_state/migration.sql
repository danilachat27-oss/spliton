CREATE TABLE IF NOT EXISTS "user_onboarding_state" (
    "user_id" UUID NOT NULL,
    "dismissed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "step_overrides" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_onboarding_state_pkey" PRIMARY KEY ("user_id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_onboarding_state_user_id_fkey'
  ) THEN
    ALTER TABLE "user_onboarding_state"
      ADD CONSTRAINT "user_onboarding_state_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
