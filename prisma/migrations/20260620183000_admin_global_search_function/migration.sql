-- Unified admin global search across operator portal entities.

CREATE OR REPLACE FUNCTION admin_search_is_uuid(p_query text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    p_query ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
    false
  );
$$;

CREATE OR REPLACE FUNCTION admin_search_is_release_keyword(p_query text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(btrim(COALESCE(p_query, ''))) IN (
    convert_from(decode('d180d0b5d0bbd0b8d0b7', 'hex'), 'UTF8'),
    convert_from(decode('d180d0b5d0bbd0b8d0b7d18b', 'hex'), 'UTF8'),
    convert_from(decode('d180d0b5d0bbd0b8d0b7d0b0', 'hex'), 'UTF8'),
    convert_from(decode('d180d0b5d0bbd0b8d0b7d0bed0b2', 'hex'), 'UTF8'),
    'release',
    'releases',
    convert_from(decode('d182d180d0b5d0ba', 'hex'), 'UTF8'),
    convert_from(decode('d182d180d0b5d0bad0b8', 'hex'), 'UTF8'),
    convert_from(decode('d182d180d0b5d0bad0b0', 'hex'), 'UTF8'),
    convert_from(decode('d182d180d0b5d0bad0bed0b2', 'hex'), 'UTF8'),
    'track',
    'tracks',
    convert_from(decode('d0b0d0bbd18cd0b1d0bed0bc', 'hex'), 'UTF8'),
    convert_from(decode('d0b0d0bbd18cd0b1d0bed0bcd18b', 'hex'), 'UTF8'),
    'album',
    'albums'
  );
$$;

CREATE OR REPLACE FUNCTION admin_search_group_enabled(p_groups text[], p_group text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_groups IS NULL OR p_group = ANY (p_groups);
$$;

CREATE OR REPLACE FUNCTION admin_global_search(
  p_query text,
  p_groups text[] DEFAULT NULL,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  group_type text,
  entity_id uuid,
  title text,
  subtitle text,
  status text,
  meta text,
  rank numeric
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_query text := NULLIF(btrim(COALESCE(p_query, '')), '');
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 5), 1), 20);
  v_release_browse boolean := false;
BEGIN
  IF v_query IS NULL OR char_length(v_query) < 2 THEN
    RETURN;
  END IF;

  v_release_browse := admin_search_is_release_keyword(v_query);

  RETURN QUERY
  WITH ranked AS (
    -- Users
    SELECT *
    FROM (
      SELECT
        'users'::text AS group_type,
        u.id AS entity_id,
        COALESCE(NULLIF(btrim(up.display_name), ''), u.email) AS title,
        u.email AS subtitle,
        lower(u.status::text) AS status,
        left(u.id::text, 8) AS meta,
        CASE
          WHEN admin_search_is_uuid(v_query) AND u.id = v_query::uuid THEN 100::numeric
          WHEN u.email ILIKE v_query || '%' THEN 90::numeric
          WHEN u.email ILIKE '%' || v_query || '%' THEN 80::numeric
          WHEN COALESCE(up.display_name, '') ILIKE '%' || v_query || '%' THEN 70::numeric
          ELSE 50::numeric
        END AS rank
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE
        admin_search_group_enabled(p_groups, 'users')
        AND u.deleted_at IS NULL
        AND (
          u.email ILIKE '%' || v_query || '%'
          OR COALESCE(up.display_name, '') ILIKE '%' || v_query || '%'
          OR (admin_search_is_uuid(v_query) AND u.id = v_query::uuid)
        )
      ORDER BY rank DESC, u.created_at DESC
      LIMIT v_limit
    ) users_q

    UNION ALL

    -- Withdrawals
    SELECT *
    FROM (
      SELECT
        'withdrawals'::text,
        w.id,
        u.email,
        to_char(wt.net_amount, 'FM999999990.00') || ' USDT',
        lower(w.status::text),
        left(COALESCE(w.blockchain_txid, w.id::text), 12),
        CASE
          WHEN admin_search_is_uuid(v_query) AND w.id = v_query::uuid THEN 100::numeric
          WHEN COALESCE(w.blockchain_txid, '') ILIKE '%' || v_query || '%' THEN 90::numeric
          WHEN w.to_address ILIKE '%' || v_query || '%' THEN 80::numeric
          WHEN u.email ILIKE '%' || v_query || '%' THEN 70::numeric
          ELSE 50::numeric
        END AS rank
      FROM withdrawals w
      JOIN wallet_transactions wt ON wt.id = w.wallet_tx_id
      JOIN wallets wal ON wal.id = wt.wallet_id
      JOIN users u ON u.id = wal.user_id
      WHERE
        admin_search_group_enabled(p_groups, 'withdrawals')
        AND (
          (admin_search_is_uuid(v_query) AND w.id = v_query::uuid)
          OR COALESCE(w.blockchain_txid, '') ILIKE '%' || v_query || '%'
          OR w.to_address ILIKE '%' || v_query || '%'
          OR u.email ILIKE '%' || v_query || '%'
        )
      ORDER BY rank DESC, w.requested_at DESC
      LIMIT v_limit
    ) withdrawals_q

    UNION ALL

    -- Deposits
    SELECT *
    FROM (
      SELECT
        'deposits'::text,
        d.id,
        u.email,
        to_char(wt.net_amount, 'FM999999990.00') || ' USDT',
        lower(d.status::text),
        left(COALESCE(d.blockchain_txid, d.id::text), 12),
        CASE
          WHEN admin_search_is_uuid(v_query) AND d.id = v_query::uuid THEN 100::numeric
          WHEN COALESCE(d.blockchain_txid, '') ILIKE '%' || v_query || '%' THEN 90::numeric
          WHEN COALESCE(d.to_address, '') ILIKE '%' || v_query || '%' THEN 80::numeric
          WHEN u.email ILIKE '%' || v_query || '%' THEN 70::numeric
          ELSE 50::numeric
        END AS rank
      FROM deposits d
      JOIN wallet_transactions wt ON wt.id = d.wallet_tx_id
      JOIN wallets wal ON wal.id = wt.wallet_id
      JOIN users u ON u.id = wal.user_id
      WHERE
        admin_search_group_enabled(p_groups, 'deposits')
        AND (
          (admin_search_is_uuid(v_query) AND d.id = v_query::uuid)
          OR COALESCE(d.blockchain_txid, '') ILIKE '%' || v_query || '%'
          OR COALESCE(d.to_address, '') ILIKE '%' || v_query || '%'
          OR u.email ILIKE '%' || v_query || '%'
        )
      ORDER BY rank DESC, d.created_at DESC
      LIMIT v_limit
    ) deposits_q

    UNION ALL

    -- Tracks / releases
    SELECT *
    FROM (
      SELECT
        'tracks'::text,
        r.id,
        r.title,
        COALESCE(art.artists, r.symbol),
        lower(r.status::text),
        r.symbol,
        CASE
          WHEN v_release_browse THEN 60::numeric
          WHEN admin_search_is_uuid(v_query) AND r.id = v_query::uuid THEN 100::numeric
          WHEN r.title ILIKE v_query || '%' THEN 95::numeric
          WHEN r.title ILIKE '%' || v_query || '%' THEN 85::numeric
          WHEN r.symbol ILIKE '%' || v_query || '%' THEN 80::numeric
          WHEN r.slug ILIKE '%' || v_query || '%' THEN 75::numeric
          WHEN COALESCE(art.artists, '') ILIKE '%' || v_query || '%' THEN 70::numeric
          ELSE 55::numeric
        END AS rank
      FROM releases r
      LEFT JOIN LATERAL (
        SELECT string_agg(DISTINCT a.name, ', ' ORDER BY a.name) AS artists
        FROM release_artists ra
        JOIN artists a ON a.id = ra.artist_id
        WHERE ra.release_id = r.id
      ) art ON true
      WHERE
        admin_search_group_enabled(p_groups, 'tracks')
        AND r.deleted_at IS NULL
        AND (
          v_release_browse
          OR r.title ILIKE '%' || v_query || '%'
          OR r.slug ILIKE '%' || v_query || '%'
          OR r.symbol ILIKE '%' || v_query || '%'
          OR COALESCE(r.genre, '') ILIKE '%' || v_query || '%'
          OR COALESCE(r.isrc, '') ILIKE '%' || v_query || '%'
          OR COALESCE(r.upc, '') ILIKE '%' || v_query || '%'
          OR COALESCE(r.short_description, '') ILIKE '%' || v_query || '%'
          OR COALESCE(art.artists, '') ILIKE '%' || v_query || '%'
          OR (admin_search_is_uuid(v_query) AND r.id = v_query::uuid)
        )
      ORDER BY rank DESC, r.updated_at DESC
      LIMIT v_limit
    ) tracks_q

    UNION ALL

    -- Primary raise rounds
    SELECT *
    FROM (
      SELECT
        'rounds'::text,
        prr.id,
        COALESCE(NULLIF(btrim(prr.name), ''), rel.title),
        rel.title,
        lower(prr.status::text),
        left(prr.id::text, 8),
        CASE
          WHEN admin_search_is_uuid(v_query) AND prr.id = v_query::uuid THEN 100::numeric
          WHEN rel.title ILIKE '%' || v_query || '%' THEN 85::numeric
          WHEN COALESCE(prr.name, '') ILIKE '%' || v_query || '%' THEN 80::numeric
          ELSE 55::numeric
        END AS rank
      FROM primary_raise_rounds prr
      JOIN releases rel ON rel.id = prr.release_id
      WHERE
        admin_search_group_enabled(p_groups, 'rounds')
        AND rel.deleted_at IS NULL
        AND (
          (admin_search_is_uuid(v_query) AND prr.id = v_query::uuid)
          OR rel.title ILIKE '%' || v_query || '%'
          OR COALESCE(prr.name, '') ILIKE '%' || v_query || '%'
          OR v_release_browse
        )
      ORDER BY rank DESC, prr.updated_at DESC
      LIMIT v_limit
    ) rounds_q

    UNION ALL

    -- Secondary market trades
    SELECT *
    FROM (
      SELECT
        'trades'::text,
        t.id,
        rel.title,
        buyer.email || ' <-> ' || seller.email,
        lower(t.settlement_status::text),
        left(t.id::text, 8),
        CASE
          WHEN admin_search_is_uuid(v_query) AND t.id = v_query::uuid THEN 100::numeric
          WHEN rel.title ILIKE '%' || v_query || '%' THEN 85::numeric
          WHEN buyer.email ILIKE '%' || v_query || '%' THEN 75::numeric
          WHEN seller.email ILIKE '%' || v_query || '%' THEN 75::numeric
          ELSE 55::numeric
        END AS rank
      FROM trades t
      JOIN releases rel ON rel.id = t.release_id
      JOIN users buyer ON buyer.id = t.buyer_user_id
      JOIN users seller ON seller.id = t.seller_user_id
      WHERE
        admin_search_group_enabled(p_groups, 'trades')
        AND (
          (admin_search_is_uuid(v_query) AND t.id = v_query::uuid)
          OR rel.title ILIKE '%' || v_query || '%'
          OR buyer.email ILIKE '%' || v_query || '%'
          OR seller.email ILIKE '%' || v_query || '%'
        )
      ORDER BY rank DESC, t.executed_at DESC
      LIMIT v_limit
    ) trades_q

    UNION ALL

    -- Audit log
    SELECT *
    FROM (
      SELECT
        'audit'::text,
        al.id,
        al.action,
        al.entity_type,
        NULL::text,
        left(COALESCE(al.entity_id, ''), 8),
        CASE
          WHEN admin_search_is_uuid(v_query) AND al.entity_id = v_query::text THEN 100::numeric
          WHEN al.action ILIKE '%' || v_query || '%' THEN 85::numeric
          WHEN al.entity_type ILIKE '%' || v_query || '%' THEN 75::numeric
          ELSE 55::numeric
        END AS rank
      FROM audit_logs al
      WHERE
        admin_search_group_enabled(p_groups, 'audit')
        AND (
          al.action ILIKE '%' || v_query || '%'
          OR al.entity_type ILIKE '%' || v_query || '%'
          OR (admin_search_is_uuid(v_query) AND al.entity_id = v_query::text)
        )
      ORDER BY rank DESC, al.created_at DESC
      LIMIT v_limit
    ) audit_q

    UNION ALL

    -- Artists
    SELECT *
    FROM (
      SELECT
        'artists'::text,
        a.id,
        a.name,
        a.slug,
        CASE WHEN a.is_active THEN 'active' ELSE 'inactive' END,
        left(a.id::text, 8),
        CASE
          WHEN admin_search_is_uuid(v_query) AND a.id = v_query::uuid THEN 100::numeric
          WHEN a.name ILIKE v_query || '%' THEN 90::numeric
          WHEN a.name ILIKE '%' || v_query || '%' THEN 80::numeric
          WHEN a.slug ILIKE '%' || v_query || '%' THEN 75::numeric
          ELSE 55::numeric
        END AS rank
      FROM artists a
      WHERE
        admin_search_group_enabled(p_groups, 'artists')
        AND (
          a.name ILIKE '%' || v_query || '%'
          OR a.slug ILIKE '%' || v_query || '%'
          OR (admin_search_is_uuid(v_query) AND a.id = v_query::uuid)
        )
      ORDER BY rank DESC, a.updated_at DESC
      LIMIT v_limit
    ) artists_q

    UNION ALL

    -- Disputes
    SELECT *
    FROM (
      SELECT
        'disputes'::text,
        d.id,
        d.subject,
        u.email,
        lower(d.status::text),
        left(d.id::text, 8),
        CASE
          WHEN admin_search_is_uuid(v_query) AND d.id = v_query::uuid THEN 100::numeric
          WHEN d.subject ILIKE '%' || v_query || '%' THEN 85::numeric
          WHEN u.email ILIKE '%' || v_query || '%' THEN 75::numeric
          ELSE 55::numeric
        END AS rank
      FROM disputes d
      JOIN users u ON u.id = d.user_id
      WHERE
        admin_search_group_enabled(p_groups, 'disputes')
        AND (
          (admin_search_is_uuid(v_query) AND d.id = v_query::uuid)
          OR d.subject ILIKE '%' || v_query || '%'
          OR u.email ILIKE '%' || v_query || '%'
        )
      ORDER BY rank DESC, d.created_at DESC
      LIMIT v_limit
    ) disputes_q

    UNION ALL

    -- Support tickets
    SELECT *
    FROM (
      SELECT
        'support'::text,
        st.id,
        st.subject,
        u.email,
        lower(st.status::text),
        left(st.id::text, 8),
        CASE
          WHEN admin_search_is_uuid(v_query) AND st.id = v_query::uuid THEN 100::numeric
          WHEN st.subject ILIKE '%' || v_query || '%' THEN 85::numeric
          WHEN u.email ILIKE '%' || v_query || '%' THEN 75::numeric
          ELSE 55::numeric
        END AS rank
      FROM support_tickets st
      JOIN users u ON u.id = st.user_id
      WHERE
        admin_search_group_enabled(p_groups, 'support')
        AND (
          (admin_search_is_uuid(v_query) AND st.id = v_query::uuid)
          OR st.subject ILIKE '%' || v_query || '%'
          OR u.email ILIKE '%' || v_query || '%'
        )
      ORDER BY rank DESC, st.created_at DESC
      LIMIT v_limit
    ) support_q

    UNION ALL

    -- Wallets
    SELECT *
    FROM (
      SELECT
        'wallets'::text,
        wal.id,
        u.email,
        wal.asset_code || ' / ' || wal.network,
        lower(wal.status::text),
        left(COALESCE(wal.address, wal.id::text), 12),
        CASE
          WHEN admin_search_is_uuid(v_query) AND wal.id = v_query::uuid THEN 100::numeric
          WHEN u.email ILIKE '%' || v_query || '%' THEN 85::numeric
          WHEN COALESCE(wal.address, '') ILIKE '%' || v_query || '%' THEN 80::numeric
          ELSE 55::numeric
        END AS rank
      FROM wallets wal
      JOIN users u ON u.id = wal.user_id
      WHERE
        admin_search_group_enabled(p_groups, 'wallets')
        AND (
          (admin_search_is_uuid(v_query) AND wal.id = v_query::uuid)
          OR u.email ILIKE '%' || v_query || '%'
          OR COALESCE(wal.address, '') ILIKE '%' || v_query || '%'
        )
      ORDER BY rank DESC, wal.updated_at DESC
      LIMIT v_limit
    ) wallets_q

    UNION ALL

    -- News
    SELECT *
    FROM (
      SELECT
        'news'::text,
        np.id,
        np.title,
        np.slug,
        lower(np.status::text),
        left(np.id::text, 8),
        CASE
          WHEN admin_search_is_uuid(v_query) AND np.id = v_query::uuid THEN 100::numeric
          WHEN np.title ILIKE '%' || v_query || '%' THEN 85::numeric
          WHEN np.slug ILIKE '%' || v_query || '%' THEN 75::numeric
          ELSE 55::numeric
        END AS rank
      FROM news_posts np
      WHERE
        admin_search_group_enabled(p_groups, 'news')
        AND (
          np.title ILIKE '%' || v_query || '%'
          OR np.slug ILIKE '%' || v_query || '%'
          OR COALESCE(np.short_description, '') ILIKE '%' || v_query || '%'
          OR (admin_search_is_uuid(v_query) AND np.id = v_query::uuid)
        )
      ORDER BY rank DESC, np.updated_at DESC
      LIMIT v_limit
    ) news_q
  )
  SELECT
    ranked.group_type,
    ranked.entity_id,
    ranked.title,
    ranked.subtitle,
    ranked.status,
    ranked.meta,
    ranked.rank
  FROM ranked
  ORDER BY ranked.group_type, ranked.rank DESC, ranked.title;
END;
$$;
