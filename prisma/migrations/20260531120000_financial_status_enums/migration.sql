-- Additive enum values (PostgreSQL: separate migration from usage)
ALTER TYPE "withdrawal_status" ADD VALUE IF NOT EXISTS 'ON_HOLD';
ALTER TYPE "deposit_status" ADD VALUE IF NOT EXISTS 'CONFIRMING';
ALTER TYPE "deposit_status" ADD VALUE IF NOT EXISTS 'MANUAL_REVIEW';
