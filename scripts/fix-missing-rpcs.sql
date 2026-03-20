-- ============================================================
-- fix-missing-rpcs.sql
-- Consolidated SQL to recreate all missing RPC functions, views,
-- fix user_roles RLS, and add FK constraint on amazon_product_mappings.
--
-- Run against the target Supabase project via:
--   psql -f scripts/fix-missing-rpcs.sql
-- or paste into the Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- 0. Ensure the app_role enum exists
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin');
  END IF;
END $$;

-- ============================================================
-- 1. has_role (FIRST - other policies depend on it)
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ============================================================
-- 2. get_catalog_counts
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_catalog_counts()
RETURNS TABLE(product_count bigint, variant_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    COUNT(DISTINCT product_line_id) AS product_count,
    COUNT(*) AS variant_count
  FROM filaments;
$function$;

-- ============================================================
-- 3. get_catalog_counts_by_brand
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_catalog_counts_by_brand()
RETURNS TABLE(vendor_lower text, variant_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    LOWER(REPLACE(REPLACE(vendor, ' ', '-'), '''', '')) AS vendor_lower,
    COUNT(*) AS variant_count
  FROM filaments
  WHERE vendor IS NOT NULL
  GROUP BY vendor;
$$;

-- ============================================================
-- 4. get_filter_counts
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_filter_counts(
  p_search text DEFAULT NULL,
  p_region text DEFAULT 'US',
  p_materials text[] DEFAULT NULL,
  p_brands text[] DEFAULT NULL,
  p_price_min numeric DEFAULT NULL,
  p_price_max numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  WITH base_filtered AS (
    SELECT f.*
    FROM filaments f
    WHERE f.material IS NOT NULL
      AND (f.net_weight_g IS NULL OR f.net_weight_g >= 300)
      AND (p_search IS NULL OR p_search = '' OR (
        f.product_title ILIKE '%' || p_search || '%' OR f.vendor ILIKE '%' || p_search || '%'
        OR f.material ILIKE '%' || p_search || '%'))
      AND (p_price_min IS NULL OR f.variant_price >= p_price_min)
      AND (p_price_max IS NULL OR f.variant_price <= p_price_max)
  ),
  material_counts AS (
    SELECT f.material, COUNT(*)::int as cnt FROM base_filtered f
    WHERE f.material IS NOT NULL AND (p_brands IS NULL OR f.vendor = ANY(p_brands))
    GROUP BY f.material
  ),
  brand_counts AS (
    SELECT f.vendor, COUNT(*)::int as cnt FROM base_filtered f
    WHERE f.vendor IS NOT NULL AND (p_materials IS NULL OR f.material = ANY(p_materials))
    GROUP BY f.vendor
  ),
  full_filtered AS (
    SELECT f.* FROM base_filtered f
    WHERE (p_materials IS NULL OR f.material = ANY(p_materials))
      AND (p_brands IS NULL OR f.vendor = ANY(p_brands))
  ),
  bool_counts AS (
    SELECT
      COUNT(*) FILTER (WHERE LOWER(finish_type) = 'matte' OR product_title ILIKE '%matte%')::int as matte,
      COUNT(*) FILTER (WHERE finish_type ILIKE '%silk%' OR finish_type ILIKE '%shimmer%' OR product_title ILIKE '%silk%')::int as silk,
      COUNT(*) FILTER (WHERE finish_type ILIKE '%metallic%' OR finish_type ILIKE '%metal%' OR product_title ILIKE '%metallic%')::int as metallic,
      COUNT(*) FILTER (WHERE finish_type ILIKE '%sparkle%' OR finish_type ILIKE '%glitter%' OR finish_type ILIKE '%galaxy%' OR product_title ILIKE '%sparkle%' OR product_title ILIKE '%glitter%')::int as sparkle,
      COUNT(*) FILTER (WHERE finish_type ILIKE '%translucent%' OR finish_type ILIKE '%transparent%' OR product_title ILIKE '%translucent%')::int as translucent,
      COUNT(*) FILTER (WHERE material ILIKE '%glow%' OR product_title ILIKE '%glow%')::int as glow,
      COUNT(*) FILTER (WHERE finish_type = 'Carbon' OR (carbon_fiber_percentage IS NOT NULL AND carbon_fiber_percentage > 0))::int as carbon_fiber,
      COUNT(*) FILTER (WHERE finish_type ILIKE '%glass%' OR (glass_fiber_percentage IS NOT NULL AND glass_fiber_percentage > 0))::int as glass_fiber,
      COUNT(*) FILTER (WHERE finish_type = 'Wood' OR (wood_powder_percentage IS NOT NULL AND wood_powder_percentage > 0))::int as wood_filled,
      COUNT(*) FILTER (WHERE high_speed_capable = true OR product_title ILIKE '%high speed%')::int as high_speed,
      COUNT(*) FILTER (WHERE is_nozzle_abrasive = false)::int as brass_only,
      COUNT(*) FILTER (WHERE material IS NOT NULL AND (
        UPPER(material) LIKE '%PLA%' OR UPPER(material) LIKE '%PETG%' OR UPPER(material) LIKE '%ABS%'
        OR UPPER(material) LIKE '%ASA%' OR UPPER(material) LIKE '%TPU%' OR UPPER(material) LIKE '%HIPS%')
        AND UPPER(material) NOT LIKE '%PEEK%' AND UPPER(material) NOT LIKE '%PPS%')::int as ams_only,
      COUNT(*) FILTER (WHERE net_weight_g IS NOT NULL AND net_weight_g >= 1000)::int as large_spools,
      COUNT(*) FILTER (WHERE transmission_distance IS NOT NULL)::int as has_td_data,
      COUNT(*)::int as total
    FROM full_filtered
  )
  SELECT jsonb_build_object(
    'materials', COALESCE((SELECT jsonb_object_agg(material, cnt) FROM material_counts), '{}'::jsonb),
    'brands', COALESCE((SELECT jsonb_object_agg(vendor, cnt) FROM brand_counts), '{}'::jsonb),
    'filters', (SELECT row_to_json(bool_counts.*)::jsonb FROM bool_counts),
    'total', (SELECT total FROM bool_counts)
  ) INTO v_result;
  RETURN v_result;
END;
$function$;

-- ============================================================
-- 5. get_filament_regional_prices
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_filament_regional_prices(
  p_filament_id UUID,
  p_user_region TEXT DEFAULT 'US'
)
RETURNS TABLE (
  store_name TEXT,
  store_slug TEXT,
  store_type TEXT,
  region TEXT,
  country_code TEXT,
  price_cents INTEGER,
  price_local NUMERIC,
  price_display TEXT,
  currency_code TEXT,
  currency_symbol TEXT,
  product_url TEXT,
  is_local_store BOOLEAN,
  ships_to_user BOOLEAN,
  ships_from TEXT[],
  converted_price BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_currency TEXT;
  v_user_rate NUMERIC;
  v_user_symbol TEXT;
BEGIN
  -- Get user's currency info from region_config
  SELECT rc.currency_code, er.rate_to_usd, er.currency_symbol
  INTO v_user_currency, v_user_rate, v_user_symbol
  FROM region_config rc
  JOIN exchange_rates er ON er.currency_code = rc.currency_code
  WHERE rc.region_code = p_user_region;

  -- Default to USD if region not found
  IF v_user_currency IS NULL THEN
    v_user_currency := 'USD';
    v_user_rate := 1.0;
    v_user_symbol := '$';
  END IF;

  RETURN QUERY
  SELECT
    s.name AS store_name,
    s.slug AS store_slug,
    s.store_type,
    s.region,
    s.country_code,
    fp.price_cents,
    -- Convert to user's currency
    ROUND(
      (fp.price_cents::NUMERIC / 100) *
      (er.rate_to_usd / v_user_rate),
      2
    ) AS price_local,
    -- Format for display with currency symbol
    v_user_symbol || ROUND(
      (fp.price_cents::NUMERIC / 100) *
      (er.rate_to_usd / v_user_rate),
      2
    )::TEXT AS price_display,
    fp.currency_code,
    er.currency_symbol,
    COALESCE(fp.affiliate_url, fp.product_url) AS product_url,
    (s.region = p_user_region) AS is_local_store,
    (p_user_region = ANY(s.ships_to) OR 'GLOBAL' = ANY(s.ships_to)) AS ships_to_user,
    s.ships_from,
    (fp.currency_code != v_user_currency) AS converted_price
  FROM filament_prices fp
  JOIN stores s ON s.id = fp.store_id
  JOIN exchange_rates er ON er.currency_code = fp.currency_code
  WHERE fp.filament_id = p_filament_id
    AND fp.in_stock = true
    AND s.is_active = true
  ORDER BY
    (s.region = p_user_region) DESC,
    (p_user_region = ANY(s.ships_to)) DESC,
    ROUND((fp.price_cents::NUMERIC / 100) * (er.rate_to_usd / v_user_rate), 2) ASC;
END;
$$;

-- ============================================================
-- 6. get_best_listing
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_best_listing(
    _filament_id uuid,
    _region text DEFAULT 'US',
    _currency text DEFAULT 'USD'
)
RETURNS TABLE (
    listing_id uuid,
    retailer_name text,
    retailer_slug text,
    current_price numeric,
    product_url text,
    available boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        fl.id,
        r.name,
        r.slug,
        fl.current_price,
        fl.product_url,
        fl.available
    FROM filament_listings fl
    JOIN retailers r ON r.id = fl.retailer_id
    WHERE fl.filament_id = _filament_id
      AND fl.region = _region
      AND fl.currency = _currency
      AND fl.available = true
      AND fl.current_price IS NOT NULL
    ORDER BY fl.current_price ASC
    LIMIT 1;
$$;

-- ============================================================
-- 7. should_refresh_exchange_rates
-- ============================================================
CREATE OR REPLACE FUNCTION public.should_refresh_exchange_rates()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM exchange_rates
    WHERE currency_code != 'USD'
    AND updated_at < NOW() - INTERVAL '24 hours'
    LIMIT 1
  ) OR NOT EXISTS (
    SELECT 1 FROM exchange_rates WHERE currency_code = 'CAD'
  );
$$;

-- ============================================================
-- 8. get_td_coverage_stats
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_td_coverage_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total bigint;
  v_with_td bigint;
  v_ref_count bigint;
  v_by_material jsonb;
  v_by_brand jsonb;
  v_top_gaps_brand jsonb;
  v_top_gaps_material jsonb;
  v_recent_logs jsonb;
BEGIN
  -- Overall counts
  SELECT COUNT(*), COUNT(transmission_distance)
  INTO v_total, v_with_td
  FROM filaments;

  -- Reference count
  SELECT COUNT(*) INTO v_ref_count FROM td_reference_values;

  -- By material (top 15)
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  INTO v_by_material
  FROM (
    SELECT
      COALESCE(material, 'Unknown') as material,
      COUNT(*)::int as total,
      COUNT(transmission_distance)::int as with_td,
      ROUND(COUNT(transmission_distance)::numeric / NULLIF(COUNT(*), 0) * 100, 1)::numeric as pct
    FROM filaments
    GROUP BY material
    ORDER BY COUNT(*) DESC
    LIMIT 15
  ) t;

  -- By brand (top 10)
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  INTO v_by_brand
  FROM (
    SELECT
      COALESCE(vendor, 'Unknown') as brand,
      COUNT(*)::int as total,
      COUNT(transmission_distance)::int as with_td,
      ROUND(COUNT(transmission_distance)::numeric / NULLIF(COUNT(*), 0) * 100, 1)::numeric as pct
    FROM filaments
    GROUP BY vendor
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) t;

  -- Top 5 brands with most missing TD
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  INTO v_top_gaps_brand
  FROM (
    SELECT
      COALESCE(vendor, 'Unknown') as brand,
      COUNT(*)::int as total,
      (COUNT(*) - COUNT(transmission_distance))::int as missing
    FROM filaments
    GROUP BY vendor
    ORDER BY (COUNT(*) - COUNT(transmission_distance)) DESC
    LIMIT 5
  ) t;

  -- Top 5 materials with lowest coverage (that have >10 filaments)
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  INTO v_top_gaps_material
  FROM (
    SELECT
      COALESCE(material, 'Unknown') as material,
      COUNT(*)::int as total,
      (COUNT(*) - COUNT(transmission_distance))::int as missing,
      ROUND(COUNT(transmission_distance)::numeric / NULLIF(COUNT(*), 0) * 100, 1)::numeric as pct
    FROM filaments
    GROUP BY material
    HAVING COUNT(*) > 10
    ORDER BY (COUNT(transmission_distance)::numeric / NULLIF(COUNT(*), 0)) ASC
    LIMIT 5
  ) t;

  -- Recent logs (last 50 entries)
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  INTO v_recent_logs
  FROM (
    SELECT
      created_at,
      source,
      confidence,
      status,
      td_value,
      notes
    FROM td_population_log
    ORDER BY created_at DESC
    LIMIT 50
  ) t;

  RETURN jsonb_build_object(
    'total_filaments', v_total,
    'with_td', v_with_td,
    'missing_td', v_total - v_with_td,
    'coverage_pct', CASE WHEN v_total > 0 THEN ROUND(v_with_td::numeric / v_total * 100, 1) ELSE 0 END,
    'reference_count', v_ref_count,
    'by_material', v_by_material,
    'by_brand', v_by_brand,
    'top_gaps_brand', v_top_gaps_brand,
    'top_gaps_material', v_top_gaps_material,
    'recent_logs', v_recent_logs
  );
END;
$function$;

-- ============================================================
-- 9. get_td_reference_match_stats
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_td_reference_match_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(row_data) INTO result
  FROM (
    SELECT jsonb_build_object(
      'ref_id', r.id,
      'matched_count', COALESCE(m.matched_count, 0),
      'brand_total', COALESCE(bt.brand_total, 0),
      'brand_with_td', COALESCE(bt.brand_with_td, 0)
    ) AS row_data
    FROM td_reference_values r
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS matched_count
      FROM filaments f
      WHERE LOWER(f.vendor) = LOWER(r.brand_name)
        AND f.transmission_distance = r.td_value
        AND LOWER(COALESCE(f.material, '')) = LOWER(r.material_type)
        AND (
          LOWER(COALESCE(f.color_family, '')) = LOWER(r.color_name)
          OR f.product_title ILIKE '%' || r.color_name || '%'
        )
    ) m ON true
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS brand_total,
        COUNT(f.transmission_distance)::int AS brand_with_td
      FROM filaments f
      WHERE LOWER(f.vendor) = LOWER(r.brand_name)
        AND LOWER(COALESCE(f.material, '')) = LOWER(r.material_type)
    ) bt ON true
  ) sub;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;

-- ============================================================
-- 10. match_td_reference_values
-- ============================================================
CREATE OR REPLACE FUNCTION public.match_td_reference_values(
  p_dry_run BOOLEAN DEFAULT true,
  p_brand_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  filament_id UUID,
  vendor TEXT,
  product_title TEXT,
  color_family TEXT,
  material TEXT,
  ref_brand TEXT,
  ref_color TEXT,
  ref_material TEXT,
  td_value NUMERIC,
  confidence TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If not dry run, apply updates first
  IF NOT p_dry_run THEN
    UPDATE filaments f
    SET transmission_distance = sub.td_value,
        updated_at = NOW()
    FROM (
      SELECT DISTINCT ON (f2.id)
        f2.id,
        r2.td_value
      FROM filaments f2
      JOIN td_reference_values r2 ON (
        f2.vendor ILIKE '%' || r2.brand_name || '%'
        AND f2.color_family ILIKE r2.color_name
        AND (
          (r2.material_type LIKE '% %' AND f2.product_title ILIKE '%' || r2.material_type || '%')
          OR
          (r2.material_type NOT LIKE '% %' AND LOWER(f2.material) = LOWER(r2.material_type))
        )
      )
      WHERE f2.transmission_distance IS NULL
        AND (p_brand_filter IS NULL OR f2.vendor ILIKE '%' || p_brand_filter || '%')
      ORDER BY f2.id, r2.td_value
    ) sub
    WHERE f.id = sub.id;
  END IF;

  -- Return matching results
  RETURN QUERY
  SELECT DISTINCT ON (f.id)
    f.id AS filament_id,
    f.vendor,
    f.product_title,
    f.color_family,
    f.material,
    r.brand_name AS ref_brand,
    r.color_name AS ref_color,
    r.material_type AS ref_material,
    r.td_value,
    CASE
      WHEN f.vendor ILIKE r.brand_name
           AND f.color_family ILIKE r.color_name
           AND f.product_title ILIKE '%' || r.material_type || '%'
      THEN 'high'
      WHEN f.vendor ILIKE '%' || r.brand_name || '%'
           AND f.color_family ILIKE '%' || r.color_name || '%'
      THEN 'medium'
      ELSE 'low'
    END AS confidence
  FROM filaments f
  JOIN td_reference_values r ON (
    f.vendor ILIKE '%' || r.brand_name || '%'
    AND f.color_family ILIKE r.color_name
    AND (
      (r.material_type LIKE '% %' AND f.product_title ILIKE '%' || r.material_type || '%')
      OR
      (r.material_type NOT LIKE '% %' AND LOWER(f.material) = LOWER(r.material_type))
    )
  )
  WHERE (p_dry_run AND f.transmission_distance IS NULL OR NOT p_dry_run)
    AND (p_brand_filter IS NULL OR f.vendor ILIKE '%' || p_brand_filter || '%')
  ORDER BY f.id, confidence;
END;
$$;

-- ============================================================
-- 11. get_brand_region_coverage
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_brand_region_coverage()
RETURNS TABLE (
  brand_slug text,
  display_name text,
  logo_url text,
  region_code text,
  total_products bigint,
  with_urls bigint,
  with_prices bigint,
  last_sync_at timestamptz,
  success_rate numeric
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH brand_products AS (
    SELECT
      'filament' as product_type,
      f.id as product_id,
      f.vendor as brand_slug
    FROM filaments f
    WHERE f.vendor IS NOT NULL
    UNION ALL
    SELECT
      'printer' as product_type,
      p.id as product_id,
      pb.brand as brand_slug
    FROM printers p
    JOIN printer_brands pb ON pb.id = p.brand_id
    WHERE p.brand_id IS NOT NULL
  ),
  all_regions AS (
    SELECT DISTINCT region_code FROM product_regional_urls
  )
  SELECT
    ab.brand_slug,
    ab.display_name,
    ab.logo_url,
    ar.region_code::text,
    COUNT(DISTINCT bp.product_id)::bigint as total_products,
    COUNT(DISTINCT pru.product_id)::bigint as with_urls,
    COUNT(DISTINCT CASE WHEN prp.current_price IS NOT NULL THEN prp.product_id END)::bigint as with_prices,
    MAX(prp.last_sync_at) as last_sync_at,
    ROUND(
      COALESCE(
        COUNT(DISTINCT CASE WHEN prp.last_sync_status = 'success' THEN prp.product_id END)::numeric /
        NULLIF(COUNT(DISTINCT pru.product_id), 0) * 100,
        0
      ),
      1
    ) as success_rate
  FROM automated_brands ab
  CROSS JOIN all_regions ar
  LEFT JOIN brand_products bp ON bp.brand_slug = ab.brand_slug
  LEFT JOIN product_regional_urls pru ON pru.product_id = bp.product_id
    AND pru.product_type = bp.product_type
    AND pru.region_code = ar.region_code
  LEFT JOIN product_regional_prices prp ON prp.product_id = bp.product_id
    AND prp.product_type = bp.product_type
    AND prp.region_code = ar.region_code
  WHERE ab.scraping_enabled = true
  GROUP BY ab.brand_slug, ab.display_name, ab.logo_url, ar.region_code
  ORDER BY ab.display_name, ar.region_code;
$$;

-- ============================================================
-- 12. get_missing_regional_urls
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_missing_regional_urls(limit_count integer DEFAULT 50)
RETURNS TABLE (
  product_id uuid,
  product_type text,
  product_name text,
  brand_slug text,
  has_regions text[],
  missing_regions text[]
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH all_regions AS (
    SELECT DISTINCT region_code FROM product_regional_urls
  ),
  product_regions AS (
    SELECT
      pru.product_id,
      pru.product_type,
      ARRAY_AGG(DISTINCT pru.region_code ORDER BY pru.region_code) as has_regions
    FROM product_regional_urls pru
    GROUP BY pru.product_id, pru.product_type
  ),
  products_with_partial_coverage AS (
    SELECT
      pr.product_id,
      pr.product_type,
      pr.has_regions,
      ARRAY(
        SELECT ar.region_code
        FROM all_regions ar
        WHERE ar.region_code != ALL(pr.has_regions)
        ORDER BY ar.region_code
      ) as missing_regions
    FROM product_regions pr
    WHERE ARRAY_LENGTH(pr.has_regions, 1) < (SELECT COUNT(*) FROM all_regions)
  )
  SELECT
    pwpc.product_id,
    pwpc.product_type,
    COALESCE(
      CASE WHEN pwpc.product_type = 'filament' THEN f.display_name ELSE NULL END,
      CASE WHEN pwpc.product_type = 'filament' THEN f.product_title ELSE NULL END,
      CASE WHEN pwpc.product_type = 'printer' THEN p.display_name ELSE NULL END,
      CASE WHEN pwpc.product_type = 'printer' THEN p.model_name ELSE NULL END,
      'Unknown'
    ) as product_name,
    COALESCE(
      CASE WHEN pwpc.product_type = 'filament' THEN f.vendor ELSE NULL END,
      CASE WHEN pwpc.product_type = 'printer' THEN pb.brand ELSE NULL END
    ) as brand_slug,
    pwpc.has_regions,
    pwpc.missing_regions
  FROM products_with_partial_coverage pwpc
  LEFT JOIN filaments f ON pwpc.product_type = 'filament' AND f.id = pwpc.product_id
  LEFT JOIN printers p ON pwpc.product_type = 'printer' AND p.id = pwpc.product_id
  LEFT JOIN printer_brands pb ON pwpc.product_type = 'printer' AND pb.id = p.brand_id
  WHERE ARRAY_LENGTH(pwpc.missing_regions, 1) > 0
  ORDER BY ARRAY_LENGTH(pwpc.has_regions, 1) DESC, product_name
  LIMIT limit_count;
$$;

-- ============================================================
-- 13. get_regional_failed_syncs
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_regional_failed_syncs()
RETURNS TABLE (
  region_code text,
  product_id uuid,
  product_type text,
  product_name text,
  brand_slug text,
  store_url text,
  last_sync_error text,
  last_sync_at timestamptz
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    prp.region_code::text,
    prp.product_id,
    prp.product_type,
    COALESCE(
      CASE WHEN prp.product_type = 'filament' THEN f.display_name ELSE NULL END,
      CASE WHEN prp.product_type = 'filament' THEN f.product_title ELSE NULL END,
      CASE WHEN prp.product_type = 'printer' THEN p.display_name ELSE NULL END,
      CASE WHEN prp.product_type = 'printer' THEN p.model_name ELSE NULL END,
      'Unknown'
    ) as product_name,
    COALESCE(
      CASE WHEN prp.product_type = 'filament' THEN f.vendor ELSE NULL END,
      CASE WHEN prp.product_type = 'printer' THEN pb.brand ELSE NULL END
    ) as brand_slug,
    pru.store_url,
    prp.last_sync_error,
    prp.last_sync_at
  FROM product_regional_prices prp
  LEFT JOIN product_regional_urls pru ON pru.product_id = prp.product_id
    AND pru.product_type = prp.product_type
    AND pru.region_code = prp.region_code
  LEFT JOIN filaments f ON prp.product_type = 'filament' AND f.id = prp.product_id
  LEFT JOIN printers p ON prp.product_type = 'printer' AND p.id = prp.product_id
  LEFT JOIN printer_brands pb ON prp.product_type = 'printer' AND pb.id = p.brand_id
  WHERE prp.last_sync_status = 'failed'
  ORDER BY prp.region_code, prp.last_sync_at DESC NULLS LAST;
$$;

-- ============================================================
-- 14. get_price_conflicts -- SKIPPED: depends on v_canonical_prices
-- ============================================================
/* SKIPPED - depends on v_canonical_prices
CREATE OR REPLACE FUNCTION public.get_price_conflicts(p_limit int DEFAULT 50)
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
END OF SKIPPED get_price_conflicts */

-- ============================================================
-- 15. get_three_way_price_conflicts
-- ============================================================
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

-- ============================================================
-- 16. refresh_canonical_prices
-- SKIPPED: depends on v_canonical_prices materialized view
-- which needs a separate migration with all dependent columns
-- ============================================================

-- ============================================================
-- 17. get_table_row_counts
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_table_row_counts()
RETURNS TABLE (table_name text, row_count bigint, has_rls boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec RECORD;
  cnt bigint;
  rls boolean;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  FOR rec IN
    SELECT t.table_name AS tname
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', rec.tname) INTO cnt;

    SELECT pt.rowsecurity INTO rls
    FROM pg_tables pt
    WHERE pt.schemaname = 'public' AND pt.tablename = rec.tname;

    table_name := rec.tname;
    row_count := cnt;
    has_rls := COALESCE(rls, false);
    RETURN NEXT;
  END LOOP;
END;
$$;

-- ============================================================
-- 18. v_public_brands view (latest version with product_line_count)
-- ============================================================
DROP VIEW IF EXISTS public.v_public_brands;

CREATE VIEW public.v_public_brands AS
SELECT
  id,
  brand_name,
  brand_slug,
  display_name,
  description,
  logo_url,
  website_url,
  color_primary,
  color_secondary,
  featured,
  display_order,
  is_visible,
  product_count,
  product_line_count,
  active_product_count
FROM automated_brands
WHERE is_visible = true;

-- Set security_invoker so the view respects the querying user's RLS policies
ALTER VIEW public.v_public_brands SET (security_invoker = on);

-- ============================================================
-- 19. exchange_rate_status view
-- ============================================================
CREATE OR REPLACE VIEW public.exchange_rate_status AS
SELECT
  er.currency_code,
  er.currency_name,
  er.currency_symbol,
  er.rate_to_usd,
  er.updated_at,
  CASE
    WHEN er.updated_at > NOW() - INTERVAL '25 hours' THEN 'fresh'
    WHEN er.updated_at > NOW() - INTERVAL '3 days' THEN 'stale'
    ELSE 'outdated'
  END as status,
  EXTRACT(EPOCH FROM (NOW() - er.updated_at)) / 3600 as hours_since_update
FROM exchange_rates er
ORDER BY er.currency_code;

ALTER VIEW public.exchange_rate_status SET (security_invoker = on);

-- ============================================================
-- 20. td_community_stats view
-- ============================================================
CREATE OR REPLACE VIEW public.td_community_stats AS
SELECT
  f.id as filament_id,
  f.transmission_distance as official_td,
  COUNT(DISTINCT ts.id) FILTER (WHERE ts.status = 'approved') as submission_count,
  AVG(ts.submitted_td_value) FILTER (WHERE ts.status = 'approved') as community_avg_td,
  STDDEV(ts.submitted_td_value) FILTER (WHERE ts.status = 'approved') as community_td_stddev,
  COUNT(DISTINCT tv.id) as verification_count,
  COUNT(DISTINCT tv.id) FILTER (WHERE tv.vote = 'accurate') as accurate_votes,
  COUNT(DISTINCT tv.id) FILTER (WHERE tv.vote = 'too_high') as too_high_votes,
  COUNT(DISTINCT tv.id) FILTER (WHERE tv.vote = 'too_low') as too_low_votes
FROM public.filaments f
LEFT JOIN public.td_submissions ts ON f.id = ts.filament_id
LEFT JOIN public.td_verifications tv ON f.id = tv.filament_id
GROUP BY f.id, f.transmission_distance;

-- ============================================================
-- GRANT statements for anon and authenticated roles
-- ============================================================

-- RPC functions accessible to both anon and authenticated
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_catalog_counts TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_catalog_counts_by_brand TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_filter_counts TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_filament_regional_prices TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_best_listing TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.should_refresh_exchange_rates TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_td_coverage_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_td_reference_match_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_td_reference_values TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_brand_region_coverage TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_missing_regional_urls TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_regional_failed_syncs TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.get_price_conflicts TO authenticated; -- SKIPPED
GRANT EXECUTE ON FUNCTION public.get_three_way_price_conflicts TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.refresh_canonical_prices TO authenticated; -- SKIPPED
GRANT EXECUTE ON FUNCTION public.get_table_row_counts TO authenticated;

-- Views accessible to both anon and authenticated
GRANT SELECT ON public.v_public_brands TO anon, authenticated;
GRANT SELECT ON public.exchange_rate_status TO anon, authenticated;
GRANT SELECT ON public.td_community_stats TO anon, authenticated;

-- ============================================================
-- Fix user_roles RLS: drop overly permissive policies, create proper ones
-- ============================================================

-- Drop all existing policies on user_roles to start clean
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role full access to user_roles" ON public.user_roles;

-- Recreate proper SELECT policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only INSERT/UPDATE/DELETE (no overly permissive FOR ALL)
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- Add FK constraint: amazon_product_mappings -> filaments
-- ============================================================
-- The table already has the FK in its CREATE TABLE, but add it
-- defensively in case it was dropped or the table was altered.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'amazon_product_mappings_filament_id_fkey'
      AND table_name = 'amazon_product_mappings'
  ) THEN
    ALTER TABLE public.amazon_product_mappings
      ADD CONSTRAINT amazon_product_mappings_filament_id_fkey
      FOREIGN KEY (filament_id) REFERENCES public.filaments(id) ON DELETE CASCADE;
  END IF;
END $$;
