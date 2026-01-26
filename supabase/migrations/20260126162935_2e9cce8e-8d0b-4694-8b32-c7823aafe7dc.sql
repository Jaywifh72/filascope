-- Create function to get brand x region coverage stats (fixed for printer schema)
CREATE OR REPLACE FUNCTION get_brand_region_coverage()
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
) AS $$
  WITH brand_products AS (
    -- Get all filament products for each brand
    SELECT 
      'filament' as product_type,
      f.id as product_id,
      f.vendor as brand_slug
    FROM filaments f
    WHERE f.vendor IS NOT NULL
    UNION ALL
    -- Get all printer products - join with printer_brands to get brand name
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
$$ LANGUAGE SQL STABLE;

-- Create function to get products with missing regional URLs (fixed for printer schema)
CREATE OR REPLACE FUNCTION get_missing_regional_urls(limit_count integer DEFAULT 50)
RETURNS TABLE (
  product_id uuid,
  product_type text,
  product_name text,
  brand_slug text,
  has_regions text[],
  missing_regions text[]
) AS $$
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
$$ LANGUAGE SQL STABLE;

-- Create function to get failed regional syncs grouped by region (fixed for printer schema)
CREATE OR REPLACE FUNCTION get_regional_failed_syncs()
RETURNS TABLE (
  region_code text,
  product_id uuid,
  product_type text,
  product_name text,
  brand_slug text,
  store_url text,
  last_sync_error text,
  last_sync_at timestamptz
) AS $$
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
$$ LANGUAGE SQL STABLE;