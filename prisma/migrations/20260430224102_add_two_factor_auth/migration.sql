-- CreateEnum
CREATE TYPE "two_factor_method_type" AS ENUM ('TOTP');

-- CreateEnum
CREATE TYPE "two_factor_method_status" AS ENUM ('PENDING', 'ENABLED', 'DISABLED');

-- CreateEnum
CREATE TYPE "two_factor_challenge_status" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "two_factor_methods" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "method_type" "two_factor_method_type" NOT NULL,
    "status" "two_factor_method_status" NOT NULL,
    "secret_ciphertext" TEXT NOT NULL,
    "secret_iv" TEXT NOT NULL,
    "secret_tag" TEXT NOT NULL,
    "encryption_key_version" INTEGER NOT NULL DEFAULT 1,
    "confirmed_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "disabled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "two_factor_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factor_backup_codes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "two_factor_backup_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factor_challenges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "two_factor_challenge_status" NOT NULL DEFAULT 'PENDING',
    "attempts_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "two_factor_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "two_factor_methods_user_id_status_idx" ON "two_factor_methods"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_methods_user_id_method_type_key" ON "two_factor_methods"("user_id", "method_type");

-- CreateIndex
CREATE INDEX "two_factor_backup_codes_user_id_used_at_idx" ON "two_factor_backup_codes"("user_id", "used_at");

-- CreateIndex
CREATE INDEX "two_factor_challenges_user_id_status_expires_at_idx" ON "two_factor_challenges"("user_id", "status", "expires_at");

-- CreateIndex
CREATE INDEX "two_factor_challenges_expires_at_idx" ON "two_factor_challenges"("expires_at");

-- AddForeignKey
ALTER TABLE "two_factor_methods" ADD CONSTRAINT "two_factor_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "two_factor_backup_codes" ADD CONSTRAINT "two_factor_backup_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "two_factor_challenges" ADD CONSTRAINT "two_factor_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
