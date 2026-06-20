-- Release detail closeout: video metadata, FAQ items, public fields

DO $$ BEGIN
  CREATE TYPE "app_locale" AS ENUM ('ru', 'en', 'ka');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TYPE "release_video_type" AS ENUM ('NONE', 'MP4', 'HLS');
CREATE TYPE "release_video_status" AS ENUM ('NONE', 'PROCESSING', 'READY', 'FAILED');

ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "video_url" TEXT;
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "video_poster_url" TEXT;
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "video_type" "release_video_type" NOT NULL DEFAULT 'NONE';
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "video_status" "release_video_status" NOT NULL DEFAULT 'NONE';
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "short_description" TEXT;
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "risk_disclosure_text" TEXT;
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "legal_disclaimer" TEXT;
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "secondary_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "public_status" TEXT;

CREATE TABLE IF NOT EXISTS "release_faq_items" (
    "id" UUID NOT NULL,
    "release_id" UUID,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "locale" "app_locale" NOT NULL DEFAULT 'ru',
    "category" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "release_faq_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "release_faq_items_release_locale_published_idx"
    ON "release_faq_items"("release_id", "locale", "is_published");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'release_faq_items_release_id_fkey'
  ) THEN
    ALTER TABLE "release_faq_items"
      ADD CONSTRAINT "release_faq_items_release_id_fkey"
      FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
