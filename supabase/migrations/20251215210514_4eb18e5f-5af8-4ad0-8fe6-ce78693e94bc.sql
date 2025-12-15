-- Fix SECURITY DEFINER views by recreating them with security_invoker = true

-- Drop and recreate v_brands_overview with security_invoker
DROP VIEW IF EXISTS public.v_brands_overview;
CREATE VIEW public.v_brands_overview 
WITH (security_invoker = true)
AS
SELECT 
  ab.id,
  ab.brand_slug,
  ab.brand_name,
  ab.display_name,
  ab.platform_type,
  ab.scraping_enabled,
  ab.scraping_active,
  ab.auto_create_products,
  ab.product_count,
  ab.active_product_count,
  ab.products_with_urls,
  ab.products_with_prices,
  ab.last_scrape_at,
  ab.next_scrape_at,
  ab.total_scrapes,
  ab.successful_scrapes,
  ab.failed_scrapes,
  CASE 
    WHEN ab.total_scrapes > 0 THEN ROUND((ab.successful_scrapes::numeric / ab.total_scrapes) * 100, 1)
    ELSE 0
  END as success_rate_percent,
  ab.products_created,
  ab.products_updated,
  ab.avg_scrape_duration_seconds,
  ab.last_error,
  ab.last_error_at
FROM automated_brands ab
WHERE ab.is_visible = true
ORDER BY ab.display_order, ab.brand_name;

-- Drop and recreate v_recent_syncs with security_invoker
DROP VIEW IF EXISTS public.v_recent_syncs;
CREATE VIEW public.v_recent_syncs
WITH (security_invoker = true)
AS
SELECT 
  bsl.id,
  bsl.brand_slug,
  ab.display_name,
  ab.platform_type,
  bsl.sync_type,
  bsl.status,
  bsl.started_at,
  bsl.completed_at,
  bsl.duration_seconds,
  bsl.products_discovered,
  bsl.products_created,
  bsl.products_updated,
  bsl.products_failed,
  bsl.price_changes,
  bsl.triggered_by,
  bsl.error_details
FROM brand_sync_logs bsl
LEFT JOIN automated_brands ab ON bsl.brand_id = ab.id
ORDER BY bsl.started_at DESC
LIMIT 100;

-- Drop and recreate v_pending_discoveries with security_invoker
DROP VIEW IF EXISTS public.v_pending_discoveries;
CREATE VIEW public.v_pending_discoveries
WITH (security_invoker = true)
AS
SELECT 
  pdq.id,
  pdq.brand_slug,
  ab.display_name as brand_display_name,
  pdq.product_url,
  pdq.product_title,
  pdq.status,
  pdq.priority,
  pdq.attempts,
  pdq.discovered_at,
  pdq.last_attempt_at,
  pdq.error_message
FROM product_discovery_queue pdq
LEFT JOIN automated_brands ab ON pdq.brand_id = ab.id
WHERE pdq.status = 'pending'
ORDER BY pdq.priority DESC, pdq.discovered_at ASC;