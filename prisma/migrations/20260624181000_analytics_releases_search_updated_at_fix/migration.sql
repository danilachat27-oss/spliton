-- Fix analytics_releases_search updated_at type mismatch (timestamp vs timestamptz).

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
