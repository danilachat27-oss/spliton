-- Fix ambiguous created_at in analytics_releases_overview payoutDynamics

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
