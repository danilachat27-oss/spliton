-- Legal policy content integrity hashes (additive, no data loss)

ALTER TABLE "legal_policies"
  ADD COLUMN IF NOT EXISTS "content_hash" TEXT;

ALTER TABLE "user_legal_consents"
  ADD COLUMN IF NOT EXISTS "accepted_content_hash" TEXT;