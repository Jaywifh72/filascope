
-- 1. Create search_logs table for zero-result and general search analysis
CREATE TABLE IF NOT EXISTS public.search_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_term TEXT NOT NULL,
  results_count INTEGER,
  filters_applied JSONB,
  region TEXT,
  session_id TEXT,
  user_id UUID,
  has_results BOOLEAN GENERATED ALWAYS AS (results_count > 0) STORED,
  time_to_results_ms INTEGER,
  source_page TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON public.search_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_has_results ON public.search_logs(has_results);
CREATE INDEX IF NOT EXISTS idx_search_logs_search_term ON public.search_logs(search_term);
CREATE INDEX IF NOT EXISTS idx_search_logs_region ON public.search_logs(region);

-- Enable RLS (public insert, admin read)
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert search logs"
  ON public.search_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read search logs"
  ON public.search_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 2. Add missing columns to affiliate_clicks if they don't exist
ALTER TABLE public.affiliate_clicks
  ADD COLUMN IF NOT EXISTS product_slug TEXT,
  ADD COLUMN IF NOT EXISTS price NUMERIC,
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_product_slug ON public.affiliate_clicks(product_slug);

-- 3. Daily aggregation view
CREATE OR REPLACE VIEW public.affiliate_clicks_daily AS
SELECT
  (clicked_at AT TIME ZONE 'UTC')::date AS date,
  brand_name AS brand,
  source_component AS store,
  region_code AS region,
  COUNT(*) AS clicks,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(DISTINCT product_slug) AS unique_products,
  AVG(price) FILTER (WHERE price IS NOT NULL) AS avg_price
FROM public.affiliate_clicks
GROUP BY
  (clicked_at AT TIME ZONE 'UTC')::date,
  brand_name,
  source_component,
  region_code
ORDER BY date DESC, clicks DESC;

-- 4. Zero-result searches view for content gap analysis
CREATE OR REPLACE VIEW public.search_zero_results AS
SELECT
  search_term,
  COUNT(*) AS search_count,
  COUNT(DISTINCT session_id) AS unique_sessions,
  MAX(created_at) AS last_searched_at,
  mode() WITHIN GROUP (ORDER BY region) AS most_common_region
FROM public.search_logs
WHERE has_results = false
GROUP BY search_term
ORDER BY search_count DESC;
