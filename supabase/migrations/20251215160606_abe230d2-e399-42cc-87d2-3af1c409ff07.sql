
-- ============================================================================
-- PRICE TRACKING SYSTEM - Enhanced for UUID-based schema
-- ============================================================================

-- 1. ADD NEW COLUMNS TO EXISTING price_history TABLE
-- ============================================================================
ALTER TABLE public.price_history 
ADD COLUMN IF NOT EXISTS variant_id text,
ADD COLUMN IF NOT EXISTS compare_at_price numeric,
ADD COLUMN IF NOT EXISTS available boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS source text DEFAULT 'sync',
ADD COLUMN IF NOT EXISTS notes text;

-- Add composite index for performance
CREATE INDEX IF NOT EXISTS idx_price_history_filament_date 
ON price_history(filament_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_history_source 
ON price_history(source);

-- ============================================================================
-- 2. AUTO-TRIGGER FOR PRICE CHANGES
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.variant_price IS DISTINCT FROM NEW.variant_price) 
     AND NEW.variant_price IS NOT NULL THEN
    INSERT INTO price_history (
      filament_id,
      price,
      region,
      source
    ) VALUES (
      NEW.id,
      NEW.variant_price,
      'US',
      'sync'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS track_price_changes ON filaments;

CREATE TRIGGER track_price_changes
  AFTER UPDATE ON filaments
  FOR EACH ROW
  WHEN (OLD.variant_price IS DISTINCT FROM NEW.variant_price)
  EXECUTE FUNCTION auto_log_price_change();

-- ============================================================================
-- 3. ANALYTICAL VIEWS
-- ============================================================================

-- View: Recent price drops (last 30 days)
CREATE OR REPLACE VIEW public.recent_price_drops AS
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

-- View: Price trends (90-day)
CREATE OR REPLACE VIEW public.price_trends_90d AS
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

-- View: All-time low prices
CREATE OR REPLACE VIEW public.all_time_low_prices AS
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

-- ============================================================================
-- 4. UTILITY FUNCTIONS
-- ============================================================================

-- Function: Get deal alerts (configurable discount threshold)
CREATE OR REPLACE FUNCTION public.get_deal_alerts(min_discount_percent numeric DEFAULT 15)
RETURNS TABLE (
  filament_id uuid,
  product_id text,
  product_title text,
  vendor text,
  old_price numeric,
  new_price numeric,
  savings numeric,
  percent_off numeric,
  product_url text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as filament_id,
    f.product_id,
    f.product_title,
    f.vendor,
    ph_old.price as old_price,
    f.variant_price as new_price,
    ph_old.price - f.variant_price as savings,
    ROUND(((ph_old.price - f.variant_price) / NULLIF(ph_old.price, 0) * 100)::numeric, 1) as percent_off,
    f.product_url
  FROM filaments f
  JOIN LATERAL (
    SELECT price
    FROM price_history
    WHERE price_history.filament_id = f.id
      AND recorded_at < NOW() - INTERVAL '1 day'
    ORDER BY recorded_at DESC
    LIMIT 1
  ) ph_old ON true
  WHERE f.variant_price < ph_old.price
    AND ph_old.price > 0
    AND ((ph_old.price - f.variant_price) / ph_old.price * 100) >= min_discount_percent
    AND f.variant_price IS NOT NULL
  ORDER BY percent_off DESC;
END;
$$;

-- Function: Get price history for a filament
CREATE OR REPLACE FUNCTION public.get_filament_price_history(
  p_filament_id uuid,
  days_back integer DEFAULT 90
)
RETURNS TABLE (
  recorded_at timestamptz,
  price numeric,
  compare_at_price numeric,
  available boolean,
  source text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ph.recorded_at,
    ph.price,
    ph.compare_at_price,
    ph.available,
    ph.source
  FROM price_history ph
  WHERE ph.filament_id = p_filament_id
    AND ph.recorded_at > NOW() - (days_back || ' days')::INTERVAL
  ORDER BY ph.recorded_at DESC;
END;
$$;

-- Function: Get price statistics as JSON
CREATE OR REPLACE FUNCTION public.get_filament_price_stats(p_filament_id uuid)
RETURNS JSON 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'filament_id', p_filament_id,
    'current_price', f.variant_price,
    'avg_30d', (SELECT AVG(price) FROM price_history WHERE filament_id = p_filament_id AND recorded_at > NOW() - INTERVAL '30 days'),
    'min_30d', (SELECT MIN(price) FROM price_history WHERE filament_id = p_filament_id AND recorded_at > NOW() - INTERVAL '30 days'),
    'max_30d', (SELECT MAX(price) FROM price_history WHERE filament_id = p_filament_id AND recorded_at > NOW() - INTERVAL '30 days'),
    'avg_6mo', (SELECT AVG(price) FROM price_history WHERE filament_id = p_filament_id AND recorded_at > NOW() - INTERVAL '6 months'),
    'all_time_low', (SELECT MIN(price) FROM price_history WHERE filament_id = p_filament_id),
    'all_time_high', (SELECT MAX(price) FROM price_history WHERE filament_id = p_filament_id),
    'days_tracked', (SELECT COUNT(DISTINCT DATE(recorded_at)) FROM price_history WHERE filament_id = p_filament_id),
    'total_samples', (SELECT COUNT(*) FROM price_history WHERE filament_id = p_filament_id)
  ) INTO result
  FROM filaments f
  WHERE f.id = p_filament_id;
  RETURN result;
END;
$$;

-- Function: Cleanup old price history (older than 1 year)
CREATE OR REPLACE FUNCTION public.cleanup_old_price_history()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM price_history WHERE recorded_at < NOW() - INTERVAL '1 year';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function: Check if current price is at all-time low
CREATE OR REPLACE FUNCTION public.is_at_all_time_low(p_filament_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_price numeric;
  historical_min numeric;
BEGIN
  SELECT variant_price INTO current_price FROM filaments WHERE id = p_filament_id;
  SELECT MIN(price) INTO historical_min FROM price_history WHERE filament_id = p_filament_id;
  
  IF current_price IS NULL OR historical_min IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN current_price <= historical_min;
END;
$$;
