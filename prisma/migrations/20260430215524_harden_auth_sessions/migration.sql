-- AlterTable
ALTER TABLE "user_sessions" ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "refresh_token_hash" TEXT,
ADD COLUMN     "replaced_by_session_id" UUID,
ADD COLUMN     "revoked_reason" TEXT;

-- CreateIndex
CREATE INDEX "user_sessions_user_id_revoked_at_idx" ON "user_sessions"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "user_sessions_replaced_by_session_id_idx" ON "user_sessions"("replaced_by_session_id");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_replaced_by_session_id_fkey" FOREIGN KEY ("replaced_by_session_id") REFERENCES "user_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
