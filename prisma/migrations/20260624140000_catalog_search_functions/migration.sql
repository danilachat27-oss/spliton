-- Catalog search: extensions, indexes, and PostgreSQL functions for Spliton /catalog

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- A. Full-text / trigram search indexes
CREATE INDEX IF NOT EXISTS releases_title_trgm_idx
  ON releases USING gin (lower(title) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS releases_symbol_trgm_idx
  ON releases USING gin (lower(symbol) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS releases_slug_trgm_idx
  ON releases USING gin (lower(slug) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS releases_genre_trgm_idx
  ON releases USING gin (lower(COALESCE(genre, '')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS releases_search_text_trgm_idx
  ON releases USING gin (
    lower(
      COALESCE(title, '') || ' ' ||
      COALESCE(symbol, '') || ' ' ||
      COALESCE(slug, '') || ' ' ||
      COALESCE(genre, '') || ' ' ||
      COALESCE(segment, '') || ' ' ||
      COALESCE(short_description, '')
    ) gin_trgm_ops
  );

CREATE INDEX IF NOT EXISTS artists_name_trgm_idx
  ON artists USING gin (lower(name) gin_trgm_ops);

-- B. Public catalog filtering indexes
CREATE INDEX IF NOT EXISTS releases_genre_idx
  ON releases (genre);

CREATE INDEX IF NOT EXISTS releases_segment_idx
  ON releases (segment);

CREATE INDEX IF NOT EXISTS releases_release_date_idx
  ON releases (release_date);

CREATE INDEX IF NOT EXISTS releases_secondary_enabled_idx
  ON releases (secondary_enabled);

CREATE INDEX IF NOT EXISTS releases_public_active_idx
  ON releases (created_at DESC)
  WHERE deleted_at IS NULL AND status IN ('ACTIVE', 'SOLD_OUT');

CREATE INDEX IF NOT EXISTS releases_public_genre_idx
  ON releases (genre)
  WHERE deleted_at IS NULL AND status IN ('ACTIVE', 'SOLD_OUT');

-- C. Numeric / sort indexes
CREATE INDEX IF NOT EXISTS releases_primary_unit_price_idx
  ON releases (primary_unit_price);

CREATE INDEX IF NOT EXISTS releases_units_available_primary_idx
  ON releases (units_available_primary DESC);

CREATE INDEX IF NOT EXISTS releases_total_units_idx
  ON releases (total_units);

CREATE INDEX IF NOT EXISTS release_metrics_daily_yield_idx
  ON release_metrics_daily (yield_pct DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS release_metrics_daily_liquidity_idx
  ON release_metrics_daily (liquidity_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS release_metrics_daily_volume24h_idx
  ON release_metrics_daily (volume_24h_notional DESC NULLS LAST);

-- D. Partial indexes for production catalog slices
CREATE INDEX IF NOT EXISTS releases_public_available_idx
  ON releases (units_available_primary DESC, created_at DESC)
  WHERE deleted_at IS NULL
    AND status = 'ACTIVE'
    AND units_available_primary > 0;

CREATE INDEX IF NOT EXISTS releases_public_secondary_enabled_idx
  ON releases (created_at DESC)
  WHERE deleted_at IS NULL
    AND status IN ('ACTIVE', 'SOLD_OUT')
    AND secondary_enabled = true;

-- E. Secondary market indexes
CREATE INDEX IF NOT EXISTS market_listings_active_price_idx
  ON market_listings (release_id, status, price_per_unit)
  WHERE deleted_at IS NULL AND status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS market_listings_status_created_at_idx
  ON market_listings (status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS trades_release_settled_executed_idx
  ON trades (release_id, executed_at DESC)
  WHERE settlement_status = 'SETTLED';

-- ---------------------------------------------------------------------------
-- Base enrichment view (non-materialized; small catalog cardinality)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW catalog_public_releases_v AS
WITH primary_round AS (
  SELECT DISTINCT ON (prr.release_id)
    prr.release_id,
    prr.id AS round_id,
    prr.status AS round_status,
    prr.total_units AS round_total_units,
    prr.sold_units AS round_sold_units,
    prr.raise_target_usdt AS round_raise_target_usdt,
    prr.hard_cap_usdt AS round_hard_cap_usdt
  FROM primary_raise_rounds prr
  ORDER BY
    prr.release_id,
    CASE prr.status
      WHEN 'LIVE' THEN 1
      WHEN 'PAUSED' THEN 2
      WHEN 'COMPLETED' THEN 3
      ELSE 4
    END,
    prr.created_at DESC
),
artist_info AS (
  SELECT
    ra.release_id,
    MIN(a.name) FILTER (WHERE ra.role = 'MAIN') AS main_artist,
    string_agg(DISTINCT a.name, ', ' ORDER BY a.name) AS artists
  FROM release_artists ra
  JOIN artists a ON a.id = ra.artist_id
  GROUP BY ra.release_id
),
latest_metrics AS (
  SELECT DISTINCT ON (rmd.release_id)
    rmd.release_id,
    rmd.yield_pct,
    rmd.liquidity_score,
    rmd.volume_24h_notional
  FROM release_metrics_daily rmd
  ORDER BY rmd.release_id, rmd.as_of_date DESC
),
secondary_agg AS (
  SELECT
    ml.release_id,
    COUNT(*)::int AS active_secondary_listings_count,
    MIN(ml.price_per_unit) AS best_secondary_ask_price
  FROM market_listings ml
  WHERE ml.deleted_at IS NULL
    AND ml.status = 'ACTIVE'
    AND ml.units_available > 0
  GROUP BY ml.release_id
),
trade_24h AS (
  SELECT
    t.release_id,
    COALESCE(SUM(t.gross_amount), 0) AS volume_24h_usdt
  FROM trades t
  WHERE t.settlement_status = 'SETTLED'
    AND t.executed_at >= NOW() - INTERVAL '24 hours'
  GROUP BY t.release_id
),
trade_7d AS (
  SELECT
    t.release_id,
    COALESCE(SUM(t.gross_amount), 0) AS volume_7d_usdt
  FROM trades t
  WHERE t.settlement_status = 'SETTLED'
    AND t.executed_at >= NOW() - INTERVAL '7 days'
  GROUP BY t.release_id
),
last_trade AS (
  SELECT DISTINCT ON (t.release_id)
    t.release_id,
    t.price AS last_trade_price,
    t.executed_at AS last_trade_at
  FROM trades t
  WHERE t.settlement_status = 'SETTLED'
  ORDER BY t.release_id, t.executed_at DESC
)
SELECT
  r.id,
  r.slug,
  r.symbol,
  r.title,
  COALESCE(ai.main_artist, NULLIF(BTRIM(r.copyright_owner), ''), r.symbol) AS artist,
  COALESCE(ai.artists, NULLIF(BTRIM(r.copyright_owner), ''), r.symbol) AS artists,
  COALESCE(NULLIF(BTRIM(r.genre), ''), 'Other') AS genre,
  COALESCE(r.segment, r.genre, 'Other') AS segment,
  ARRAY_REMOVE(ARRAY[COALESCE(r.genre, ''), COALESCE(r.segment, '')], '') AS tags,
  r.cover_url,
  COALESCE(
    NULLIF(BTRIM(r.short_description), ''),
    LEFT(REGEXP_REPLACE(COALESCE(r.description, ''), '\s+', ' ', 'g'), 160)
  ) AS short_description,
  r.release_date,
  r.status AS release_status,
  CASE
    WHEN r.status = 'SOLD_OUT' THEN 'sold_out'
    WHEN pr.round_status = 'LIVE' AND r.units_available_primary > 0 THEN 'open'
    WHEN pr.round_status = 'PAUSED' THEN 'coming_soon'
    WHEN pr.round_status = 'LIVE' AND r.units_available_primary <= 0 THEN 'sold_out'
    WHEN pr.round_status = 'COMPLETED' OR r.status = 'SOLD_OUT' THEN 'payouts'
    ELSE 'payouts'
  END AS catalog_status,
  CASE
    WHEN r.status = 'SOLD_OUT' THEN 'Закрыт'
    WHEN pr.round_status = 'LIVE' AND r.units_available_primary > 0 THEN 'Активен'
    WHEN pr.round_status = 'PAUSED' THEN 'Пауза'
    WHEN pr.round_status = 'LIVE' AND r.units_available_primary <= 0 THEN 'Sold out'
    ELSE 'Выплаты'
  END AS status_label,
  CASE
    WHEN r.status = 'SOLD_OUT' THEN 'sold_out'
    WHEN r.status <> 'ACTIVE' THEN 'unavailable'
    WHEN pr.round_status IS NULL THEN 'unavailable'
    WHEN pr.round_status = 'PAUSED' THEN 'paused'
    WHEN pr.round_status = 'LIVE' AND r.units_available_primary > 0 THEN 'available'
    WHEN pr.round_status = 'LIVE' AND r.units_available_primary <= 0 THEN 'sold_out'
    WHEN pr.round_status = 'COMPLETED' THEN 'sold_out'
    ELSE 'unavailable'
  END AS purchase_state,
  CASE
    WHEN pr.round_status = 'LIVE' THEN 'live'
    WHEN pr.round_status = 'PAUSED' THEN 'paused'
    WHEN pr.round_status = 'COMPLETED' THEN 'completed'
    WHEN pr.round_status = 'DRAFT' THEN 'draft'
    ELSE 'none'
  END AS round_status,
  CASE r.payout_frequency
    WHEN 'WEEKLY' THEN 'biweekly'
    ELSE 'monthly'
  END AS payout_freq,
  r.total_units,
  GREATEST(r.total_units - r.units_available_primary, 0) AS units_sold,
  r.units_available_primary AS available_units,
  r.primary_unit_price AS primary_unit_price_usdt,
  COALESCE(pr.round_raise_target_usdt, r.raise_target_usdt) AS raise_target_usdt,
  COALESCE(pr.round_hard_cap_usdt, r.hard_cap_usdt) AS hard_cap_usdt,
  GREATEST(r.total_units - r.units_available_primary, 0) * r.primary_unit_price AS raised_usdt,
  COALESCE(pr.round_raise_target_usdt, r.raise_target_usdt, r.hard_cap_usdt) AS goal_usdt,
  CASE
    WHEN r.total_units > 0 THEN LEAST(
      100,
      ROUND(
        (GREATEST(r.total_units - r.units_available_primary, 0) / r.total_units) * 100
      )
    )
    ELSE 0
  END AS progress_pct,
  lm.yield_pct AS expected_yield_pct,
  r.secondary_enabled AS secondary_market_enabled,
  COALESCE(sa.active_secondary_listings_count, 0) AS active_secondary_listings_count,
  sa.best_secondary_ask_price,
  lt.last_trade_price,
  lt.last_trade_at,
  COALESCE(t24.volume_24h_usdt, lm.volume_24h_notional, 0) AS volume_24h_usdt,
  COALESCE(t7.volume_7d_usdt, 0) AS volume_7d_usdt,
  lm.liquidity_score,
  NULL::date AS next_payout_date,
  r.created_at,
  r.updated_at,
  CASE
    WHEN COALESCE(sa.active_secondary_listings_count, 0) > 0
      AND (
        r.status = 'SOLD_OUT'
        OR (pr.round_status = 'LIVE' AND r.units_available_primary <= 0)
        OR pr.round_status = 'COMPLETED'
      ) THEN 'market'
    WHEN pr.round_status = 'LIVE' AND r.units_available_primary > 0 THEN 'funding'
    WHEN pr.round_status = 'PAUSED' THEN 'coming_soon'
    WHEN r.status = 'SOLD_OUT' OR pr.round_status = 'COMPLETED' THEN 'payouts'
    ELSE 'funding'
  END AS card_kind
FROM releases r
LEFT JOIN primary_round pr ON pr.release_id = r.id
LEFT JOIN artist_info ai ON ai.release_id = r.id
LEFT JOIN latest_metrics lm ON lm.release_id = r.id
LEFT JOIN secondary_agg sa ON sa.release_id = r.id
LEFT JOIN trade_24h t24 ON t24.release_id = r.id
LEFT JOIN trade_7d t7 ON t7.release_id = r.id
LEFT JOIN last_trade lt ON lt.release_id = r.id
WHERE r.deleted_at IS NULL
  AND r.status IN ('ACTIVE', 'SOLD_OUT');

-- ---------------------------------------------------------------------------
-- 1. catalog_search_releases
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION catalog_search_releases(
  p_search text DEFAULT NULL,
  p_kind text DEFAULT 'all',
  p_genres text[] DEFAULT NULL,
  p_round_statuses text[] DEFAULT NULL,
  p_catalog_statuses text[] DEFAULT NULL,
  p_price_min numeric DEFAULT NULL,
  p_price_max numeric DEFAULT NULL,
  p_min_yield numeric DEFAULT NULL,
  p_min_progress numeric DEFAULT NULL,
  p_min_liquidity numeric DEFAULT NULL,
  p_secondary_only boolean DEFAULT false,
  p_available_only boolean DEFAULT false,
  p_artist_id uuid DEFAULT NULL,
  p_sort text DEFAULT 'relevance',
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 24
)
RETURNS TABLE (
  id uuid,
  slug text,
  symbol text,
  title text,
  artist text,
  artists text,
  genre text,
  segment text,
  tags text[],
  cover_url text,
  short_description text,
  release_date date,
  release_status text,
  catalog_status text,
  status_label text,
  risk_label text,
  round_status text,
  purchase_state text,
  payout_freq text,
  total_units numeric,
  units_sold numeric,
  available_units numeric,
  primary_unit_price_usdt numeric,
  raise_target_usdt numeric,
  hard_cap_usdt numeric,
  raised_usdt numeric,
  goal_usdt numeric,
  progress_pct numeric,
  expected_yield_pct numeric,
  secondary_market_enabled boolean,
  active_secondary_listings_count integer,
  best_secondary_ask_price numeric,
  last_trade_price numeric,
  volume_24h_usdt numeric,
  volume_7d_usdt numeric,
  liquidity_score numeric,
  next_payout_date date,
  card_kind text,
  relevance_score numeric,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_search text := NULLIF(BTRIM(p_search), '');
  v_kind text := COALESCE(NULLIF(BTRIM(p_kind), ''), 'all');
  v_sort text := COALESCE(NULLIF(BTRIM(p_sort), ''), 'relevance');
  v_page integer := GREATEST(COALESCE(p_page, 1), 1);
  v_page_size integer := LEAST(GREATEST(COALESCE(p_page_size, 24), 1), 100);
  v_offset integer := (GREATEST(COALESCE(p_page, 1), 1) - 1) * LEAST(GREATEST(COALESCE(p_page_size, 24), 1), 100);
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT
      c.*,
      CASE
        WHEN v_search IS NULL THEN 0::numeric
        ELSE GREATEST(
          similarity(lower(c.title), lower(v_search)),
          similarity(lower(c.symbol), lower(v_search)),
          similarity(lower(c.slug), lower(v_search)),
          similarity(lower(COALESCE(c.genre, '')), lower(v_search)),
          similarity(lower(COALESCE(c.artist, '')), lower(v_search))
        )
      END AS relevance_score
    FROM catalog_public_releases_v c
    WHERE
      (v_search IS NULL OR (
        c.title ILIKE '%' || v_search || '%'
        OR c.symbol ILIKE '%' || v_search || '%'
        OR c.slug ILIKE '%' || v_search || '%'
        OR COALESCE(c.genre, '') ILIKE '%' || v_search || '%'
        OR COALESCE(c.artist, '') ILIKE '%' || v_search || '%'
        OR COALESCE(c.short_description, '') ILIKE '%' || v_search || '%'
        OR similarity(lower(c.title), lower(v_search)) > 0.15
        OR similarity(lower(c.symbol), lower(v_search)) > 0.2
      ))
      AND (p_genres IS NULL OR c.genre = ANY (p_genres))
      AND (p_round_statuses IS NULL OR c.round_status = ANY (p_round_statuses))
      AND (p_catalog_statuses IS NULL OR c.catalog_status = ANY (p_catalog_statuses))
      AND (NOT p_available_only OR c.purchase_state = 'available')
      AND (NOT p_secondary_only OR c.active_secondary_listings_count > 0)
      AND (p_artist_id IS NULL OR EXISTS (
        SELECT 1 FROM release_artists ra
        WHERE ra.release_id = c.id AND ra.artist_id = p_artist_id
      ))
      AND (p_min_yield IS NULL OR COALESCE(c.expected_yield_pct, 0) >= p_min_yield)
      AND (p_min_progress IS NULL OR COALESCE(c.progress_pct, 0) >= p_min_progress)
      AND (p_min_liquidity IS NULL OR COALESCE(c.liquidity_score, 0) >= p_min_liquidity)
      AND (
        v_kind = 'all'
        OR (v_kind IN ('primary', 'funding') AND c.purchase_state = 'available')
        OR (v_kind = 'secondary' AND c.active_secondary_listings_count > 0)
        OR (v_kind = 'payouts' AND c.catalog_status IN ('payouts', 'sold_out'))
        OR (v_kind = 'coming_soon' AND c.catalog_status = 'coming_soon')
      )
      AND (
        p_price_min IS NULL AND p_price_max IS NULL
        OR (
          v_kind IN ('secondary', 'market')
          AND (
            (p_price_min IS NULL OR COALESCE(c.best_secondary_ask_price, c.last_trade_price, 0) >= p_price_min)
            AND (p_price_max IS NULL OR COALESCE(c.best_secondary_ask_price, c.last_trade_price, 0) <= p_price_max)
          )
        )
        OR (
          v_kind NOT IN ('secondary', 'market')
          AND (
            (p_price_min IS NULL OR c.primary_unit_price_usdt >= p_price_min)
            AND (p_price_max IS NULL OR c.primary_unit_price_usdt <= p_price_max)
          )
        )
      )
  ),
  ranked AS (
    SELECT
      b.*,
      COUNT(*) OVER () AS total_count,
      CASE
        WHEN b.purchase_state = 'sold_out' THEN 'Раунд закрыт'
        WHEN b.purchase_state = 'paused' THEN 'Пауза'
        WHEN b.purchase_state = 'unavailable' THEN 'Недоступно'
        WHEN b.round_status <> 'live' THEN 'Нет активного раунда'
        WHEN COALESCE(b.liquidity_score, 0) < 0.35 THEN 'Низкая ликвидность'
        ELSE 'Стандартный'
      END AS risk_label
    FROM base b
  )
  SELECT
    r.id,
    r.slug,
    r.symbol,
    r.title,
    r.artist,
    r.artists,
    r.genre,
    r.segment,
    r.tags,
    r.cover_url,
    r.short_description,
    r.release_date,
    r.release_status::text,
    r.catalog_status,
    r.status_label,
    r.risk_label,
    r.round_status,
    r.purchase_state,
    r.payout_freq,
    r.total_units,
    r.units_sold,
    r.available_units,
    r.primary_unit_price_usdt,
    r.raise_target_usdt,
    r.hard_cap_usdt,
    r.raised_usdt,
    r.goal_usdt,
    r.progress_pct,
    r.expected_yield_pct,
    r.secondary_market_enabled,
    r.active_secondary_listings_count,
    r.best_secondary_ask_price,
    r.last_trade_price,
    r.volume_24h_usdt,
    r.volume_7d_usdt,
    r.liquidity_score,
    r.next_payout_date,
    CASE
      WHEN v_kind = 'secondary' THEN 'market'
      ELSE r.card_kind
    END AS card_kind,
    r.relevance_score,
    r.total_count
  FROM ranked r
  ORDER BY
    CASE WHEN v_sort = 'relevance' AND v_search IS NOT NULL THEN r.relevance_score END DESC NULLS LAST,
    CASE WHEN v_sort IN ('newest', 'catalog_order') THEN r.created_at END DESC NULLS LAST,
    CASE WHEN v_sort = 'title_asc' THEN lower(r.title) END ASC NULLS LAST,
    CASE WHEN v_sort IN ('progress_desc', 'popularity') THEN r.progress_pct END DESC NULLS LAST,
    CASE WHEN v_sort IN ('yield', 'yield_desc', 'expected_yield_desc') THEN r.expected_yield_pct END DESC NULLS LAST,
    CASE WHEN v_sort IN ('liquidity', 'liquidity_desc') THEN r.liquidity_score END DESC NULLS LAST,
    CASE WHEN v_sort IN ('volume24h', 'volume24h_desc') THEN r.volume_24h_usdt END DESC NULLS LAST,
    CASE WHEN v_sort IN ('volume7d', 'volume7d_desc') THEN r.volume_7d_usdt END DESC NULLS LAST,
    CASE WHEN v_sort = 'price_asc' THEN
      CASE WHEN v_kind IN ('secondary', 'market')
        THEN COALESCE(r.best_secondary_ask_price, r.last_trade_price, r.primary_unit_price_usdt)
        ELSE r.primary_unit_price_usdt
      END
    END ASC NULLS LAST,
    CASE WHEN v_sort = 'price_desc' THEN
      CASE WHEN v_kind IN ('secondary', 'market')
        THEN COALESCE(r.best_secondary_ask_price, r.last_trade_price, r.primary_unit_price_usdt)
        ELSE r.primary_unit_price_usdt
      END
    END DESC NULLS LAST,
    CASE WHEN v_sort = 'available_units' THEN r.available_units END DESC NULLS LAST,
    CASE WHEN v_sort = 'recently_traded' THEN r.last_trade_at END DESC NULLS LAST,
    CASE WHEN v_sort = 'closing_soon' THEN r.available_units END ASC NULLS LAST,
    r.created_at DESC
  LIMIT v_page_size
  OFFSET v_offset;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. catalog_get_filters
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION catalog_get_filters(
  p_kind text DEFAULT 'all'
)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  WITH base AS (
    SELECT * FROM catalog_public_releases_v c
    WHERE
      COALESCE(NULLIF(BTRIM(p_kind), ''), 'all') = 'all'
      OR (COALESCE(NULLIF(BTRIM(p_kind), ''), 'all') IN ('primary', 'funding') AND c.purchase_state = 'available')
      OR (COALESCE(NULLIF(BTRIM(p_kind), ''), 'all') = 'secondary' AND c.active_secondary_listings_count > 0)
      OR (COALESCE(NULLIF(BTRIM(p_kind), ''), 'all') = 'payouts' AND c.catalog_status IN ('payouts', 'sold_out'))
  )
  SELECT jsonb_build_object(
    'genres', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', g.genre, 'count', g.cnt) ORDER BY g.genre)
      FROM (
        SELECT genre, COUNT(*)::int AS cnt
        FROM base
        GROUP BY genre
      ) g
    ), '[]'::jsonb),
    'roundStatuses', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('key', rs.round_status, 'label', rs.label, 'count', rs.cnt) ORDER BY rs.cnt DESC)
      FROM (
        SELECT
          round_status,
          CASE round_status
            WHEN 'live' THEN 'Сбор'
            WHEN 'paused' THEN 'Пауза'
            WHEN 'completed' THEN 'Завершён'
            WHEN 'draft' THEN 'Черновик'
            ELSE 'Без раунда'
          END AS label,
          COUNT(*)::int AS cnt
        FROM base
        GROUP BY round_status
      ) rs
    ), '[]'::jsonb),
    'kinds', jsonb_build_array(
      jsonb_build_object('key', 'all', 'label', 'Все', 'count', (SELECT COUNT(*)::int FROM catalog_public_releases_v)),
      jsonb_build_object('key', 'primary', 'label', 'Раунды', 'count', (SELECT COUNT(*)::int FROM catalog_public_releases_v WHERE purchase_state = 'available')),
      jsonb_build_object('key', 'payouts', 'label', 'Выплаты', 'count', (SELECT COUNT(*)::int FROM catalog_public_releases_v WHERE catalog_status IN ('payouts', 'sold_out'))),
      jsonb_build_object('key', 'secondary', 'label', 'Вторичный рынок', 'count', (SELECT COUNT(*)::int FROM catalog_public_releases_v WHERE active_secondary_listings_count > 0))
    ),
    'catalogStatuses', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('key', cs.catalog_status, 'label', cs.label, 'count', cs.cnt) ORDER BY cs.cnt DESC)
      FROM (
        SELECT
          catalog_status,
          CASE catalog_status
            WHEN 'open' THEN 'Доступно'
            WHEN 'coming_soon' THEN 'Скоро'
            WHEN 'sold_out' THEN 'Sold out'
            WHEN 'payouts' THEN 'Выплаты'
            ELSE catalog_status
          END AS label,
          COUNT(*)::int AS cnt
        FROM base
        GROUP BY catalog_status
      ) cs
    ), '[]'::jsonb),
    'priceRange', jsonb_build_object(
      'min', COALESCE((
        SELECT MIN(
          CASE
            WHEN COALESCE(NULLIF(BTRIM(p_kind), ''), 'all') IN ('secondary', 'market')
              THEN COALESCE(best_secondary_ask_price, last_trade_price, primary_unit_price_usdt)
            ELSE primary_unit_price_usdt
          END
        ) FROM base
      ), 0),
      'max', COALESCE((
        SELECT MAX(
          CASE
            WHEN COALESCE(NULLIF(BTRIM(p_kind), ''), 'all') IN ('secondary', 'market')
              THEN COALESCE(best_secondary_ask_price, last_trade_price, primary_unit_price_usdt)
            ELSE primary_unit_price_usdt
          END
        ) FROM base
      ), 0)
    ),
    'yieldRange', jsonb_build_object(
      'min', COALESCE((SELECT MIN(expected_yield_pct) FROM base WHERE expected_yield_pct IS NOT NULL), 0),
      'max', COALESCE((SELECT MAX(expected_yield_pct) FROM base WHERE expected_yield_pct IS NOT NULL), 0)
    ),
    'progressRange', jsonb_build_object(
      'min', COALESCE((SELECT MIN(progress_pct) FROM base), 0),
      'max', COALESCE((SELECT MAX(progress_pct) FROM base), 100)
    ),
    'liquidityRange', jsonb_build_object(
      'min', COALESCE((SELECT MIN(liquidity_score) FROM base WHERE liquidity_score IS NOT NULL), 0),
      'max', COALESCE((SELECT MAX(liquidity_score) FROM base WHERE liquidity_score IS NOT NULL), 0)
    ),
    'updatedAt', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. catalog_search_suggestions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION catalog_search_suggestions(
  p_query text,
  p_limit integer DEFAULT 8
)
RETURNS TABLE (
  type text,
  label text,
  value text,
  subtitle text,
  release_id uuid,
  slug text,
  score numeric
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_query text := NULLIF(BTRIM(p_query), '');
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 8), 1), 20);
BEGIN
  IF v_query IS NULL OR length(v_query) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  (
    SELECT
      'release'::text,
      c.title,
      c.title,
      c.artist,
      c.id,
      c.slug,
      GREATEST(similarity(lower(c.title), lower(v_query)), 0.1)::numeric AS score
    FROM catalog_public_releases_v c
    WHERE c.title ILIKE '%' || v_query || '%'
       OR similarity(lower(c.title), lower(v_query)) > 0.2
    ORDER BY similarity(lower(c.title), lower(v_query)) DESC, c.title ASC
    LIMIT v_limit
  )
  UNION ALL
  (
    SELECT DISTINCT ON (c.artist)
      'artist'::text,
      c.artist,
      c.artist,
      c.genre,
      c.id,
      c.slug,
      similarity(lower(c.artist), lower(v_query))::numeric
    FROM catalog_public_releases_v c
    WHERE c.artist ILIKE '%' || v_query || '%'
       OR similarity(lower(c.artist), lower(v_query)) > 0.25
    ORDER BY c.artist, similarity(lower(c.artist), lower(v_query)) DESC
    LIMIT GREATEST(v_limit / 2, 2)
  )
  UNION ALL
  (
    SELECT DISTINCT ON (c.genre)
      'genre'::text,
      c.genre,
      c.genre,
      'Жанр',
      NULL::uuid,
      NULL::text,
      0.5::numeric
    FROM catalog_public_releases_v c
    WHERE c.genre ILIKE '%' || v_query || '%'
    ORDER BY c.genre
    LIMIT 3
  )
  UNION ALL
  (
    SELECT
      'symbol'::text,
      c.symbol,
      c.symbol,
      c.title,
      c.id,
      c.slug,
      GREATEST(similarity(lower(c.symbol), lower(v_query)), 0.2)::numeric
    FROM catalog_public_releases_v c
    WHERE c.symbol ILIKE '%' || v_query || '%'
       OR similarity(lower(c.symbol), lower(v_query)) > 0.3
    ORDER BY similarity(lower(c.symbol), lower(v_query)) DESC
    LIMIT 3
  )
  ORDER BY score DESC, label ASC
  LIMIT v_limit;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. catalog_get_stats
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION catalog_get_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'publicReleases', (SELECT COUNT(*)::int FROM catalog_public_releases_v),
    'livePrimaryRounds', (
      SELECT COUNT(*)::int FROM catalog_public_releases_v
      WHERE round_status = 'live' AND purchase_state = 'available'
    ),
    'activeSecondaryListings', (
      SELECT COALESCE(SUM(active_secondary_listings_count), 0)::int
      FROM catalog_public_releases_v
    ),
    'totalRaisedUsdt', COALESCE((SELECT SUM(raised_usdt) FROM catalog_public_releases_v), 0),
    'totalVolume24hUsdt', COALESCE((SELECT SUM(volume_24h_usdt) FROM catalog_public_releases_v), 0),
    'totalVolume7dUsdt', COALESCE((SELECT SUM(volume_7d_usdt) FROM catalog_public_releases_v), 0),
    'avgExpectedYieldPct', COALESCE((
      SELECT ROUND(AVG(expected_yield_pct)::numeric, 2)
      FROM catalog_public_releases_v
      WHERE expected_yield_pct IS NOT NULL
    ), 0),
    'updatedAt', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  );
$$;
