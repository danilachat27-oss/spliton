-- Step 1: add new enum values (must commit before use in step 2)

ALTER TYPE "report_job_status" ADD VALUE IF NOT EXISTS 'QUEUED';
ALTER TYPE "report_job_status" ADD VALUE IF NOT EXISTS 'RUNNING';
ALTER TYPE "report_job_status" ADD VALUE IF NOT EXISTS 'EXPIRED';
