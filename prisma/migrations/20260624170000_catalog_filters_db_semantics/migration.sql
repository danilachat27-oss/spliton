-- Catalog filters: normalized genres, UI-aligned kind/phase semantics, effective price filtering.
-- Mirrors backend normalizeGenre() and frontend catalog filter contract.

CREATE OR REPLACE FUNCTION catalog_normalize_genre(p_genre text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN lower(COALESCE(BTRIM(p_genre), '')) LIKE '%pop%' THEN 'pop'
    WHEN lower(COALESCE(BTRIM(p_genre), '')) LIKE '%hip%' THEN 'hiphop'
    WHEN lower(COALESCE(BTRIM(p_genre), '')) LIKE '%rock%' THEN 'rock'
    ELSE 'electronic'
  END;
$$;

CREATE OR REPLACE FUNCTION catalog_effective_price(
  p_card_kind text,
  p_primary_price numeric,
  p_best_ask numeric,
  p_last_trade numeric
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN p_card_kind = 'market'
      THEN COALESCE(p_best_ask, p_last_trade, 0)
    ELSE COALESCE(p_primary_price, 0)
  END;
$$;

CREATE OR REPLACE FUNCTION catalog_matches_kind_filter(
  p_kind text,
  p_card_kind text
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE COALESCE(NULLIF(BTRIM(p_kind), ''), 'all')
    WHEN 'all' THEN true
    WHEN 'secondary' THEN p_card_kind = 'market'
    WHEN 'payouts' THEN p_card_kind = 'payouts'
    WHEN 'coming_soon' THEN p_card_kind = 'coming_soon'
    WHEN 'primary' THEN p_card_kind = 'funding'
    WHEN 'funding' THEN p_card_kind IN ('funding', 'coming_soon', 'payouts')
    ELSE true
  END;
$$;

CREATE OR REPLACE FUNCTION catalog_matches_phase_filter(
  p_catalog_statuses text[],
  p_kind text,
  p_card_kind text,
  p_catalog_status text
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN p_catalog_statuses IS NULL THEN true
    WHEN COALESCE(NULLIF(BTRIM(p_kind), ''), 'all') = 'all' AND p_card_kind = 'market' THEN true
    WHEN 'open' = ANY(p_catalog_statuses) THEN p_catalog_status = 'open'
    WHEN 'payouts' = ANY(p_catalog_statuses) THEN p_catalog_status IN ('payouts', 'sold_out')
    WHEN 'coming_soon' = ANY(p_catalog_statuses) THEN p_catalog_status = 'coming_soon'
    WHEN 'sold_out' = ANY(p_catalog_statuses) THEN p_catalog_status = 'sold_out'
    ELSE p_catalog_status = ANY(p_catalog_statuses)
  END;
$$;

CREATE INDEX IF NOT EXISTS releases_catalog_normalized_genre_idx
  ON releases (catalog_normalize_genre(genre))
  WHERE deleted_at IS NULL AND status IN ('ACTIVE', 'SOLD_OUT');

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
        )::numeric
      END AS relevance_score,
      catalog_effective_price(
        c.card_kind,
        c.primary_unit_price_usdt,
        c.best_secondary_ask_price,
        c.last_trade_price
      ) AS effective_price
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
      AND (
        p_genres IS NULL
        OR EXISTS (
          SELECT 1
          FROM unnest(p_genres) AS req(raw_genre)
          WHERE catalog_normalize_genre(c.genre) = catalog_normalize_genre(req.raw_genre)
             OR lower(BTRIM(c.genre)) = lower(BTRIM(req.raw_genre))
        )
      )
      AND (p_round_statuses IS NULL OR c.round_status = ANY (p_round_statuses))
      AND catalog_matches_phase_filter(p_catalog_statuses, v_kind, c.card_kind, c.catalog_status)
      AND (NOT p_available_only OR c.purchase_state = 'available')
      AND (NOT p_secondary_only OR c.active_secondary_listings_count > 0)
      AND (p_artist_id IS NULL OR EXISTS (
        SELECT 1 FROM release_artists ra
        WHERE ra.release_id = c.id AND ra.artist_id = p_artist_id
      ))
      AND (p_min_yield IS NULL OR COALESCE(c.expected_yield_pct, 0) >= p_min_yield)
      AND (p_min_progress IS NULL OR COALESCE(c.progress_pct, 0) >= p_min_progress)
      AND (p_min_liquidity IS NULL OR COALESCE(c.liquidity_score, 0) >= p_min_liquidity)
      AND catalog_matches_kind_filter(v_kind, c.card_kind)
      AND (
        p_price_min IS NULL AND p_price_max IS NULL
        OR (
          (p_price_min IS NULL OR catalog_effective_price(
            c.card_kind,
            c.primary_unit_price_usdt,
            c.best_secondary_ask_price,
            c.last_trade_price
          ) >= p_price_min)
          AND (p_price_max IS NULL OR catalog_effective_price(
            c.card_kind,
            c.primary_unit_price_usdt,
            c.best_secondary_ask_price,
            c.last_trade_price
          ) <= p_price_max)
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
    r.relevance_score::numeric,
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
    CASE WHEN v_sort = 'price_asc' THEN r.effective_price END ASC NULLS LAST,
    CASE WHEN v_sort = 'price_desc' THEN r.effective_price END DESC NULLS LAST,
    CASE WHEN v_sort = 'available_units' THEN r.available_units END DESC NULLS LAST,
    CASE WHEN v_sort = 'recently_traded' THEN r.last_trade_at END DESC NULLS LAST,
    CASE WHEN v_sort = 'closing_soon' THEN r.available_units END ASC NULLS LAST,
    r.created_at DESC
  LIMIT v_page_size
  OFFSET v_offset;
END;
$$;

CREATE OR REPLACE FUNCTION catalog_get_filters(
  p_kind text DEFAULT 'all'
)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  WITH scoped AS (
    SELECT c.*
    FROM catalog_public_releases_v c
    WHERE catalog_matches_kind_filter(COALESCE(NULLIF(BTRIM(p_kind), ''), 'all'), c.card_kind)
  ),
  genre_counts AS (
    SELECT
      catalog_normalize_genre(genre) AS name,
      COUNT(*)::int AS cnt
    FROM scoped
    GROUP BY catalog_normalize_genre(genre)
  )
  SELECT jsonb_build_object(
    'genres', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', g.name, 'count', g.cnt) ORDER BY g.name)
      FROM genre_counts g
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
        FROM scoped
        GROUP BY round_status
      ) rs
    ), '[]'::jsonb),
    'kinds', jsonb_build_array(
      jsonb_build_object('key', 'all', 'label', 'Все', 'count', (SELECT COUNT(*)::int FROM catalog_public_releases_v)),
      jsonb_build_object(
        'key', 'funding',
        'label', 'Первичные раунды',
        'count', (SELECT COUNT(*)::int FROM catalog_public_releases_v WHERE card_kind IN ('funding', 'coming_soon', 'payouts'))
      ),
      jsonb_build_object(
        'key', 'market',
        'label', 'Вторичный рынок',
        'count', (SELECT COUNT(*)::int FROM catalog_public_releases_v WHERE card_kind = 'market')
      ),
      jsonb_build_object(
        'key', 'payouts',
        'label', 'Выплаты',
        'count', (SELECT COUNT(*)::int FROM catalog_public_releases_v WHERE card_kind = 'payouts')
      )
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
        FROM scoped
        GROUP BY catalog_status
      ) cs
    ), '[]'::jsonb),
    'priceRange', jsonb_build_object(
      'min', COALESCE((SELECT MIN(catalog_effective_price(
        card_kind,
        primary_unit_price_usdt,
        best_secondary_ask_price,
        last_trade_price
      )) FROM scoped), 0),
      'max', COALESCE((SELECT MAX(catalog_effective_price(
        card_kind,
        primary_unit_price_usdt,
        best_secondary_ask_price,
        last_trade_price
      )) FROM scoped), 0)
    ),
    'yieldRange', jsonb_build_object(
      'min', COALESCE((SELECT MIN(expected_yield_pct) FROM scoped WHERE expected_yield_pct IS NOT NULL), 0),
      'max', COALESCE((SELECT MAX(expected_yield_pct) FROM scoped WHERE expected_yield_pct IS NOT NULL), 0)
    ),
    'progressRange', jsonb_build_object(
      'min', COALESCE((SELECT MIN(progress_pct) FROM scoped), 0),
      'max', COALESCE((SELECT MAX(progress_pct) FROM scoped), 100)
    ),
    'liquidityRange', jsonb_build_object(
      'min', COALESCE((SELECT MIN(liquidity_score) FROM scoped WHERE liquidity_score IS NOT NULL), 0),
      'max', COALESCE((SELECT MAX(liquidity_score) FROM scoped WHERE liquidity_score IS NOT NULL), 0)
    ),
    'updatedAt', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  );
$$;

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
  SELECT * FROM (
    SELECT
      'release'::text AS type,
      c.title AS label,
      c.title AS value,
      c.artist AS subtitle,
      c.id AS release_id,
      c.slug,
      GREATEST(similarity(lower(c.title), lower(v_query)), 0.1)::numeric AS score
    FROM catalog_public_releases_v c
    WHERE c.title ILIKE '%' || v_query || '%'
       OR similarity(lower(c.title), lower(v_query)) > 0.2
    ORDER BY similarity(lower(c.title), lower(v_query)) DESC, c.title ASC
    LIMIT v_limit
  ) releases
  UNION ALL
  SELECT * FROM (
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
  ) artists
  UNION ALL
  SELECT * FROM (
    SELECT DISTINCT ON (catalog_normalize_genre(c.genre))
      'genre'::text,
      catalog_normalize_genre(c.genre),
      catalog_normalize_genre(c.genre),
      'Жанр'::text,
      NULL::uuid,
      NULL::text,
      0.5::numeric
    FROM catalog_public_releases_v c
    WHERE c.genre ILIKE '%' || v_query || '%'
       OR catalog_normalize_genre(c.genre) ILIKE '%' || lower(v_query) || '%'
    ORDER BY catalog_normalize_genre(c.genre)
    LIMIT 3
  ) genres
  UNION ALL
  SELECT * FROM (
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
  ) symbols
  ORDER BY score DESC, label ASC
  LIMIT v_limit;
END;
$$;
