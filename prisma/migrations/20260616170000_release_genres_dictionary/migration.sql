-- Production-safe release genre dictionary with soft backfill from existing releases.genre text.
-- Idempotent: no DROP/TRUNCATE; additive schema + data normalization.

CREATE TABLE IF NOT EXISTS "release_genres" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "release_genres_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "release_genres_slug_key" ON "release_genres"("slug");

ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "genre_id" UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'releases_genre_id_fkey'
  ) THEN
    ALTER TABLE "releases"
      ADD CONSTRAINT "releases_genre_id_fkey"
      FOREIGN KEY ("genre_id") REFERENCES "release_genres"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Base catalog (safe to re-run)
INSERT INTO "release_genres" ("name", "slug") VALUES
  ('Electronic', 'electronic'),
  ('Pop', 'pop'),
  ('Hip-Hop', 'hip-hop'),
  ('R&B', 'rnb'),
  ('Rock', 'rock'),
  ('Indie', 'indie'),
  ('House', 'house'),
  ('Techno', 'techno'),
  ('Ambient', 'ambient'),
  ('Classical', 'classical'),
  ('Jazz', 'jazz'),
  ('Latin', 'latin'),
  ('Metal', 'metal'),
  ('Folk', 'folk'),
  ('Country', 'country')
ON CONFLICT ("slug") DO NOTHING;

-- Backfill dictionary rows from distinct release.genre strings
INSERT INTO "release_genres" ("name", "slug")
SELECT DISTINCT ON (norm_key)
  trim(regexp_replace(regexp_replace(trim(g.genre), '_', '-', 'g'), '\s+', ' ', 'g')) AS name,
  CASE
    WHEN length(
      trim(both '-' from lower(regexp_replace(regexp_replace(trim(g.genre), '[^a-zA-Z0-9а-яА-ЯёЁ]+', '-', 'g'), '-+', '-', 'g')))
    ) > 0 THEN
      trim(both '-' from lower(regexp_replace(regexp_replace(trim(g.genre), '[^a-zA-Z0-9а-яА-ЯёЁ]+', '-', 'g'), '-+', '-', 'g')))
    ELSE
      'genre-' || substr(md5(trim(g.genre)), 1, 8)
  END AS slug
FROM (
  SELECT genre
  FROM "releases"
  WHERE genre IS NOT NULL
    AND trim(genre) <> ''
    AND trim(genre) <> '—'
) g
CROSS JOIN LATERAL (
  SELECT lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(trim(g.genre), '[_-]+', ' ', 'g'),
        '\s+', ' ', 'g'
      ),
      '[^a-z0-9а-яё]', '', 'gi'
    )
  ) AS norm_key
) n
WHERE n.norm_key <> ''
ORDER BY norm_key, length(trim(g.genre)) DESC
ON CONFLICT ("slug") DO NOTHING;

-- Link releases to dictionary + canonicalize genre text
UPDATE "releases" r
SET
  "genre_id" = rg."id",
  "genre" = rg."name",
  "updated_at" = CURRENT_TIMESTAMP
FROM "release_genres" rg
WHERE r."genre" IS NOT NULL
  AND trim(r."genre") <> ''
  AND trim(r."genre") <> '—'
  AND lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(trim(r."genre"), '[_-]+', ' ', 'g'),
        '\s+', ' ', 'g'
      ),
      '[^a-z0-9а-яё]', '', 'gi'
    )
  ) = lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(trim(rg."name"), '[_-]+', ' ', 'g'),
        '\s+', ' ', 'g'
      ),
      '[^a-z0-9а-яё]', '', 'gi'
    )
  )
  AND (r."genre_id" IS DISTINCT FROM rg."id" OR r."genre" IS DISTINCT FROM rg."name");
