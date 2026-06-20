-- Add BUSINESS_ANALYST staff role enum value (separate transaction from seed).
ALTER TYPE "user_role_code" ADD VALUE IF NOT EXISTS 'BUSINESS_ANALYST';
