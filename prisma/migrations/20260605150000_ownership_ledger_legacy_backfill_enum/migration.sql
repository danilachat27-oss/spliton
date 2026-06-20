-- Add LEGACY_POSITION_BACKFILL for idempotent ownership ledger backfill rows.
ALTER TYPE "ownership_event_type" ADD VALUE IF NOT EXISTS 'LEGACY_POSITION_BACKFILL';
