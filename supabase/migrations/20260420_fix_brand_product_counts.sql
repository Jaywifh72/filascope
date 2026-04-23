-- =====================================================
-- MIGRATION: Fix update_brand_product_counts to count images, TDS, color, MPN
-- Created: 2026-04-20
-- Purpose: The function exists but only counts URLs and prices.
--          Products with images, TDS, color_hex, and MPN are tracked
--          in automated_brands columns but never populated.
-- =====================================================

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
      product_count = COALESCE(counts.total, 0),
      product_line_count = COALESCE(counts.unique_lines, 0),
      active_product_count = COALESCE(counts.active, 0),
      products_with_urls = COALESCE(counts.with_urls, 0),
      products_with_prices = COALESCE(counts.with_prices, 0),
      products_with_images = COALESCE(counts.with_images, 0),
      products_with_tds = COALESCE(counts.with_tds, 0),
      products_with_color_hex = COALESCE(counts.with_color_hex, 0),
      products_with_mpn = COALESCE(counts.with_mpn, 0)
    FROM (
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT product_line_id) as unique_lines,
        COUNT(CASE WHEN variant_available = true THEN 1 END) as active,
        COUNT(CASE WHEN product_url IS NOT NULL OR product_url_eu IS NOT NULL OR product_url_ca IS NOT NULL OR product_url_uk IS NOT NULL OR product_url_au IS NOT NULL OR product_url_jp IS NOT NULL THEN 1 END) as with_urls,
        COUNT(CASE WHEN variant_price IS NOT NULL OR price_eur IS NOT NULL OR price_cad IS NOT NULL OR price_gbp IS NOT NULL OR price_aud IS NOT NULL OR price_jpy IS NOT NULL THEN 1 END) as with_prices,
        COUNT(CASE WHEN featured_image IS NOT NULL AND featured_image != '' THEN 1 END) as with_images,
        COUNT(CASE WHEN tds_url IS NOT NULL AND tds_url != '' THEN 1 END) as with_tds,
        COUNT(CASE WHEN color_hex IS NOT NULL AND color_hex != '' THEN 1 END) as with_color_hex,
        COUNT(CASE WHEN mpn IS NOT NULL AND mpn != '' THEN 1 END) as with_mpn
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
      products_with_prices = COALESCE(counts.with_prices, 0),
      products_with_images = COALESCE(counts.with_images, 0),
      products_with_tds = COALESCE(counts.with_tds, 0),
      products_with_color_hex = COALESCE(counts.with_color_hex, 0),
      products_with_mpn = COALESCE(counts.with_mpn, 0)
    FROM (
      SELECT 
        ab2.id,
        COUNT(f.*) as total,
        COUNT(DISTINCT f.product_line_id) as unique_lines,
        COUNT(CASE WHEN f.variant_available = true THEN 1 END) as active,
        COUNT(CASE WHEN f.product_url IS NOT NULL OR f.product_url_eu IS NOT NULL OR f.product_url_ca IS NOT NULL OR f.product_url_uk IS NOT NULL OR f.product_url_au IS NOT NULL OR f.product_url_jp IS NOT NULL THEN 1 END) as with_urls,
        COUNT(CASE WHEN f.variant_price IS NOT NULL OR f.price_eur IS NOT NULL OR f.price_cad IS NOT NULL OR f.price_gbp IS NOT NULL OR f.price_aud IS NOT NULL OR f.price_jpy IS NOT NULL THEN 1 END) as with_prices,
        COUNT(CASE WHEN f.featured_image IS NOT NULL AND f.featured_image != '' THEN 1 END) as with_images,
        COUNT(CASE WHEN f.tds_url IS NOT NULL AND f.tds_url != '' THEN 1 END) as with_tds,
        COUNT(CASE WHEN f.color_hex IS NOT NULL AND f.color_hex != '' THEN 1 END) as with_color_hex,
        COUNT(CASE WHEN f.mpn IS NOT NULL AND f.mpn != '' THEN 1 END) as with_mpn
      FROM automated_brands ab2
      LEFT JOIN filaments f ON LOWER(f.vendor) = LOWER(ab2.brand_name)
      GROUP BY ab2.id
    ) counts
    WHERE ab.id = counts.id;
  END IF;
END;
$function$;

-- Also update enrichment counts function to track more fields
CREATE OR REPLACE FUNCTION public.update_brand_enrichment_counts(p_brand_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE automated_brands ab
  SET 
    products_with_codes = COALESCE(counts.with_codes, 0),
    products_with_amazon_links = COALESCE(counts.with_amazon, 0),
    products_with_amazon_prices = COALESCE(counts.with_amazon_prices, 0)
  FROM (
    SELECT 
      COUNT(CASE WHEN product_id IS NOT NULL AND product_id != '' THEN 1 END) as with_codes,
      COUNT(CASE WHEN product_url_amazon IS NOT NULL AND product_url_amazon != '' THEN 1 END) as with_amazon,
      COUNT(CASE WHEN price_usd_amazon IS NOT NULL THEN 1 END) as with_amazon_prices
    FROM filaments
    WHERE LOWER(vendor) = LOWER((SELECT brand_name FROM automated_brands WHERE brand_slug = p_brand_slug))
  ) counts
  WHERE ab.brand_slug = p_brand_slug;
END;
$function$;

COMMENT ON FUNCTION public.update_brand_product_counts IS 'Updates product count columns in automated_brands including images, TDS, color hex, and MPN counts.';
COMMENT ON FUNCTION public.update_brand_enrichment_counts IS 'Updates enrichment count columns (codes, Amazon links/prices) in automated_brands.';
