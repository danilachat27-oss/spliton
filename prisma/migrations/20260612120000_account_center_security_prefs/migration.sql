-- Safe additive migration: account center security preferences + password changed timestamp.

ALTER TABLE "user_profiles"
ADD COLUMN IF NOT EXISTS "password_changed_at" TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS "user_security_preferences" (
    "user_id" UUID NOT NULL,
    "withdrawal_email_confirmation_enabled" BOOLEAN NOT NULL DEFAULT false,
    "withdrawal_address_whitelist_enabled" BOOLEAN NOT NULL DEFAULT false,
    "suspicious_login_alerts_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_security_preferences_pkey" PRIMARY KEY ("user_id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_security_preferences_user_id_fkey'
  ) THEN
    ALTER TABLE "user_security_preferences"
    ADD CONSTRAINT "user_security_preferences_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
