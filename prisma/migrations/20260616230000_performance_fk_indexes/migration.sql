-- Safe read-path indexes for admin/catalog filters on FK columns.
CREATE INDEX IF NOT EXISTS releases_genre_id_idx
  ON releases (genre_id)
  WHERE genre_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS releases_label_id_idx
  ON releases (label_id)
  WHERE label_id IS NOT NULL AND deleted_at IS NULL;
