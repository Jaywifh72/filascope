
-- Step 1: Add product_line_count column
ALTER TABLE automated_brands 
  ADD COLUMN IF NOT EXISTS product_line_count integer DEFAULT 0;

-- Step 2: Drop the existing view so we can recreate with new column
DROP VIEW IF EXISTS public.v_public_brands;

-- Step 3: Recreate view with product_line_count
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

-- Step 4: Update the update_brand_product_counts function
CREATE OR REPLACE FUNCTION public.update_brand_product_counts(p_brand_slug text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_brand_slug IS NOT NULL THEN
    UPDATE automated_brands ab
    SET 
      product_count = counts.total,
      product_line_count = counts.unique_lines,
      active_product_count = counts.active,
      products_with_urls = counts.with_urls,
      products_with_prices = counts.with_prices
    FROM (
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT product_line_id) as unique_lines,
        COUNT(CASE WHEN variant_available = true THEN 1 END) as active,
        COUNT(CASE WHEN product_url IS NOT NULL THEN 1 END) as with_urls,
        COUNT(CASE WHEN variant_price IS NOT NULL THEN 1 END) as with_prices
      FROM filaments
      WHERE LOWER(vendor) = LOWER((SELECT brand_name FROM automated_brands WHERE brand_slug = p_brand_slug))
    ) counts
    WHERE ab.brand_slug = p_brand_slug;
  ELSE
    UPDATE automated_brands ab
    SET 
      product_count = COALESCE(counts.total, 0),
      product_line_count = COALESCE(counts.unique_lines, 0),
      active_product_count = COALESCE(counts.active, 0),
      products_with_urls = COALESCE(counts.with_urls, 0),
      products_with_prices = COALESCE(counts.with_prices, 0)
    FROM (
      SELECT 
        ab2.id,
        COUNT(f.*) as total,
        COUNT(DISTINCT f.product_line_id) as unique_lines,
        COUNT(CASE WHEN f.variant_available = true THEN 1 END) as active,
        COUNT(CASE WHEN f.product_url IS NOT NULL THEN 1 END) as with_urls,
        COUNT(CASE WHEN f.variant_price IS NOT NULL THEN 1 END) as with_prices
      FROM automated_brands ab2
      LEFT JOIN filaments f ON LOWER(f.vendor) = LOWER(ab2.brand_name)
      GROUP BY ab2.id
    ) counts
    WHERE ab.id = counts.id;
  END IF;
END;
$function$;

-- Step 5: Create get_catalog_counts RPC
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

-- Step 6: Backfill all brands
SELECT update_brand_product_counts(NULL);
