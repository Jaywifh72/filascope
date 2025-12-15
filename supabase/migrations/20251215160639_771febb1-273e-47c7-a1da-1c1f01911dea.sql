
-- Fix SECURITY DEFINER views by recreating with SECURITY INVOKER
-- ============================================================================

-- Drop and recreate views with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.recent_price_drops;
DROP VIEW IF EXISTS public.price_trends_90d;
DROP VIEW IF EXISTS public.all_time_low_prices;

-- View: Recent price drops (with SECURITY INVOKER)
CREATE VIEW public.recent_price_drops 
WITH (security_invoker = true)
AS
SELECT 
  f.id as filament_id,
  f.product_id,
  f.product_title,
  f.vendor,
  f.material,
  f.variant_price as current_price,
  ph_old.price as old_price,
  f.variant_price - ph_old.price as price_change,
  ROUND(((f.variant_price - ph_old.price) / NULLIF(ph_old.price, 0) * 100)::numeric, 1) as percent_change,
  ph_old.recorded_at as previous_price_date,
  f.product_url
FROM filaments f
JOIN LATERAL (
  SELECT price, recorded_at
  FROM price_history
  WHERE filament_id = f.id
    AND recorded_at < NOW() - INTERVAL '1 day'
    AND recorded_at > NOW() - INTERVAL '30 days'
  ORDER BY recorded_at DESC
  LIMIT 1
) ph_old ON true
WHERE f.variant_price < ph_old.price
  AND f.variant_price IS NOT NULL
  AND ph_old.price > 0
ORDER BY percent_change ASC;

-- View: Price trends 90d (with SECURITY INVOKER)
CREATE VIEW public.price_trends_90d 
WITH (security_invoker = true)
AS
SELECT 
  f.id as filament_id,
  f.product_id,
  f.product_title,
  f.vendor,
  f.variant_price as current_price,
  AVG(ph.price) as avg_price_90d,
  MIN(ph.price) as min_price_90d,
  MAX(ph.price) as max_price_90d,
  STDDEV(ph.price) as price_volatility,
  COUNT(DISTINCT DATE(ph.recorded_at)) as days_tracked,
  COUNT(ph.id) as price_samples
FROM filaments f
LEFT JOIN price_history ph ON f.id = ph.filament_id
  AND ph.recorded_at > NOW() - INTERVAL '90 days'
WHERE f.variant_price IS NOT NULL
GROUP BY f.id, f.product_id, f.product_title, f.vendor, f.variant_price
HAVING COUNT(ph.id) > 0;

-- View: All-time low prices (with SECURITY INVOKER)
CREATE VIEW public.all_time_low_prices 
WITH (security_invoker = true)
AS
SELECT 
  f.id as filament_id,
  f.product_id,
  f.product_title,
  f.vendor,
  f.variant_price as current_price,
  ph.min_price as all_time_low,
  f.variant_price - ph.min_price as difference,
  ROUND(((f.variant_price - ph.min_price) / NULLIF(ph.min_price, 0) * 100)::numeric, 1) as percent_above_low,
  f.product_url
FROM filaments f
JOIN LATERAL (
  SELECT MIN(price) as min_price
  FROM price_history
  WHERE filament_id = f.id
) ph ON ph.min_price IS NOT NULL
WHERE f.variant_price IS NOT NULL
  AND ph.min_price > 0
ORDER BY percent_above_low DESC;
