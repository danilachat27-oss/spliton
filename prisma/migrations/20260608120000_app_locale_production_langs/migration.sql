-- Phase 0 i18n: production locales ru/en/es/pt; legacy ka → ru

UPDATE "user_profiles" SET "preferred_locale" = 'ru' WHERE "preferred_locale" = 'ka';
UPDATE "release_faq_items" SET "locale" = 'ru' WHERE "locale" = 'ka';
UPDATE "release_documents" SET "locale" = 'ru' WHERE "locale" = 'ka';

CREATE TYPE "app_locale_new" AS ENUM ('ru', 'en', 'es', 'pt');

ALTER TABLE "user_profiles"
  ALTER COLUMN "preferred_locale" DROP DEFAULT,
  ALTER COLUMN "preferred_locale" TYPE "app_locale_new"
    USING ("preferred_locale"::text::"app_locale_new");

ALTER TABLE "release_faq_items"
  ALTER COLUMN "locale" DROP DEFAULT,
  ALTER COLUMN "locale" TYPE "app_locale_new"
    USING ("locale"::text::"app_locale_new");

ALTER TABLE "release_documents"
  ALTER COLUMN "locale" DROP DEFAULT,
  ALTER COLUMN "locale" TYPE "app_locale_new"
    USING ("locale"::text::"app_locale_new");

DROP TYPE "app_locale";
ALTER TYPE "app_locale_new" RENAME TO "app_locale";

ALTER TABLE "user_profiles" ALTER COLUMN "preferred_locale" SET DEFAULT 'ru';
ALTER TABLE "release_faq_items" ALTER COLUMN "locale" SET DEFAULT 'ru';
ALTER TABLE "release_documents" ALTER COLUMN "locale" SET DEFAULT 'ru';
