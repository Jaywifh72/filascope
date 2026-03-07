
-- 3-way price conflict detection: flat columns vs filament_listings vs product_regional_prices
-- Returns filaments where any two sources differ by more than p_threshold_pct percent
CREATE OR REPLACE FUNCTION public.get_three_way_price_conflicts(
  p_threshold_pct numeric DEFAULT 5,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  filament_id uuid,
  product_title text,
  vendor text,
  region_code text,
  flat_price numeric,
  listing_price numeric,
  prp_price numeric,
  flat_vs_listing_pct numeric,
  flat_vs_prp_pct numeric,
  listing_vs_prp_pct numeric,
  max_diff_pct numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  RETURN QUERY
  WITH flat AS (
    SELECT f.id, f.product_title, f.vendor,
      unnest(ARRAY['US','CA','EU','UK','AU','JP']) AS rcode,
      unnest(ARRAY[f.variant_price, f.price_cad, f.price_eur, f.price_gbp, f.price_aud, f.price_jpy]) AS price
    FROM filaments f
  ),
  listings AS (
    SELECT fl.filament_id AS id, fl.region AS rcode,
      MIN(fl.current_price) FILTER (WHERE fl.available = true AND fl.current_price > 0) AS price
    FROM filament_listings fl
    GROUP BY fl.filament_id, fl.region
  ),
  prp AS (
    SELECT p.product_id AS id, p.region_code AS rcode, p.current_price AS price
    FROM product_regional_prices p
    WHERE p.product_type = 'filament' AND p.current_price > 0
  ),
  combined AS (
    SELECT
      flat.id,
      flat.product_title,
      flat.vendor,
      flat.rcode,
      flat.price AS fp,
      listings.price AS lp,
      prp.price AS pp
    FROM flat
    LEFT JOIN listings ON listings.id = flat.id AND listings.rcode = flat.rcode
    LEFT JOIN prp ON prp.id = flat.id AND prp.rcode = flat.rcode
    WHERE flat.price IS NOT NULL
      AND (listings.price IS NOT NULL OR prp.price IS NOT NULL)
  ),
  diffs AS (
    SELECT
      c.*,
      CASE WHEN c.fp > 0 AND c.lp > 0 THEN ROUND(ABS(c.fp - c.lp) / c.fp * 100, 1) ELSE NULL END AS fl_pct,
      CASE WHEN c.fp > 0 AND c.pp > 0 THEN ROUND(ABS(c.fp - c.pp) / c.fp * 100, 1) ELSE NULL END AS fp_pct,
      CASE WHEN c.lp > 0 AND c.pp > 0 THEN ROUND(ABS(c.lp - c.pp) / GREATEST(c.lp, 0.01) * 100, 1) ELSE NULL END AS lp_pct
    FROM combined c
  )
  SELECT
    d.id,
    d.product_title,
    d.vendor,
    d.rcode,
    d.fp,
    d.lp,
    d.pp,
    d.fl_pct,
    d.fp_pct,
    d.lp_pct,
    GREATEST(COALESCE(d.fl_pct, 0), COALESCE(d.fp_pct, 0), COALESCE(d.lp_pct, 0)) AS max_pct
  FROM diffs d
  WHERE GREATEST(COALESCE(d.fl_pct, 0), COALESCE(d.fp_pct, 0), COALESCE(d.lp_pct, 0)) >= p_threshold_pct
  ORDER BY max_pct DESC
  LIMIT p_limit;
END;
$$;
