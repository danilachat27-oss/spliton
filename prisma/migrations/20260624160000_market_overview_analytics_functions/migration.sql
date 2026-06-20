-- Market overview & analytics releases: views, functions, indexes for Spliton

-- ---------------------------------------------------------------------------
-- Helper: period intervals
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION market_period_interval(p_period text)
RETURNS interval
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(trim(COALESCE(p_period, '7d')))
    WHEN '24h' THEN INTERVAL '24 hours'
    WHEN '7d' THEN INTERVAL '7 days'
    WHEN '30d' THEN INTERVAL '30 days'
    WHEN '90d' THEN INTERVAL '90 days'
    ELSE INTERVAL '7 days'
  END;
$$;

CREATE OR REPLACE FUNCTION analytics_period_interval(p_period text)
RETURNS interval
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(trim(COALESCE(p_period, '30d')))
    WHEN '7d' THEN INTERVAL '7 days'
    WHEN '30d' THEN INTERVAL '30 days'
    WHEN '90d' THEN INTERVAL '90 days'
    ELSE NULL::interval
  END;
$$;

-- ---------------------------------------------------------------------------
-- Additional indexes (IF NOT EXISTS)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS releases_updated_at_idx
  ON releases (updated_at DESC);

CREATE INDEX IF NOT EXISTS releases_created_at_idx
  ON releases (created_at DESC);

CREATE INDEX IF NOT EXISTS release_metrics_daily_as_of_date_idx
  ON release_metrics_daily (as_of_date DESC);

CREATE INDEX IF NOT EXISTS primary_raise_rounds_release_status_idx
  ON primary_raise_rounds (release_id, status);

CREATE INDEX IF NOT EXISTS trades_executed_at_idx
  ON trades (executed_at DESC);

CREATE INDEX IF NOT EXISTS trades_release_status_executed_idx
  ON trades (release_id, settlement_status, executed_at DESC);

CREATE INDEX IF NOT EXISTS payouts_release_created_at_idx
  ON payouts (release_id, created_at DESC);

CREATE INDEX IF NOT EXISTS earning_distributions_release_created_at_idx
  ON earning_distributions (release_id, created_at DESC);

CREATE INDEX IF NOT EXISTS earning_periods_period_range_idx
  ON earning_periods (period_start, period_end);

CREATE INDEX IF NOT EXISTS ownership_ledger_release_created_at_idx
  ON ownership_ledger (release_id, created_at DESC);

CREATE INDEX IF NOT EXISTS market_listings_release_status_price_idx
  ON market_listings (release_id, status, price_per_unit)
  WHERE deleted_at IS NULL AND status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS price_history_release_ts_idx
  ON price_history (release_id, ts DESC);

-- ---------------------------------------------------------------------------
-- View: market_overview_releases_v
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW market_overview_releases_v AS
WITH holders AS (
  SELECT release_id, COUNT(DISTINCT user_id)::int AS holders_count
  FROM user_positions
  WHERE units_total > 0
  GROUP BY release_id
),
deals_7d AS (
  SELECT release_id, COUNT(*)::int AS deals_7d
  FROM trades
  WHERE settlement_status = 'SETTLED'
    AND executed_at >= NOW() - INTERVAL '7 days'
  GROUP BY release_id
),
volume_30d AS (
  SELECT release_id, COALESCE(SUM(gross_amount), 0) AS volume_30d_usdt
  FROM trades
  WHERE settlement_status = 'SETTLED'
    AND executed_at >= NOW() - INTERVAL '30 days'
  GROUP BY release_id
),
latest_metrics AS (
  SELECT DISTINCT ON (release_id)
    release_id,
    yield_pct,
    payouts_total,
    activity_score,
    liquidity_score,
    volume_24h_notional
  FROM release_metrics_daily
  ORDER BY release_id, as_of_date DESC
)
SELECT
  c.id,
  c.slug,
  c.symbol,
  c.title,
  c.artist,
  c.artists,
  c.genre,
  c.segment,
  c.tags,
  c.cover_url,
  c.short_description,
  c.release_date,
  c.release_status,
  c.catalog_status,
  c.status_label,
  CASE
    WHEN r.status = 'SOLD_OUT' THEN 'sold_out'
    WHEN r.status <> 'ACTIVE' THEN 'unavailable'
    WHEN c.round_status = 'paused' THEN 'paused'
    WHEN COALESCE(lm.liquidity_score, 0) < 35 THEN 'thin'
    ELSE 'available'
  END AS risk_label,
  c.round_status,
  c.purchase_state,
  c.payout_freq,
  c.total_units,
  c.units_sold,
  c.available_units,
  c.primary_unit_price_usdt,
  c.raise_target_usdt,
  c.hard_cap_usdt,
  c.raised_usdt,
  c.goal_usdt,
  c.progress_pct,
  c.expected_yield_pct,
  c.secondary_market_enabled,
  c.active_secondary_listings_count,
  c.best_secondary_ask_price,
  c.last_trade_price,
  c.last_trade_at,
  c.volume_24h_usdt,
  c.volume_7d_usdt,
  COALESCE(v30.volume_30d_usdt, 0) AS volume_30d_usdt,
  COALESCE(lm.liquidity_score, 0) AS liquidity_score,
  COALESCE(lm.payouts_total, 0) AS payouts_total,
  COALESCE(lm.activity_score, 0) AS activity_score,
  COALESCE(h.holders_count, 0) AS holders_count,
  COALESCE(d7.deals_7d, 0) AS deals_7d,
  r.created_at,
  r.updated_at,
  r.status AS release_status_enum,
  CASE
    WHEN r.status = 'ACTIVE' THEN 'active'
    WHEN r.status = 'PAUSED' THEN 'paused'
    WHEN r.status = 'SOLD_OUT' THEN 'closed'
    ELSE 'new'
  END AS status_key,
  CASE
    WHEN COALESCE(lm.liquidity_score, 0) >= 70 THEN 'high'
    WHEN COALESCE(lm.liquidity_score, 0) >= 35 THEN 'med'
    ELSE 'low'
  END AS liquidity_tag,
  CASE
    WHEN COALESCE(lm.liquidity_score, 0) >= 70 THEN 'Высокая'
    WHEN COALESCE(lm.liquidity_score, 0) >= 35 THEN 'Средняя'
    ELSE 'Низкая'
  END AS liquidity_label_ru,
  c.card_kind
FROM catalog_public_releases_v c
JOIN releases r ON r.id = c.id
LEFT JOIN latest_metrics lm ON lm.release_id = c.id
LEFT JOIN holders h ON h.release_id = c.id
LEFT JOIN deals_7d d7 ON d7.release_id = c.id
LEFT JOIN volume_30d v30 ON v30.release_id = c.id;

-- ---------------------------------------------------------------------------
-- market_overview_stats(p_period)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION market_overview_stats(p_period text DEFAULT '7d')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_period text := lower(trim(COALESCE(p_period, '7d')));
  v_interval interval := market_period_interval(v_period);
  v_result jsonb;
BEGIN
  IF v_period NOT IN ('24h', '7d', '30d', '90d') THEN
    v_period := '7d';
    v_interval := market_period_interval('7d');
  END IF;

  SELECT jsonb_build_object(
    'updatedAt', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'period', v_period,
    'totals', jsonb_build_object(
      'publicReleases', (SELECT COUNT(*)::int FROM market_overview_releases_v),
      'activePrimaryRounds', (
        SELECT COUNT(*)::int FROM primary_raise_rounds prr
        JOIN releases r ON r.id = prr.release_id
        WHERE prr.status = 'LIVE' AND r.deleted_at IS NULL AND r.status = 'ACTIVE'
      ),
      'activeSecondaryListings', (
        SELECT COUNT(*)::int FROM market_listings ml
        WHERE ml.deleted_at IS NULL AND ml.status = 'ACTIVE' AND ml.units_available > 0
      ),
      'totalRaisedUsdt', COALESCE((SELECT SUM(raised_usdt)::text FROM market_overview_releases_v), '0'),
      'totalVolumeUsdt', COALESCE((
        SELECT SUM(gross_amount)::text FROM trades
        WHERE settlement_status = 'SETTLED' AND executed_at >= NOW() - v_interval
      ), '0'),
      'totalVolume24hUsdt', COALESCE((
        SELECT SUM(gross_amount)::text FROM trades
        WHERE settlement_status = 'SETTLED' AND executed_at >= NOW() - INTERVAL '24 hours'
      ), '0'),
      'totalVolume7dUsdt', COALESCE((
        SELECT SUM(gross_amount)::text FROM trades
        WHERE settlement_status = 'SETTLED' AND executed_at >= NOW() - INTERVAL '7 days'
      ), '0'),
      'totalVolume30dUsdt', COALESCE((
        SELECT SUM(gross_amount)::text FROM trades
        WHERE settlement_status = 'SETTLED' AND executed_at >= NOW() - INTERVAL '30 days'
      ), '0'),
      'averageExpectedYieldPct', (
        SELECT ROUND(AVG(expected_yield_pct)::numeric, 2)
        FROM market_overview_releases_v
        WHERE expected_yield_pct IS NOT NULL AND expected_yield_pct > 0
      ),
      'averageLiquidityScore', (
        SELECT ROUND(AVG(liquidity_score)::numeric, 2)
        FROM market_overview_releases_v
        WHERE liquidity_score > 0
      ),
      'tradesCount', (
        SELECT COUNT(*)::int FROM trades
        WHERE settlement_status = 'SETTLED' AND executed_at >= NOW() - v_interval
      ),
      'holdersCount', (
        SELECT COUNT(DISTINCT user_id)::int FROM user_positions WHERE units_total > 0
      )
    ),
    'primaryMarket', jsonb_build_object(
      'activeRounds', (
        SELECT COUNT(*)::int FROM primary_raise_rounds prr
        JOIN releases r ON r.id = prr.release_id
        WHERE prr.status = 'LIVE' AND r.deleted_at IS NULL AND r.status = 'ACTIVE'
      ),
      'raisedUsdt', COALESCE((SELECT SUM(raised_usdt)::text FROM market_overview_releases_v), '0'),
      'availableUnits', COALESCE((SELECT SUM(available_units)::text FROM market_overview_releases_v), '0'),
      'averageProgressPct', (
        SELECT ROUND(AVG(progress_pct)::numeric, 2) FROM market_overview_releases_v
      )
    ),
    'secondaryMarket', jsonb_build_object(
      'activeListings', (
        SELECT COUNT(*)::int FROM market_listings ml
        WHERE ml.deleted_at IS NULL AND ml.status = 'ACTIVE' AND ml.units_available > 0
      ),
      'volumeUsdt', COALESCE((
        SELECT SUM(gross_amount)::text FROM trades
        WHERE settlement_status = 'SETTLED' AND executed_at >= NOW() - v_interval
      ), '0'),
      'volume24hUsdt', COALESCE((
        SELECT SUM(gross_amount)::text FROM trades
        WHERE settlement_status = 'SETTLED' AND executed_at >= NOW() - INTERVAL '24 hours'
      ), '0'),
      'volume7dUsdt', COALESCE((
        SELECT SUM(gross_amount)::text FROM trades
        WHERE settlement_status = 'SETTLED' AND executed_at >= NOW() - INTERVAL '7 days'
      ), '0'),
      'volume30dUsdt', COALESCE((
        SELECT SUM(gross_amount)::text FROM trades
        WHERE settlement_status = 'SETTLED' AND executed_at >= NOW() - INTERVAL '30 days'
      ), '0'),
      'tradesCount', (
        SELECT COUNT(*)::int FROM trades
        WHERE settlement_status = 'SETTLED' AND executed_at >= NOW() - v_interval
      ),
      'bestAskMin', (
        SELECT MIN(price_per_unit)::text FROM market_listings ml
        WHERE ml.deleted_at IS NULL AND ml.status = 'ACTIVE' AND ml.units_available > 0
      ),
      'lastTradePriceAvg', (
        SELECT ROUND(AVG(price)::numeric, 4)::text FROM (
          SELECT DISTINCT ON (release_id) price
          FROM trades
          WHERE settlement_status = 'SETTLED'
          ORDER BY release_id, executed_at DESC
        ) lt
      ),
      'averageSpreadPct', NULL,
      'averageLiquidityScore', (
        SELECT ROUND(AVG(liquidity_score)::numeric, 2)
        FROM market_overview_releases_v
        WHERE liquidity_score > 0
      )
    ),
    'distributions', jsonb_build_object(
      'genres', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'name', g.genre,
          'count', g.cnt,
          'volumeUsdt', g.vol::text
        ) ORDER BY g.cnt DESC)
        FROM (
          SELECT genre, COUNT(*)::int AS cnt, COALESCE(SUM(volume_7d_usdt), 0) AS vol
          FROM market_overview_releases_v
          GROUP BY genre
        ) g
      ), '[]'::jsonb),
      'liquidity', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('label', l.label, 'count', l.cnt) ORDER BY l.cnt DESC)
        FROM (
          SELECT liquidity_label_ru AS label, COUNT(*)::int AS cnt
          FROM market_overview_releases_v
          GROUP BY liquidity_label_ru
        ) l
      ), '[]'::jsonb),
      'statuses', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('label', s.status_label, 'count', s.cnt) ORDER BY s.cnt DESC)
        FROM (
          SELECT status_label, COUNT(*)::int AS cnt
          FROM market_overview_releases_v
          GROUP BY status_label
        ) s
      ), '[]'::jsonb)
    ),
    'topReleases', jsonb_build_object(
      'byVolume', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', t.id, 'symbol', t.symbol, 'title', t.title, 'artist', t.artist,
          'value', t.volume_7d_usdt::text
        ) ORDER BY t.volume_7d_usdt DESC)
        FROM (SELECT id, symbol, title, artist, volume_7d_usdt FROM market_overview_releases_v ORDER BY volume_7d_usdt DESC LIMIT 5) t
      ), '[]'::jsonb),
      'byYield', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', t.id, 'symbol', t.symbol, 'title', t.title, 'artist', t.artist,
          'value', t.expected_yield_pct::text
        ) ORDER BY t.expected_yield_pct DESC NULLS LAST)
        FROM (SELECT id, symbol, title, artist, expected_yield_pct FROM market_overview_releases_v WHERE expected_yield_pct > 0 ORDER BY expected_yield_pct DESC LIMIT 5) t
      ), '[]'::jsonb),
      'byLiquidity', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', t.id, 'symbol', t.symbol, 'title', t.title, 'artist', t.artist,
          'value', t.liquidity_score::text
        ) ORDER BY t.liquidity_score DESC)
        FROM (SELECT id, symbol, title, artist, liquidity_score FROM market_overview_releases_v ORDER BY liquidity_score DESC LIMIT 5) t
      ), '[]'::jsonb),
      'byProgress', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', t.id, 'symbol', t.symbol, 'title', t.title, 'artist', t.artist,
          'value', t.progress_pct::text
        ) ORDER BY t.progress_pct DESC)
        FROM (SELECT id, symbol, title, artist, progress_pct FROM market_overview_releases_v ORDER BY progress_pct DESC LIMIT 5) t
      ), '[]'::jsonb)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ---------------------------------------------------------------------------
-- market_overview_charts(p_period)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION market_overview_charts(p_period text DEFAULT '30d')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_period text := lower(trim(COALESCE(p_period, '30d')));
  v_interval interval := market_period_interval(v_period);
  v_bucket text;
  v_result jsonb;
BEGIN
  IF v_period NOT IN ('24h', '7d', '30d', '90d') THEN
    v_period := '30d';
    v_interval := market_period_interval('30d');
  END IF;

  v_bucket := CASE WHEN v_period = '24h' THEN 'hour' ELSE 'day' END;

  SELECT jsonb_build_object(
    'period', v_period,
    'updatedAt', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'series', jsonb_build_object(
      'volume', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'ts', to_char(d.bucket_ts AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'value', d.vol::text
        ) ORDER BY d.bucket_ts)
        FROM (
          SELECT
            date_trunc(v_bucket, executed_at) AS bucket_ts,
            SUM(gross_amount) AS vol
          FROM trades
          WHERE settlement_status = 'SETTLED'
            AND executed_at >= NOW() - v_interval
          GROUP BY 1
        ) d
      ), '[]'::jsonb),
      'secondaryVolume', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'ts', to_char(d.bucket_ts AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'value', d.vol::text
        ) ORDER BY d.bucket_ts)
        FROM (
          SELECT
            date_trunc(v_bucket, t.executed_at) AS bucket_ts,
            SUM(t.gross_amount) AS vol
          FROM trades t
          JOIN releases r ON r.id = t.release_id
          WHERE t.settlement_status = 'SETTLED'
            AND t.executed_at >= NOW() - v_interval
            AND r.secondary_enabled = true
          GROUP BY 1
        ) d
      ), '[]'::jsonb),
      'tradesCount', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'ts', to_char(d.bucket_ts AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'value', d.cnt
        ) ORDER BY d.bucket_ts)
        FROM (
          SELECT date_trunc(v_bucket, executed_at) AS bucket_ts, COUNT(*)::int AS cnt
          FROM trades
          WHERE settlement_status = 'SETTLED' AND executed_at >= NOW() - v_interval
          GROUP BY 1
        ) d
      ), '[]'::jsonb),
      'activeListings', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'ts', to_char(d.bucket_ts AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'value', d.cnt
        ) ORDER BY d.bucket_ts)
        FROM (
          SELECT date_trunc(v_bucket, created_at) AS bucket_ts, COUNT(*)::int AS cnt
          FROM market_listings
          WHERE deleted_at IS NULL AND status = 'ACTIVE'
            AND created_at >= NOW() - v_interval
          GROUP BY 1
        ) d
      ), '[]'::jsonb),
      'raised', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'ts', to_char(d.bucket_ts AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'value', d.vol::text
        ) ORDER BY d.bucket_ts)
        FROM (
          SELECT date_trunc(v_bucket, o.created_at) AS bucket_ts, SUM(COALESCE(o.gross_amount, 0)) AS vol
          FROM orders o
          WHERE o.status IN ('PAID', 'SETTLED', 'FILLED')
            AND o.side = 'BUY'
            AND o.primary_raise_round_id IS NOT NULL
            AND o.created_at >= NOW() - v_interval
          GROUP BY 1
        ) d
      ), '[]'::jsonb),
      'avgYield', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'ts', to_char(d.as_of_date, 'YYYY-MM-DD'),
          'value', ROUND(d.avg_yield::numeric, 2)
        ) ORDER BY d.as_of_date)
        FROM (
          SELECT as_of_date, AVG(yield_pct) AS avg_yield
          FROM release_metrics_daily rmd
          JOIN releases r ON r.id = rmd.release_id
          WHERE r.deleted_at IS NULL AND r.status IN ('ACTIVE', 'SOLD_OUT', 'PAUSED')
            AND rmd.as_of_date >= (CURRENT_DATE - v_interval)
            AND rmd.yield_pct IS NOT NULL
          GROUP BY as_of_date
        ) d
      ), '[]'::jsonb),
      'liquidity', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'ts', to_char(d.as_of_date, 'YYYY-MM-DD'),
          'value', ROUND(d.avg_liq::numeric, 2)
        ) ORDER BY d.as_of_date)
        FROM (
          SELECT as_of_date, AVG(liquidity_score) AS avg_liq
          FROM release_metrics_daily rmd
          JOIN releases r ON r.id = rmd.release_id
          WHERE r.deleted_at IS NULL AND r.status IN ('ACTIVE', 'SOLD_OUT', 'PAUSED')
            AND rmd.as_of_date >= (CURRENT_DATE - v_interval)
            AND rmd.liquidity_score IS NOT NULL
          GROUP BY as_of_date
        ) d
      ), '[]'::jsonb)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ---------------------------------------------------------------------------
-- market_overview_search — paginated list with server-side filters
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION market_overview_search(
  p_period text DEFAULT '7d',
  p_search text DEFAULT NULL,
  p_category text DEFAULT 'all',
  p_genre text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_payout_freq text DEFAULT NULL,
  p_liquidity text DEFAULT NULL,
  p_yield text DEFAULT NULL,
  p_availability text DEFAULT NULL,
  p_sort text DEFAULT 'activity',
  p_sort_dir text DEFAULT 'desc',
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 24
)
RETURNS TABLE (
  id uuid,
  slug text,
  symbol text,
  title text,
  artist text,
  genre text,
  segment text,
  last_price_usdt numeric,
  volume_24h_usdt numeric,
  volume_7d_usdt numeric,
  volume_30d_usdt numeric,
  change_24h_pct numeric,
  change_7d_pct numeric,
  liquidity_tag text,
  liquidity_label_ru text,
  spread numeric,
  active_listings integer,
  yield_pct numeric,
  payouts_usdt numeric,
  activity_score numeric,
  available_units numeric,
  primary_unit_price_usdt numeric,
  secondary_label text,
  trend text,
  sparkline jsonb,
  status_label text,
  status_key text,
  payout_freq text,
  categories text[],
  risk_status text,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_page integer := GREATEST(COALESCE(p_page, 1), 1);
  v_page_size integer := LEAST(GREATEST(COALESCE(p_page_size, 24), 1), 100);
  v_offset integer := (v_page - 1) * v_page_size;
  v_search text := NULLIF(BTRIM(p_search), '');
  v_sort text := COALESCE(NULLIF(BTRIM(p_sort), ''), 'activity');
  v_dir integer := CASE WHEN lower(COALESCE(p_sort_dir, 'desc')) = 'asc' THEN 1 ELSE -1 END;
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT
      m.*,
      COALESCE(m.last_trade_price, m.primary_unit_price_usdt) AS last_price,
      CASE
        WHEN COALESCE(m.best_secondary_ask_price, 0) > 0 AND COALESCE(m.last_trade_price, 0) > 0
        THEN m.best_secondary_ask_price - m.last_trade_price
        ELSE 0
      END AS spread_val,
      CASE
        WHEN m.deals_7d >= 8 OR m.volume_24h_usdt >= 5000 THEN 'Высокий'
        WHEN m.deals_7d >= 2 OR m.volume_24h_usdt >= 500 THEN 'Средний'
        WHEN m.deals_7d > 0 OR m.volume_24h_usdt > 0 THEN 'Низкий'
        ELSE '—'
      END AS sec_label,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN m.created_at >= NOW() - INTERVAL '14 days' THEN 'new' END,
        CASE WHEN COALESCE(m.expected_yield_pct, 0) >= 12 THEN 'yield' END,
        CASE WHEN COALESCE(m.activity_score, 0) >= 50 AND m.deals_7d >= 2 THEN 'stable' END,
        CASE WHEN m.volume_7d_usdt >= 1000 OR m.deals_7d >= 5 THEN 'demand' END,
        CASE WHEN m.active_secondary_listings_count > 0 THEN 'secondary' END,
        CASE WHEN COALESCE(m.expected_yield_pct, 0) >= 15 AND m.liquidity_score >= 50 THEN 'premium' END,
        CASE WHEN m.release_status_enum IN ('SOLD_OUT', 'ARCHIVED') THEN 'archive' END
      ], NULL) AS cats,
      CASE
        WHEN m.release_status_enum = 'PAUSED' THEN 'paused'
        WHEN m.release_status_enum = 'SOLD_OUT' THEN 'closed'
        WHEN m.liquidity_tag = 'low' AND m.active_secondary_listings_count = 0 THEN 'thin'
        ELSE 'active'
      END AS risk_st,
      (
        SELECT COALESCE(jsonb_agg(ROUND(ph.close_price::numeric, 4) ORDER BY ph.ts), '[]'::jsonb)
        FROM (
          SELECT close_price, ts FROM price_history
          WHERE release_id = m.id AND bucket = 'D1'
            AND ts >= NOW() - INTERVAL '30 days'
          ORDER BY ts ASC
          LIMIT 30
        ) ph
      ) AS spark
    FROM market_overview_releases_v m
    WHERE (
      v_search IS NULL
      OR lower(m.title) LIKE '%' || lower(v_search) || '%'
      OR lower(m.symbol) LIKE '%' || lower(v_search) || '%'
      OR lower(m.artist) LIKE '%' || lower(v_search) || '%'
    )
    AND (p_genre IS NULL OR p_genre = 'all' OR lower(m.genre) LIKE '%' || lower(p_genre) || '%' OR lower(m.segment) LIKE '%' || lower(p_genre) || '%')
    AND (p_status IS NULL OR p_status = 'all' OR m.status_key = p_status)
    AND (p_payout_freq IS NULL OR p_payout_freq = 'all' OR m.payout_freq = p_payout_freq)
    AND (
      p_liquidity IS NULL OR p_liquidity = 'all'
      OR (p_liquidity = 'deep' AND m.liquidity_tag = 'high')
      OR (p_liquidity = 'mid' AND m.liquidity_tag = 'med')
      OR (p_liquidity = 'thin' AND m.liquidity_tag = 'low')
    )
    AND (
      p_yield IS NULL OR p_yield = 'all'
      OR (p_yield = 'high' AND COALESCE(m.expected_yield_pct, 0) >= 12)
      OR (p_yield = 'mid' AND COALESCE(m.expected_yield_pct, 0) >= 8 AND COALESCE(m.expected_yield_pct, 0) < 12)
      OR (p_yield = 'low' AND COALESCE(m.expected_yield_pct, 0) < 8)
    )
    AND (
      p_availability IS NULL OR p_availability = 'all'
      OR (p_availability = 'tight' AND m.available_units > 0 AND m.available_units < 100000)
      OR (p_availability = 'wide' AND m.available_units > 200000)
    )
    AND (
      p_category IS NULL OR p_category = 'all'
      OR p_category = ANY(ARRAY_REMOVE(ARRAY[
        CASE WHEN m.created_at >= NOW() - INTERVAL '14 days' THEN 'new' END,
        CASE WHEN COALESCE(m.expected_yield_pct, 0) >= 12 THEN 'yield' END,
        CASE WHEN COALESCE(m.activity_score, 0) >= 50 AND m.deals_7d >= 2 THEN 'stable' END,
        CASE WHEN m.volume_7d_usdt >= 1000 OR m.deals_7d >= 5 THEN 'demand' END,
        CASE WHEN m.active_secondary_listings_count > 0 THEN 'secondary' END,
        CASE WHEN COALESCE(m.expected_yield_pct, 0) >= 15 AND m.liquidity_score >= 50 THEN 'premium' END,
        CASE WHEN m.release_status_enum IN ('SOLD_OUT', 'ARCHIVED') THEN 'archive' END
      ], NULL))
    )
  ),
  counted AS (
    SELECT b.*, COUNT(*) OVER () AS tc FROM base b
  )
  SELECT
    c.id,
    c.slug,
    c.symbol,
    c.title,
    c.artist,
    c.genre,
    c.segment,
    c.last_price,
    c.volume_24h_usdt,
    c.volume_7d_usdt,
    c.volume_30d_usdt,
    0::numeric AS change_24h_pct,
    0::numeric AS change_7d_pct,
    c.liquidity_tag,
    c.liquidity_label_ru,
    c.spread_val,
    c.active_secondary_listings_count,
    COALESCE(c.expected_yield_pct, 0),
    COALESCE(c.payouts_total, 0),
    COALESCE(c.activity_score, 0),
    c.available_units,
    c.primary_unit_price_usdt,
    c.sec_label,
    'flat'::text,
    c.spark,
    c.status_label,
    c.status_key,
    c.payout_freq,
    c.cats,
    c.risk_st,
    c.tc
  FROM counted c
  ORDER BY
    CASE WHEN v_sort = 'yield' AND v_dir = -1 THEN COALESCE(c.expected_yield_pct, 0) END DESC NULLS LAST,
    CASE WHEN v_sort = 'yield' AND v_dir = 1 THEN COALESCE(c.expected_yield_pct, 0) END ASC NULLS LAST,
    CASE WHEN v_sort = 'payouts' AND v_dir = -1 THEN COALESCE(c.payouts_total, 0) END DESC NULLS LAST,
    CASE WHEN v_sort = 'payouts' AND v_dir = 1 THEN COALESCE(c.payouts_total, 0) END ASC NULLS LAST,
    CASE WHEN v_sort = 'units' AND v_dir = -1 THEN c.available_units END DESC NULLS LAST,
    CASE WHEN v_sort = 'units' AND v_dir = 1 THEN c.available_units END ASC NULLS LAST,
    CASE WHEN v_sort = 'activity' AND v_dir = -1 THEN COALESCE(c.activity_score, 0) END DESC NULLS LAST,
    CASE WHEN v_sort = 'activity' AND v_dir = 1 THEN COALESCE(c.activity_score, 0) END ASC NULLS LAST,
    c.symbol ASC
  LIMIT v_page_size
  OFFSET v_offset;
END;
$$;

-- ---------------------------------------------------------------------------
-- analytics_releases_overview(p_period)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION analytics_releases_overview(p_period text DEFAULT '30d')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_period text := lower(trim(COALESCE(p_period, '30d')));
  v_interval interval := analytics_period_interval(v_period);
  v_result jsonb;
BEGIN
  IF v_period NOT IN ('7d', '30d', '90d', 'all') THEN
    v_period := '30d';
    v_interval := analytics_period_interval('30d');
  END IF;

  SELECT jsonb_build_object(
    'period', v_period,
    'updatedAt', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'kpis', jsonb_build_object(
      'averageYieldPct', (
        SELECT ROUND(AVG(expected_yield_pct)::numeric, 2)
        FROM market_overview_releases_v
        WHERE expected_yield_pct IS NOT NULL AND expected_yield_pct > 0
      ),
      'activeReleases', (
        SELECT COUNT(*)::int FROM market_overview_releases_v
        WHERE release_status_enum = 'ACTIVE'
      ),
      'totalPayoutsUsdt', COALESCE((
        SELECT SUM(payouts_total)::text FROM market_overview_releases_v
      ), '0'),
      'payoutLagDaysMin', NULL,
      'payoutLagDaysMax', NULL,
      'totalUnits', COALESCE((SELECT SUM(total_units)::text FROM market_overview_releases_v), '0'),
      'totalHolders', (
        SELECT COUNT(DISTINCT user_id)::int FROM user_positions WHERE units_total > 0
      ),
      'secondaryVolumeUsdt', COALESCE((
        SELECT SUM(gross_amount)::text FROM trades t
        JOIN releases r ON r.id = t.release_id
        WHERE t.settlement_status = 'SETTLED'
          AND r.secondary_enabled = true
          AND (v_interval IS NULL OR t.executed_at >= NOW() - v_interval)
      ), '0')
    ),
    'yieldDynamics', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', to_char(d.as_of_date, 'YYYY-MM-DD'),
        'averageYieldPct', ROUND(d.avg_yield::numeric, 2),
        'topYieldPct', ROUND(d.max_yield::numeric, 2),
        'medianYieldPct', ROUND(d.med_yield::numeric, 2)
      ) ORDER BY d.as_of_date)
      FROM (
        SELECT
          rmd.as_of_date,
          AVG(rmd.yield_pct) AS avg_yield,
          MAX(rmd.yield_pct) AS max_yield,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rmd.yield_pct) AS med_yield
        FROM release_metrics_daily rmd
        JOIN releases r ON r.id = rmd.release_id
        WHERE r.deleted_at IS NULL AND r.status IN ('ACTIVE', 'SOLD_OUT', 'PAUSED')
          AND rmd.yield_pct IS NOT NULL
          AND (v_interval IS NULL OR rmd.as_of_date >= CURRENT_DATE - v_interval)
        GROUP BY rmd.as_of_date
      ) d
    ), '[]'::jsonb),
    'payoutDynamics', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', to_char(d.dt, 'YYYY-MM-DD'),
        'payoutsUsdt', d.total::text,
        'distributionsCount', d.cnt
      ) ORDER BY d.dt)
      FROM (
        SELECT DATE(created_at) AS dt, SUM(total_distributable) AS total, COUNT(*)::int AS cnt
        FROM earning_distributions ed
        JOIN releases r ON r.id = ed.release_id
        WHERE r.deleted_at IS NULL
          AND (v_interval IS NULL OR ed.created_at >= NOW() - v_interval)
        GROUP BY DATE(created_at)
      ) d
    ), '[]'::jsonb),
    'genreDistribution', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'genre', g.genre,
        'count', g.cnt,
        'averageYieldPct', ROUND(g.avg_yield::numeric, 2)
      ) ORDER BY g.cnt DESC)
      FROM (
        SELECT genre, COUNT(*)::int AS cnt, AVG(expected_yield_pct) AS avg_yield
        FROM market_overview_releases_v
        GROUP BY genre
      ) g
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ---------------------------------------------------------------------------
-- analytics_releases_search
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION analytics_releases_search(
  p_period text DEFAULT '30d',
  p_search text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_genre text DEFAULT NULL,
  p_preset text DEFAULT 'all',
  p_sort text DEFAULT 'yield_desc',
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 24,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  slug text,
  symbol text,
  title text,
  artist text,
  genre text,
  status text,
  status_label text,
  risk_label text,
  yield_pct numeric,
  change_pct numeric,
  payouts_usdt numeric,
  units numeric,
  payout_band_lo numeric,
  payout_band_hi numeric,
  sparkline jsonb,
  secondary_volume_usdt numeric,
  liquidity_score numeric,
  my_units numeric,
  my_pnl numeric,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_page integer := GREATEST(COALESCE(p_page, 1), 1);
  v_page_size integer := LEAST(GREATEST(COALESCE(p_page_size, 24), 1), 100);
  v_offset integer := (v_page - 1) * v_page_size;
  v_search text := NULLIF(BTRIM(p_search), '');
  v_sort text := COALESCE(NULLIF(BTRIM(p_sort), ''), 'yield_desc');
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT
      m.id,
      m.slug,
      m.symbol,
      m.title,
      m.artist,
      m.genre,
      m.status_key,
      m.status_label,
      m.risk_label,
      COALESCE(m.expected_yield_pct, 0) AS yld,
      0::numeric AS chg,
      COALESCE(m.payouts_total, 0) AS pay,
      m.total_units AS unt,
      COALESCE(m.payouts_total, 0) * 0.85 AS band_lo,
      COALESCE(m.payouts_total, 0) * 1.15 AS band_hi,
      (
        SELECT COALESCE(jsonb_agg(ROUND(ph.close_price::numeric, 4) ORDER BY ph.ts), '[]'::jsonb)
        FROM (
          SELECT close_price, ts FROM price_history
          WHERE release_id = m.id AND bucket = 'D1'
            AND ts >= NOW() - INTERVAL '30 days'
          ORDER BY ts ASC LIMIT 30
        ) ph
      ) AS spark,
      m.volume_7d_usdt AS sec_vol,
      COALESCE(m.liquidity_score, 0) AS liq,
      up.units_total AS my_u,
      CASE WHEN up.units_total IS NOT NULL AND up.avg_entry_price IS NOT NULL AND m.last_trade_price IS NOT NULL
        THEN (m.last_trade_price - up.avg_entry_price) * up.units_total
        ELSE NULL
      END AS my_pnl_val
    FROM market_overview_releases_v m
    LEFT JOIN user_positions up ON up.release_id = m.id AND up.user_id = p_user_id AND p_user_id IS NOT NULL
    WHERE (
      v_search IS NULL
      OR lower(m.title) LIKE '%' || lower(v_search) || '%'
      OR lower(m.symbol) LIKE '%' || lower(v_search) || '%'
      OR lower(m.artist) LIKE '%' || lower(v_search) || '%'
    )
    AND (
      p_status IS NULL OR p_status = 'all'
      OR (p_status = 'Active' AND m.status_key = 'active')
      OR (p_status = 'Paused' AND m.status_key = 'paused')
      OR (p_status = 'Closed' AND m.status_key = 'closed')
      OR m.status_key = lower(p_status)
    )
    AND (p_genre IS NULL OR p_genre = 'all' OR lower(m.genre) LIKE '%' || lower(p_genre) || '%')
    AND (
      p_preset IS NULL OR p_preset = 'all'
      OR (p_preset = 'top' AND COALESCE(m.expected_yield_pct, 0) >= 12)
      OR (p_preset = 'stable' AND COALESCE(m.activity_score, 0) >= 50)
      OR (p_preset = 'growth' AND m.volume_7d_usdt > 0)
    )
  ),
  counted AS (
    SELECT b.*, COUNT(*) OVER () AS tc FROM base b
  )
  SELECT
    c.id, c.slug, c.symbol, c.title, c.artist, c.genre,
    CASE c.status_key
      WHEN 'active' THEN 'Active'
      WHEN 'paused' THEN 'Paused'
      WHEN 'closed' THEN 'Closed'
      ELSE 'Active'
    END,
    c.status_label,
    c.risk_label,
    c.yld, c.chg, c.pay, c.unt, c.band_lo, c.band_hi, c.spark, c.sec_vol, c.liq,
    c.my_u, c.my_pnl_val, c.tc
  FROM counted c
  ORDER BY
    CASE WHEN v_sort = 'yield_desc' THEN c.yld END DESC NULLS LAST,
    CASE WHEN v_sort = 'yield_asc' THEN c.yld END ASC NULLS LAST,
    CASE WHEN v_sort = 'payouts_desc' THEN c.pay END DESC NULLS LAST,
    CASE WHEN v_sort = 'payouts_asc' THEN c.pay END ASC NULLS LAST,
    CASE WHEN v_sort = 'units_desc' THEN c.unt END DESC NULLS LAST,
    CASE WHEN v_sort = 'units_asc' THEN c.unt END ASC NULLS LAST,
    CASE WHEN v_sort = 'liquidity_desc' THEN c.liq END DESC NULLS LAST,
    c.symbol ASC
  LIMIT v_page_size
  OFFSET v_offset;
END;
$$;
