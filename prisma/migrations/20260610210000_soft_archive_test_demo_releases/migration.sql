-- Soft-archive test, demo, and e2e catalog pollution on the shared Spliton project DB.
-- Idempotent: only touches rows where deleted_at IS NULL and slug matches known test patterns.
-- Does NOT hard-delete; rows remain for audit and can be restored by clearing deleted_at.

UPDATE releases
SET
  deleted_at = COALESCE(deleted_at, CURRENT_TIMESTAMP),
  updated_at = CURRENT_TIMESTAMP
WHERE deleted_at IS NULL
  AND (
    slug ~ '^(e2e|cat|mo|ua|pp|pf|sec|payout|iso|wa|rev|split|cutoff|orphan|chart-rel)-'
    OR slug LIKE 'spliton-demo-%'
    OR slug LIKE 'spliton-staging-%'
    OR COALESCE(short_description, '') ILIKE '%Демо-релиз%'
  );
