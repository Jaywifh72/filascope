-- Materialized view: single source of truth for filament prices
CREATE MATERIALIZED VIEW v_canonical_prices AS
WITH ranked AS (
  -- Source 1: filament_listings (highest priority)
  SELECT
    fl.filament_id,
    fl.region AS region_code,
    fl.current_price AS canonical_price,
    fl.currency AS currency_code,
    'filament_listings'::text AS price_source,
    fl.id::text AS source_row_id,
    fl.product_url,
    fl.updated_at AS last_updated_at,
    1 AS priority
  FROM filament_listings fl
  WHERE fl.current_price IS NOT NULL
    AND fl.filament_id IS NOT NULL
    AND fl.region IS NOT NULL

  UNION ALL

  -- Source 2: product_regional_prices
  SELECT
    prp.product_id AS filament_id,
    prp.region_code,
    prp.current_price AS canonical_price,
    prp.currency_code,
    'product_regional_prices'::text AS price_source,
    prp.id::text AS source_row_id,
    NULL::text AS product_url,
    prp.updated_at AS last_updated_at,
    2 AS priority
  FROM product_regional_prices prp
  WHERE prp.product_type = 'filament'
    AND prp.current_price IS NOT NULL

  UNION ALL

  -- Source 3: filament_prices via stores
  SELECT
    fp.filament_id,
    s.region AS region_code,
    (fp.price_cents / 100.0)::numeric AS canonical_price,
    fp.currency_code,
    'filament_prices'::text AS price_source,
    fp.id::text AS source_row_id,
    fp.product_url,
    fp.updated_at AS last_updated_at,
    3 AS priority
  FROM filament_prices fp
  JOIN stores s ON s.id = fp.store_id
  WHERE fp.price_cents > 0
    AND s.region IS NOT NULL

  UNION ALL

  -- Source 4: filaments flat columns — US
  SELECT id, 'US'::text, variant_price, 'USD'::text, 'filaments_flat'::text, id::text, product_url, updated_at, 4
  FROM filaments WHERE variant_price IS NOT NULL

  UNION ALL

  -- Source 4: filaments flat columns — CA
  SELECT id, 'CA'::text, price_cad, 'CAD'::text, 'filaments_flat'::text, id::text, product_url_ca, updated_at, 4
  FROM filaments WHERE price_cad IS NOT NULL

  UNION ALL

  -- Source 4: filaments flat columns — EU
  SELECT id, 'EU'::text, price_eur, 'EUR'::text, 'filaments_flat'::text, id::text, product_url_eu, updated_at, 4
  FROM filaments WHERE price_eur IS NOT NULL

  UNION ALL

  -- Source 4: filaments flat columns — UK
  SELECT id, 'UK'::text, price_gbp, 'GBP'::text, 'filaments_flat'::text, id::text, product_url_uk, updated_at, 4
  FROM filaments WHERE price_gbp IS NOT NULL

  UNION ALL

  -- Source 4: filaments flat columns — AU
  SELECT id, 'AU'::text, price_aud, 'AUD'::text, 'filaments_flat'::text, id::text, product_url_au, updated_at, 4
  FROM filaments WHERE price_aud IS NOT NULL

  UNION ALL

  -- Source 4: filaments flat columns — JP
  SELECT id, 'JP'::text, price_jpy, 'JPY'::text, 'filaments_flat'::text, id::text, product_url_jp, updated_at, 4
  FROM filaments WHERE price_jpy IS NOT NULL
)
SELECT DISTINCT ON (filament_id, region_code)
  filament_id,
  region_code,
  canonical_price,
  currency_code,
  price_source,
  source_row_id,
  product_url,
  last_updated_at
FROM ranked
ORDER BY filament_id, region_code, priority;

-- Unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_canonical_prices_pk ON v_canonical_prices (filament_id, region_code);

-- Refresh function (admin-gated)
CREATE OR REPLACE FUNCTION refresh_canonical_prices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  REFRESH MATERIALIZED VIEW CONCURRENTLY v_canonical_prices;
END;
$$;

-- Conflict detection RPC: finds filaments where canonical price differs >5% from flat column
CREATE OR REPLACE FUNCTION get_price_conflicts(p_limit int DEFAULT 50)
RETURNS TABLE(
  filament_id uuid,
  product_title text,
  vendor text,
  region_code text,
  canonical_price numeric,
  canonical_source text,
  flat_price numeric,
  pct_diff numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH flat AS (
    SELECT id, 'US'::text AS rc, variant_price AS fp FROM filaments WHERE variant_price IS NOT NULL
    UNION ALL
    SELECT id, 'CA', price_cad FROM filaments WHERE price_cad IS NOT NULL
    UNION ALL
    SELECT id, 'EU', price_eur FROM filaments WHERE price_eur IS NOT NULL
    UNION ALL
    SELECT id, 'UK', price_gbp FROM filaments WHERE price_gbp IS NOT NULL
    UNION ALL
    SELECT id, 'AU', price_aud FROM filaments WHERE price_aud IS NOT NULL
    UNION ALL
    SELECT id, 'JP', price_jpy FROM filaments WHERE price_jpy IS NOT NULL
  )
  SELECT
    cp.filament_id,
    f.product_title,
    f.vendor,
    cp.region_code,
    cp.canonical_price,
    cp.price_source AS canonical_source,
    flat.fp AS flat_price,
    ROUND(ABS(cp.canonical_price - flat.fp) / NULLIF(flat.fp, 0) * 100, 1) AS pct_diff
  FROM v_canonical_prices cp
  JOIN flat ON flat.id = cp.filament_id AND flat.rc = cp.region_code
  JOIN filaments f ON f.id = cp.filament_id
  WHERE cp.price_source != 'filaments_flat'
    AND flat.fp > 0
    AND ABS(cp.canonical_price - flat.fp) / NULLIF(flat.fp, 0) > 0.05
  ORDER BY pct_diff DESC
  LIMIT p_limit;
$$;