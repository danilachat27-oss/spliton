-- Production analytics for /analytics/releases: extended overview, table fields, timeseries, compare, funnel.

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
      'totalReleases', (SELECT COUNT(*)::int FROM market_overview_releases_v),
      'averageYieldPct', (
        SELECT ROUND(AVG(expected_yield_pct)::numeric, 2)
        FROM market_overview_releases_v
        WHERE expected_yield_pct IS NOT NULL AND expected_yield_pct > 0
      ),
      'activeReleases', (
        SELECT COUNT(*)::int FROM market_overview_releases_v
        WHERE release_status_enum = 'ACTIVE'
      ),
      'payoutsReleases', (
        SELECT COUNT(*)::int FROM market_overview_releases_v
        WHERE COALESCE(payouts_total, 0) > 0
      ),
      'primaryVolumeUsdt', COALESCE((
        SELECT SUM(raised_usdt)::text FROM market_overview_releases_v
      ), '0'),
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
      ), '0'),
      'activeSecondaryListings', COALESCE((
        SELECT SUM(active_secondary_listings_count)::int FROM market_overview_releases_v
      ), 0),
      'avgProgressPct', (
        SELECT ROUND(AVG(progress_pct)::numeric, 2) FROM market_overview_releases_v
      ),
      'avgLiquidityScore', (
        SELECT ROUND(AVG(liquidity_score)::numeric, 2) FROM market_overview_releases_v
      ),
      'topReleaseByVolume', (
        SELECT jsonb_build_object(
          'id', id,
          'title', title,
          'symbol', symbol,
          'volumeUsdt', volume_7d_usdt::text
        )
        FROM market_overview_releases_v
        ORDER BY volume_7d_usdt DESC NULLS LAST
        LIMIT 1
      ),
      'topReleaseByPayouts', (
        SELECT jsonb_build_object(
          'id', id,
          'title', title,
          'symbol', symbol,
          'payoutsUsdt', payouts_total::text
        )
        FROM market_overview_releases_v
        WHERE COALESCE(payouts_total, 0) > 0
        ORDER BY payouts_total DESC NULLS LAST
        LIMIT 1
      )
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
        SELECT DATE(ed.created_at) AS dt, SUM(ed.total_distributable) AS total, COUNT(*)::int AS cnt
        FROM earning_distributions ed
        JOIN releases r ON r.id = ed.release_id
        WHERE r.deleted_at IS NULL
          AND (v_interval IS NULL OR ed.created_at >= NOW() - v_interval)
        GROUP BY DATE(ed.created_at)
      ) d
    ), '[]'::jsonb),
    'genreDistribution', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'genre', g.genre,
        'count', g.cnt,
        'averageYieldPct', ROUND(g.avg_yield::numeric, 2),
        'volumeUsdt', g.volume::text,
        'avgProgressPct', ROUND(g.avg_progress::numeric, 2)
      ) ORDER BY g.cnt DESC)
      FROM (
        SELECT
          genre,
          COUNT(*)::int AS cnt,
          AVG(expected_yield_pct) AS avg_yield,
          SUM(volume_7d_usdt) AS volume,
          AVG(progress_pct) AS avg_progress
        FROM market_overview_releases_v
        GROUP BY genre
      ) g
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION analytics_releases_timeseries(p_period text DEFAULT '30d')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_period text := lower(trim(COALESCE(p_period, '30d')));
  v_interval interval := analytics_period_interval(v_period);
BEGIN
  IF v_period NOT IN ('7d', '30d', '90d', 'all') THEN
    v_period := '30d';
    v_interval := analytics_period_interval('30d');
  END IF;

  RETURN jsonb_build_object(
    'period', v_period,
    'updatedAt', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'primaryVolume', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', to_char(d.dt, 'YYYY-MM-DD'),
        'volumeUsdt', d.total::text,
        'ordersCount', d.cnt
      ) ORDER BY d.dt)
      FROM (
        SELECT DATE(o.created_at) AS dt, SUM(o.gross_amount) AS total, COUNT(*)::int AS cnt
        FROM orders o
        JOIN releases r ON r.id = o.release_id
        WHERE o.primary_raise_round_id IS NOT NULL
          AND o.side = 'BUY'
          AND o.status IN ('FILLED', 'PARTIALLY_FILLED', 'SETTLED', 'PAID')
          AND r.deleted_at IS NULL
          AND (v_interval IS NULL OR o.created_at >= NOW() - v_interval)
        GROUP BY DATE(o.created_at)
      ) d
    ), '[]'::jsonb),
    'secondaryVolume', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', to_char(d.dt, 'YYYY-MM-DD'),
        'volumeUsdt', d.total::text,
        'tradesCount', d.cnt,
        'avgPriceUsdt', CASE WHEN d.cnt > 0 THEN ROUND((d.total / d.units)::numeric, 4)::text ELSE NULL END
      ) ORDER BY d.dt)
      FROM (
        SELECT
          DATE(t.executed_at) AS dt,
          SUM(t.gross_amount) AS total,
          SUM(t.units) AS units,
          COUNT(*)::int AS cnt
        FROM trades t
        JOIN releases r ON r.id = t.release_id
        WHERE t.settlement_status = 'SETTLED'
          AND r.deleted_at IS NULL
          AND (v_interval IS NULL OR t.executed_at >= NOW() - v_interval)
        GROUP BY DATE(t.executed_at)
      ) d
    ), '[]'::jsonb),
    'payouts', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', to_char(d.dt, 'YYYY-MM-DD'),
        'payoutsUsdt', d.total::text,
        'distributionsCount', d.cnt
      ) ORDER BY d.dt)
      FROM (
        SELECT DATE(ed.created_at) AS dt, SUM(ed.total_distributable) AS total, COUNT(*)::int AS cnt
        FROM earning_distributions ed
        JOIN releases r ON r.id = ed.release_id
        WHERE r.deleted_at IS NULL
          AND (v_interval IS NULL OR ed.created_at >= NOW() - v_interval)
        GROUP BY DATE(ed.created_at)
      ) d
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION analytics_releases_compare(
  p_period text DEFAULT '30d',
  p_limit integer DEFAULT 8
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 8), 1), 20);
BEGIN
  RETURN jsonb_build_object(
    'period', lower(trim(COALESCE(p_period, '30d'))),
    'updatedAt', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', m.id,
        'symbol', m.symbol,
        'title', m.title,
        'artist', m.artist,
        'raisedUsdt', m.raised_usdt::text,
        'soldUnits', m.units_sold::text,
        'holdersCount', m.holders_count,
        'secondaryVolumeUsdt', m.volume_7d_usdt::text,
        'payoutsUsdt', m.payouts_total::text,
        'liquidityScore', m.liquidity_score,
        'progressPct', m.progress_pct
      ) ORDER BY m.volume_7d_usdt DESC NULLS LAST)
      FROM (
        SELECT * FROM market_overview_releases_v
        ORDER BY volume_7d_usdt DESC NULLS LAST
        LIMIT v_limit
      ) m
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION analytics_releases_genres(p_period text DEFAULT '30d')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN jsonb_build_object(
    'period', lower(trim(COALESCE(p_period, '30d'))),
    'updatedAt', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'genre', g.genre,
        'count', g.cnt,
        'volumeUsdt', g.volume::text,
        'averageYieldPct', ROUND(g.avg_yield::numeric, 2),
        'avgProgressPct', ROUND(g.avg_progress::numeric, 2)
      ) ORDER BY g.cnt DESC)
      FROM (
        SELECT
          genre,
          COUNT(*)::int AS cnt,
          SUM(volume_7d_usdt) AS volume,
          AVG(expected_yield_pct) AS avg_yield,
          AVG(progress_pct) AS avg_progress
        FROM market_overview_releases_v
        GROUP BY genre
      ) g
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION analytics_releases_funnel(p_period text DEFAULT '30d')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_interval interval := analytics_period_interval(lower(trim(COALESCE(p_period, '30d'))));
BEGIN
  RETURN jsonb_build_object(
    'period', lower(trim(COALESCE(p_period, '30d'))),
    'updatedAt', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'steps', jsonb_build_object(
      'createdReleases', (SELECT COUNT(*)::int FROM releases WHERE deleted_at IS NULL),
      'activeRounds', (
        SELECT COUNT(*)::int FROM primary_raise_rounds
        WHERE status = 'LIVE'
      ),
      'soldUnits', COALESCE((
        SELECT SUM(units_sold)::text
        FROM (
          SELECT r.total_units - r.units_available_primary AS units_sold
          FROM releases r
          WHERE r.deleted_at IS NULL
        ) s
      ), '0'),
      'holders', (
        SELECT COUNT(DISTINCT user_id)::int FROM user_positions WHERE units_total > 0
      ),
      'payoutsReleases', (
        SELECT COUNT(DISTINCT release_id)::int FROM earning_distributions
      ),
      'secondaryListings', (
        SELECT COUNT(*)::int FROM market_listings
        WHERE deleted_at IS NULL AND status = 'ACTIVE' AND units_available > 0
      ),
      'secondaryTrades', (
        SELECT COUNT(*)::int FROM trades t
        WHERE t.settlement_status = 'SETTLED'
          AND (v_interval IS NULL OR t.executed_at >= NOW() - v_interval)
      )
    )
  );
END;
$$;

DROP FUNCTION IF EXISTS analytics_releases_search(
  text, text, text, text, text, text, integer, integer, uuid
);

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
  sold_units numeric,
  available_units numeric,
  price_per_unit_usdt numeric,
  raised_usdt numeric,
  target_usdt numeric,
  progress_pct numeric,
  holders_count integer,
  secondary_listings_count integer,
  last_trade_price numeric,
  updated_at timestamptz,
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
      END AS my_pnl_val,
      m.units_sold AS sold_u,
      m.available_units AS avail_u,
      m.primary_unit_price_usdt AS price_u,
      m.raised_usdt AS raised_u,
      COALESCE(m.goal_usdt, m.raise_target_usdt, 0) AS target_u,
      m.progress_pct AS prog,
      m.holders_count AS holders,
      m.active_secondary_listings_count AS listings,
      m.last_trade_price AS last_price,
      (m.updated_at AT TIME ZONE 'UTC') AS upd
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
    c.my_u, c.my_pnl_val,
    c.sold_u, c.avail_u, c.price_u, c.raised_u, c.target_u, c.prog,
    c.holders, c.listings, c.last_price, c.upd,
    c.tc
  FROM counted c
  ORDER BY
    CASE WHEN v_sort = 'yield_desc' THEN c.yld END DESC NULLS LAST,
    CASE WHEN v_sort = 'yield_asc' THEN c.yld END ASC NULLS LAST,
    CASE WHEN v_sort = 'payouts_desc' THEN c.pay END DESC NULLS LAST,
    CASE WHEN v_sort = 'payouts_asc' THEN c.pay END ASC NULLS LAST,
    CASE WHEN v_sort = 'units_desc' THEN c.unt END DESC NULLS LAST,
    CASE WHEN v_sort = 'units_asc' THEN c.unt END ASC NULLS LAST,
    CASE WHEN v_sort = 'liquidity_desc' THEN c.liq END DESC NULLS LAST,
    CASE WHEN v_sort = 'progress_desc' THEN c.prog END DESC NULLS LAST,
    CASE WHEN v_sort = 'raised_desc' THEN c.raised_u END DESC NULLS LAST,
    CASE WHEN v_sort = 'holders_desc' THEN c.holders END DESC NULLS LAST,
    c.symbol ASC
  LIMIT v_page_size
  OFFSET v_offset;
END;
$$;
