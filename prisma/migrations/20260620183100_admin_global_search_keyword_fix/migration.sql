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
