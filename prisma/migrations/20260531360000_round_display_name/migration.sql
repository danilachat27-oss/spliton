-- Additive: optional display name for primary raise rounds
ALTER TABLE "primary_raise_rounds" ADD COLUMN IF NOT EXISTS "name" TEXT;
