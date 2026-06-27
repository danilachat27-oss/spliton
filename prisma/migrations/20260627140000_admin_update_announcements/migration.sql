-- CreateEnum
CREATE TYPE "admin_update_type" AS ENUM ('FEATURE', 'LEGAL', 'BILLING', 'SECURITY', 'MAINTENANCE', 'UX', 'SYSTEM');

-- CreateEnum
CREATE TYPE "admin_update_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "admin_update_announcements" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "admin_update_type" NOT NULL,
    "status" "admin_update_status" NOT NULL DEFAULT 'DRAFT',
    "audience_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "published_at" TIMESTAMP(3),
    "created_by_admin_id" UUID,
    "updated_by_admin_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_update_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_update_reads" (
    "id" UUID NOT NULL,
    "announcement_id" UUID NOT NULL,
    "admin_user_id" UUID NOT NULL,
    "read_at" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),

    CONSTRAINT "admin_update_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_update_announcements_status_published_idx" ON "admin_update_announcements"("status", "published_at");

-- CreateIndex
CREATE INDEX "admin_update_reads_admin_dismissed_idx" ON "admin_update_reads"("admin_user_id", "dismissed_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_update_reads_announcement_admin_uidx" ON "admin_update_reads"("announcement_id", "admin_user_id");

-- AddForeignKey
ALTER TABLE "admin_update_announcements" ADD CONSTRAINT "admin_update_announcements_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_update_announcements" ADD CONSTRAINT "admin_update_announcements_updated_by_admin_id_fkey" FOREIGN KEY ("updated_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_update_reads" ADD CONSTRAINT "admin_update_reads_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "admin_update_announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_update_reads" ADD CONSTRAINT "admin_update_reads_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
