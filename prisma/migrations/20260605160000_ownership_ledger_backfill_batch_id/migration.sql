-- Batch marker for LEGACY_POSITION_BACKFILL rollback (script-generated UUID).
ALTER TABLE "ownership_ledger" ADD COLUMN IF NOT EXISTS "backfill_batch_id" TEXT;

CREATE INDEX IF NOT EXISTS "ownership_ledger_backfill_batch_id_idx"
  ON "ownership_ledger"("backfill_batch_id")
  WHERE "backfill_batch_id" IS NOT NULL;
