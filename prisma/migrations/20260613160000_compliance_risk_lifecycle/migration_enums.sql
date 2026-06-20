-- Step 1: add enum values (must commit before use in UPDATE)
ALTER TYPE "compliance_risk_status" ADD VALUE IF NOT EXISTS 'IN_REVIEW';
ALTER TYPE "compliance_risk_status" ADD VALUE IF NOT EXISTS 'RESOLVED';
ALTER TYPE "compliance_risk_status" ADD VALUE IF NOT EXISTS 'DISMISSED';
