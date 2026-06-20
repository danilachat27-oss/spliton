-- Report job object-storage metadata (CSV body may remain in file_content for dev fallback)

ALTER TABLE "report_jobs"
  ADD COLUMN IF NOT EXISTS "file_url" TEXT,
  ADD COLUMN IF NOT EXISTS "file_size_bytes" INTEGER,
  ADD COLUMN IF NOT EXISTS "storage_key" TEXT;

CREATE INDEX IF NOT EXISTS "report_jobs_storage_key_idx"
  ON "report_jobs" ("storage_key")
  WHERE "storage_key" IS NOT NULL;
