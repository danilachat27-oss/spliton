-- Step 2: migrate rows + worker/retention columns

UPDATE "report_jobs" SET status = 'QUEUED'::"report_job_status" WHERE status = 'PENDING'::"report_job_status";
UPDATE "report_jobs" SET status = 'RUNNING'::"report_job_status" WHERE status = 'PROCESSING'::"report_job_status";

ALTER TABLE "report_jobs" ALTER COLUMN "status" SET DEFAULT 'QUEUED'::"report_job_status";

ALTER TABLE "report_jobs"
  ADD COLUMN IF NOT EXISTS "attempt_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "max_attempts" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS "locked_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "locked_by" TEXT,
  ADD COLUMN IF NOT EXISTS "started_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "report_jobs_locked_at_idx"
  ON "report_jobs" ("locked_at");

CREATE INDEX IF NOT EXISTS "report_jobs_expires_at_idx"
  ON "report_jobs" ("expires_at");
