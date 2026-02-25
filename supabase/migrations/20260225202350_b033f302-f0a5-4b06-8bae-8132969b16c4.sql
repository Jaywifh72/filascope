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
        COUNT(CASE WHEN product_url IS NOT NULL OR product_url_eu IS NOT NULL OR product_url_ca IS NOT NULL OR product_url_uk IS NOT NULL OR product_url_au IS NOT NULL OR product_url_jp IS NOT NULL THEN 1 END) as with_urls,
        COUNT(CASE WHEN variant_price IS NOT NULL OR price_eur IS NOT NULL OR price_cad IS NOT NULL OR price_gbp IS NOT NULL OR price_aud IS NOT NULL OR price_jpy IS NOT NULL THEN 1 END) as with_prices
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
        COUNT(CASE WHEN f.product_url IS NOT NULL OR f.product_url_eu IS NOT NULL OR f.product_url_ca IS NOT NULL OR f.product_url_uk IS NOT NULL OR f.product_url_au IS NOT NULL OR f.product_url_jp IS NOT NULL THEN 1 END) as with_urls,
        COUNT(CASE WHEN f.variant_price IS NOT NULL OR f.price_eur IS NOT NULL OR f.price_cad IS NOT NULL OR f.price_gbp IS NOT NULL OR f.price_aud IS NOT NULL OR f.price_jpy IS NOT NULL THEN 1 END) as with_prices
      FROM automated_brands ab2
      LEFT JOIN filaments f ON LOWER(f.vendor) = LOWER(ab2.brand_name)
      GROUP BY ab2.id
    ) counts
    WHERE ab.id = counts.id;
  END IF;
END;
$function$