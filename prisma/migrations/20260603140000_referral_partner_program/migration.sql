-- AlterEnum
ALTER TYPE "ledger_operation_type" ADD VALUE 'REFERRAL_REWARD';

-- CreateEnum
CREATE TYPE "referral_reward_status" AS ENUM ('PENDING', 'QUALIFIED', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED', 'HELD_FOR_REVIEW');
CREATE TYPE "referral_reward_event_type" AS ENUM ('USER_REGISTERED', 'EMAIL_VERIFIED', 'KYC_COMPLETED', 'FIRST_DEPOSIT', 'FIRST_PRIMARY_PURCHASE', 'SECONDARY_TRADE_FEE', 'PLATFORM_FEE');
CREATE TYPE "referral_reward_type" AS ENUM ('FIXED', 'PERCENT_FEE');
CREATE TYPE "partner_type" AS ENUM ('AFFILIATE', 'INFLUENCER', 'AGENCY', 'ARTIST_MANAGER', 'STRATEGIC_PARTNER');
CREATE TYPE "partner_status" AS ENUM ('APPLIED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "partner_tier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'CUSTOM');

-- CreateTable
CREATE TABLE "referral_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "referral_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "referral_attributions" (
    "id" UUID NOT NULL,
    "referred_user_id" UUID NOT NULL,
    "referrer_user_id" UUID NOT NULL,
    "referral_code" TEXT NOT NULL,
    "utm_source" TEXT,
    "utm_campaign" TEXT,
    "touch_policy" TEXT NOT NULL DEFAULT 'first_touch',
    "attributed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    CONSTRAINT "referral_attributions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "referral_rules" (
    "id" UUID NOT NULL,
    "event_type" "referral_reward_event_type" NOT NULL,
    "reward_type" "referral_reward_type" NOT NULL,
    "fixed_amount" DECIMAL(20,8),
    "percentage" DECIMAL(8,4),
    "currency" TEXT NOT NULL DEFAULT 'USDT',
    "partner_tier" "partner_tier",
    "max_reward" DECIMAL(20,8),
    "duration_days" INTEGER,
    "min_deposit" DECIMAL(20,8),
    "min_purchase" DECIMAL(20,8),
    "requires_kyc" BOOLEAN NOT NULL DEFAULT false,
    "requires_no_fraud" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3),
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "referral_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "referral_rewards" (
    "id" UUID NOT NULL,
    "referrer_user_id" UUID NOT NULL,
    "referred_user_id" UUID NOT NULL,
    "partner_profile_id" UUID,
    "event_type" "referral_reward_event_type" NOT NULL,
    "source_entity_type" TEXT,
    "source_entity_id" UUID,
    "amount" DECIMAL(20,8) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDT',
    "status" "referral_reward_status" NOT NULL DEFAULT 'PENDING',
    "rule_id" UUID,
    "qualified_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "partner_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "partner_type" "partner_type" NOT NULL,
    "status" "partner_status" NOT NULL DEFAULT 'APPLIED',
    "tier" "partner_tier" NOT NULL DEFAULT 'BRONZE',
    "commission_percent" DECIMAL(8,4),
    "custom_commission_note" TEXT,
    "payout_method" TEXT,
    "application_note" TEXT,
    "reviewed_by_user_id" UUID,
    "approved_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "partner_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "partner_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_profiles_user_id_key" ON "referral_profiles"("user_id");
CREATE UNIQUE INDEX "referral_profiles_code_key" ON "referral_profiles"("code");
CREATE INDEX "referral_profiles_code_idx" ON "referral_profiles"("code");

CREATE UNIQUE INDEX "referral_attributions_referred_user_id_key" ON "referral_attributions"("referred_user_id");
CREATE INDEX "referral_attributions_referrer_at_idx" ON "referral_attributions"("referrer_user_id", "attributed_at");

CREATE INDEX "referral_rules_event_active_idx" ON "referral_rules"("event_type", "active");

CREATE UNIQUE INDEX "referral_rewards_dedup_uidx" ON "referral_rewards"("referrer_user_id", "referred_user_id", "event_type", "source_entity_id");
CREATE INDEX "referral_rewards_referrer_status_idx" ON "referral_rewards"("referrer_user_id", "status", "created_at");
CREATE INDEX "referral_rewards_referred_idx" ON "referral_rewards"("referred_user_id");

CREATE UNIQUE INDEX "partner_profiles_user_id_key" ON "partner_profiles"("user_id");
CREATE UNIQUE INDEX "partner_profiles_partner_code_key" ON "partner_profiles"("partner_code");
CREATE INDEX "partner_profiles_status_tier_idx" ON "partner_profiles"("status", "tier");

-- AddForeignKey
ALTER TABLE "referral_profiles" ADD CONSTRAINT "referral_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_referrer_user_id_fkey" FOREIGN KEY ("referrer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referrer_user_id_fkey" FOREIGN KEY ("referrer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "referral_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_partner_profile_id_fkey" FOREIGN KEY ("partner_profile_id") REFERENCES "partner_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "partner_profiles" ADD CONSTRAINT "partner_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
