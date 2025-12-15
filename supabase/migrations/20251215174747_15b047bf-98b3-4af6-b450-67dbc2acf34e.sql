-- Fix views to explicitly use SECURITY INVOKER (resolves linter warnings)
DROP VIEW IF EXISTS v_active_brands;
DROP VIEW IF EXISTS v_brand_scraping_stats;

-- Recreate v_active_brands with explicit SECURITY INVOKER
CREATE VIEW v_active_brands WITH (security_invoker = true) AS
SELECT 
  ab.id,
  ab.brand_name,
  ab.brand_slug,
  ab.display_name,
  ab.logo_url,
  ab.website_url,
  ab.platform_type,
  ab.scraping_enabled,
  ab.scraping_active,
  ab.last_scrape_at,
  ab.product_count,
  ab.featured,
  ab.display_order,
  ab.color_primary,
  COUNT(f.id) as actual_product_count,
  COUNT(CASE WHEN f.product_url IS NOT NULL THEN 1 END) as actual_products_with_urls,
  COUNT(CASE WHEN f.variant_price IS NOT NULL THEN 1 END) as products_with_prices,
  MAX(f.last_external_sync_at) as last_product_sync,
  AVG(f.variant_price) FILTER (WHERE f.variant_price IS NOT NULL) as avg_product_price
FROM automated_brands ab
LEFT JOIN filaments f ON LOWER(f.vendor) = LOWER(ab.brand_name)
WHERE ab.is_visible = true
GROUP BY ab.id, ab.brand_name, ab.brand_slug, ab.display_name, ab.logo_url, 
         ab.website_url, ab.platform_type, ab.scraping_enabled, ab.scraping_active,
         ab.last_scrape_at, ab.product_count, ab.featured, ab.display_order, ab.color_primary
ORDER BY ab.display_order, ab.brand_name;

-- Recreate v_brand_scraping_stats with explicit SECURITY INVOKER
CREATE VIEW v_brand_scraping_stats WITH (security_invoker = true) AS
SELECT 
  ab.brand_name,
  ab.brand_slug,
  ab.platform_type,
  ab.scraping_enabled,
  ab.scraping_active,
  ab.total_scrapes,
  ab.successful_scrapes,
  ab.failed_scrapes,
  CASE 
    WHEN ab.total_scrapes > 0 THEN ROUND((ab.successful_scrapes::numeric / ab.total_scrapes) * 100, 1)
    ELSE 0
  END as success_rate_percent,
  ab.avg_scrape_duration_seconds,
  ab.last_scrape_at,
  ab.next_scrape_at,
  ab.last_error,
  ab.last_error_at
FROM automated_brands ab
WHERE ab.scraping_enabled = true
ORDER BY ab.last_scrape_at DESC NULLS LAST;