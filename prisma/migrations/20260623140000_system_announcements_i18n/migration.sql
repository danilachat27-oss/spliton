-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "app_locale" AS ENUM ('ru', 'en', 'ka');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
CREATE TYPE "system_announcement_type" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'MAINTENANCE', 'INCIDENT', 'FEATURE', 'RELEASE');

-- CreateEnum
CREATE TYPE "system_announcement_audience" AS ENUM ('ALL', 'USERS', 'ADMINS', 'ROLE', 'GUESTS');

-- CreateEnum
CREATE TYPE "system_announcement_status" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "system_announcement_severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN "preferred_locale" "app_locale" NOT NULL DEFAULT 'ru';

-- CreateTable
CREATE TABLE "system_announcements" (
    "id" UUID NOT NULL,
    "type" "system_announcement_type" NOT NULL DEFAULT 'INFO',
    "audience" "system_announcement_audience" NOT NULL DEFAULT 'ALL',
    "target_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "short_message" TEXT,
    "severity" "system_announcement_severity" NOT NULL DEFAULT 'MEDIUM',
    "status" "system_announcement_status" NOT NULL DEFAULT 'DRAFT',
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "action_label" TEXT,
    "action_url" TEXT,
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "sticky" BOOLEAN NOT NULL DEFAULT false,
    "show_on_public" BOOLEAN NOT NULL DEFAULT true,
    "show_in_app" BOOLEAN NOT NULL DEFAULT true,
    "show_in_admin" BOOLEAN NOT NULL DEFAULT false,
    "translations" JSONB NOT NULL DEFAULT '{}',
    "created_by_user_id" UUID NOT NULL,
    "updated_by_user_id" UUID,
    "published_by_user_id" UUID,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_announcement_dismissals" (
    "id" UUID NOT NULL,
    "announcement_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "dismissed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_announcement_dismissals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_announcements_status_dates_idx" ON "system_announcements"("status", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "system_announcements_audience_status_idx" ON "system_announcements"("audience", "status");

-- CreateIndex
CREATE INDEX "system_announcement_dismissals_user_dismissed_idx" ON "system_announcement_dismissals"("user_id", "dismissed_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_announcement_dismissals_announcement_user_key" ON "system_announcement_dismissals"("announcement_id", "user_id");

-- AddForeignKey
ALTER TABLE "system_announcements" ADD CONSTRAINT "system_announcements_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_announcements" ADD CONSTRAINT "system_announcements_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_announcements" ADD CONSTRAINT "system_announcements_published_by_user_id_fkey" FOREIGN KEY ("published_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_announcement_dismissals" ADD CONSTRAINT "system_announcement_dismissals_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "system_announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_announcement_dismissals" ADD CONSTRAINT "system_announcement_dismissals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
