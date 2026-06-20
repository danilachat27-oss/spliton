CREATE INDEX IF NOT EXISTS "releases_symbol_trgm_idx"
  ON "releases" USING gin ("symbol" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "releases_genre_idx"
  ON "releases" ("genre");

CREATE INDEX IF NOT EXISTS "releases_release_date_idx"
  ON "releases" ("release_date");

CREATE INDEX IF NOT EXISTS "artists_name_trgm_idx"
  ON "artists" USING gin ("name" gin_trgm_ops);
