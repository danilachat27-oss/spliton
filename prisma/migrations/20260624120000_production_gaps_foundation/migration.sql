-- CreateEnum
CREATE TYPE "dispute_type" AS ENUM ('DEPOSIT_NOT_CREDITED', 'WITHDRAWAL_NOT_RECEIVED', 'TRADE_DISPUTE', 'RECEIPT_DOCUMENT_ISSUE', 'ACCOUNT_SECURITY', 'KYC_REJECTED', 'PAYOUT_MISMATCH', 'REPORT_INCORRECT', 'OTHER');

-- CreateEnum
CREATE TYPE "dispute_status" AS ENUM ('OPEN', 'IN_REVIEW', 'WAITING_FOR_USER', 'WAITING_FOR_ADMIN', 'ESCALATED', 'RESOLVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "release_document_visibility" AS ENUM ('PUBLIC', 'AUTHENTICATED', 'HOLDERS_ONLY', 'ADMIN_ONLY');

-- CreateEnum
CREATE TYPE "release_document_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "release_approval_stage" AS ENUM ('DRAFT', 'CONTENT_REVIEW', 'LEGAL_REVIEW', 'FINANCE_REVIEW', 'COMPLIANCE_REVIEW', 'READY_TO_PUBLISH', 'PUBLISHED', 'PAUSED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "release_approval_decision" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "release_submission_status" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "operator_sla_task_type" AS ENUM ('WITHDRAWAL_REVIEW', 'KYC_REVIEW', 'SUPPORT_FIRST_RESPONSE', 'DISPUTE_RESPONSE', 'COMPLIANCE_FLAG_REVIEW', 'REPORT_GENERATION', 'DEPOSIT_STUCK_REVIEW', 'DOCUMENT_GENERATION_FAILURE', 'RELEASE_APPROVAL');

-- CreateEnum
CREATE TYPE "operator_sla_task_status" AS ENUM ('OPEN', 'IN_PROGRESS', 'DUE_SOON', 'OVERDUE', 'COMPLETED', 'CANCELLED');

-- AlterEnum GeneratedDocumentKind
ALTER TYPE "generated_document_kind" ADD VALUE IF NOT EXISTS 'ANNUAL_INCOME_STATEMENT';
ALTER TYPE "generated_document_kind" ADD VALUE IF NOT EXISTS 'MONTHLY_WALLET_STATEMENT';
ALTER TYPE "generated_document_kind" ADD VALUE IF NOT EXISTS 'TRADING_SUMMARY';
ALTER TYPE "generated_document_kind" ADD VALUE IF NOT EXISTS 'PAYOUTS_SUMMARY';
ALTER TYPE "generated_document_kind" ADD VALUE IF NOT EXISTS 'FEES_PAID_SUMMARY';
ALTER TYPE "generated_document_kind" ADD VALUE IF NOT EXISTS 'REALIZED_PNL_SUMMARY';
ALTER TYPE "generated_document_kind" ADD VALUE IF NOT EXISTS 'DEPOSITS_WITHDRAWALS_SUMMARY';
ALTER TYPE "generated_document_kind" ADD VALUE IF NOT EXISTS 'ARTIST_ISSUER_STATEMENT';

-- AlterTable release_documents
ALTER TABLE "release_documents" ADD COLUMN "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "release_documents" ADD COLUMN "storage_key" TEXT;
ALTER TABLE "release_documents" ADD COLUMN "file_name" TEXT;
ALTER TABLE "release_documents" ADD COLUMN "locale" "app_locale" NOT NULL DEFAULT 'ru';
ALTER TABLE "release_documents" ADD COLUMN "visibility" "release_document_visibility" NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE "release_documents" ADD COLUMN "status" "release_document_status" NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "release_documents" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "release_documents" ADD COLUMN "expires_at" TIMESTAMP(3);

CREATE INDEX "release_documents_release_visibility_status_idx" ON "release_documents"("release_id", "visibility", "status");

-- CreateTable artist_user_links
CREATE TABLE "artist_user_links" (
    "user_id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "artist_user_links_pkey" PRIMARY KEY ("user_id")
);

CREATE INDEX "artist_user_links_artist_id_idx" ON "artist_user_links"("artist_id");

ALTER TABLE "artist_user_links" ADD CONSTRAINT "artist_user_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artist_user_links" ADD CONSTRAINT "artist_user_links_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable disputes
CREATE TABLE "disputes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "dispute_type" NOT NULL,
    "status" "dispute_status" NOT NULL DEFAULT 'OPEN',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "related_entity_type" TEXT,
    "related_entity_id" UUID,
    "assigned_to_user_id" UUID,
    "escalation_target" TEXT,
    "resolution_reason" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_user_id" UUID,
    "due_at" TIMESTAMP(3),
    "breached_at" TIMESTAMP(3),
    "priority" "support_ticket_priority" NOT NULL DEFAULT 'MEDIUM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dispute_messages" (
    "id" UUID NOT NULL,
    "dispute_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "is_staff" BOOLEAN NOT NULL DEFAULT false,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dispute_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "disputes_status_priority_created_at_idx" ON "disputes"("status", "priority", "created_at");
CREATE INDEX "disputes_user_id_created_at_idx" ON "disputes"("user_id", "created_at");
CREATE INDEX "disputes_assigned_status_idx" ON "disputes"("assigned_to_user_id", "status");
CREATE INDEX "dispute_messages_dispute_id_created_at_idx" ON "dispute_messages"("dispute_id", "created_at");

ALTER TABLE "disputes" ADD CONSTRAINT "disputes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable release approval / submissions / SLA
CREATE TABLE "release_approval_steps" (
    "id" UUID NOT NULL,
    "release_id" UUID NOT NULL,
    "stage" "release_approval_stage" NOT NULL,
    "decision" "release_approval_decision" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "blocker_fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "decided_by_user_id" UUID,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "release_approval_steps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "release_approval_steps_release_stage_key" ON "release_approval_steps"("release_id", "stage");
CREATE INDEX "release_approval_steps_release_decision_idx" ON "release_approval_steps"("release_id", "decision");
ALTER TABLE "release_approval_steps" ADD CONSTRAINT "release_approval_steps_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "release_submissions" (
    "id" UUID NOT NULL,
    "artist_user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" "release_submission_status" NOT NULL DEFAULT 'DRAFT',
    "review_note" TEXT,
    "reviewed_by_user_id" UUID,
    "release_id" UUID,
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "release_submissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "release_submissions_status_submitted_at_idx" ON "release_submissions"("status", "submitted_at");
CREATE INDEX "release_submissions_artist_created_at_idx" ON "release_submissions"("artist_user_id", "created_at");
ALTER TABLE "release_submissions" ADD CONSTRAINT "release_submissions_artist_user_id_fkey" FOREIGN KEY ("artist_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "release_submissions" ADD CONSTRAINT "release_submissions_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "release_submissions" ADD CONSTRAINT "release_submissions_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "operator_sla_tasks" (
    "id" UUID NOT NULL,
    "task_type" "operator_sla_task_type" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "status" "operator_sla_task_status" NOT NULL DEFAULT 'OPEN',
    "priority" "support_ticket_priority" NOT NULL DEFAULT 'MEDIUM',
    "due_at" TIMESTAMP(3) NOT NULL,
    "breached_at" TIMESTAMP(3),
    "assigned_to_user_id" UUID,
    "escalation_level" INTEGER NOT NULL DEFAULT 0,
    "last_action_at" TIMESTAMP(3),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "href" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "operator_sla_tasks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "operator_sla_tasks_unique_entity_key" ON "operator_sla_tasks"("task_type", "entity_type", "entity_id");
CREATE INDEX "operator_sla_tasks_status_due_at_idx" ON "operator_sla_tasks"("status", "due_at");
CREATE INDEX "operator_sla_tasks_type_status_idx" ON "operator_sla_tasks"("task_type", "status");
CREATE INDEX "operator_sla_tasks_assignee_status_idx" ON "operator_sla_tasks"("assigned_to_user_id", "status");
ALTER TABLE "operator_sla_tasks" ADD CONSTRAINT "operator_sla_tasks_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
