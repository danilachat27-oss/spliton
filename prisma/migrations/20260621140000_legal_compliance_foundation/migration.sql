-- Legal, KYC, AML, country restrictions foundation

ALTER TYPE "kyc_status" ADD VALUE IF NOT EXISTS 'IN_REVIEW';
ALTER TYPE "kyc_status" ADD VALUE IF NOT EXISTS 'MANUAL_REVIEW_REQUIRED';

CREATE TYPE "kyc_level" AS ENUM ('NONE', 'BASIC', 'VERIFIED', 'ENHANCED');
CREATE TYPE "aml_risk_level" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'BLOCKED');
CREATE TYPE "legal_policy_type" AS ENUM (
  'TERMS_OF_SERVICE',
  'PRIVACY_POLICY',
  'RISK_DISCLOSURE',
  'MARKET_RULES',
  'FEE_POLICY',
  'AML_POLICY',
  'KYC_POLICY',
  'COOKIE_POLICY',
  'INVESTOR_AGREEMENT',
  'ROYALTY_RIGHTS_DISCLOSURE',
  'SECONDARY_MARKET_RULES',
  'WITHDRAWAL_POLICY'
);
CREATE TYPE "legal_policy_status" AS ENUM ('DRAFT', 'REVIEW', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "legal_policy_content_format" AS ENUM ('MARKDOWN', 'HTML', 'PLAIN');
CREATE TYPE "consent_source" AS ENUM (
  'REGISTER',
  'LOGIN',
  'PRIMARY_PURCHASE',
  'SECONDARY_TRADE',
  'WITHDRAWAL',
  'PROFILE'
);
CREATE TYPE "country_restriction_status" AS ENUM ('ALLOWED', 'RESTRICTED', 'BLOCKED');

ALTER TABLE "kyc_verifications"
  ADD COLUMN IF NOT EXISTS "kyc_level" "kyc_level" NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS "country_code" TEXT,
  ADD COLUMN IF NOT EXISTS "document_type" TEXT,
  ADD COLUMN IF NOT EXISTS "document_reference" TEXT,
  ADD COLUMN IF NOT EXISTS "provider" TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS "provider_applicant_id" TEXT,
  ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);

CREATE TABLE "legal_policies" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "type" "legal_policy_type" NOT NULL,
  "version" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "content_format" "legal_policy_content_format" NOT NULL DEFAULT 'MARKDOWN',
  "effective_at" TIMESTAMP(3),
  "published_at" TIMESTAMP(3),
  "status" "legal_policy_status" NOT NULL DEFAULT 'DRAFT',
  "requires_user_consent" BOOLEAN NOT NULL DEFAULT true,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "approved_by_user_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "legal_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "legal_policies_type_version_uidx" ON "legal_policies"("type", "version");
CREATE INDEX "legal_policies_type_status_idx" ON "legal_policies"("type", "status");

CREATE TABLE "user_legal_consents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "policy_id" UUID NOT NULL,
  "policy_type" "legal_policy_type" NOT NULL,
  "policy_version" TEXT NOT NULL,
  "source" "consent_source" NOT NULL,
  "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ip" TEXT,
  "user_agent" TEXT,
  "metadata" JSONB,
  CONSTRAINT "user_legal_consents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_legal_consents_user_type_version_uidx"
  ON "user_legal_consents"("user_id", "policy_type", "policy_version");
CREATE INDEX "user_legal_consents_user_policy_type_idx" ON "user_legal_consents"("user_id", "policy_type");

ALTER TABLE "user_legal_consents" ADD CONSTRAINT "user_legal_consents_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_legal_consents" ADD CONSTRAINT "user_legal_consents_policy_id_fkey"
  FOREIGN KEY ("policy_id") REFERENCES "legal_policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "user_aml_profiles" (
  "user_id" UUID NOT NULL,
  "risk_level" "aml_risk_level" NOT NULL DEFAULT 'LOW',
  "country_risk" TEXT,
  "transaction_risk" TEXT,
  "trading_risk" TEXT,
  "withdrawal_risk" TEXT,
  "active_flags_count" INTEGER NOT NULL DEFAULT 0,
  "restrictions" JSONB,
  "notes" TEXT,
  "last_review_at" TIMESTAMP(3),
  "reviewed_by_user_id" UUID,
  "next_review_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_aml_profiles_pkey" PRIMARY KEY ("user_id")
);

ALTER TABLE "user_aml_profiles" ADD CONSTRAINT "user_aml_profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "country_restrictions" (
  "country_code" TEXT NOT NULL,
  "status" "country_restriction_status" NOT NULL,
  "reason" TEXT,
  "applies_to" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "country_restrictions_pkey" PRIMARY KEY ("country_code")
);
