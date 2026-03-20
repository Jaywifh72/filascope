CREATE OR REPLACE VIEW public.v_brand_directory AS
SELECT
  ab.id,
  ab.brand_name,
  ab.brand_slug,
  ab.display_name,
  ab.description,
  ab.logo_url,
  ab.website_url,
  ab.featured,
  ab.display_order,
  ab.is_visible,
  ab.color_primary,
  ab.color_secondary,
  ab.active_product_count,
  COALESCE(stats.variant_count, 0)::bigint AS variant_count,
  COALESCE(stats.product_line_count, 0)::bigint AS product_line_count
FROM automated_brands ab
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS variant_count,
    COUNT(DISTINCT product_line_id) AS product_line_count
  FROM filaments f
  WHERE (LOWER(f.vendor) = LOWER(ab.brand_name)
         OR LOWER(f.vendor) = LOWER(ab.display_name))
    AND (f.net_weight_g IS NULL OR f.net_weight_g >= 300)
) stats ON true
WHERE ab.is_visible = true;

GRANT SELECT ON public.v_brand_directory TO anon, authenticated;

-- Create catalog_sync_runs if missing (used by brand sync functions)
CREATE TABLE IF NOT EXISTS public.catalog_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_slug TEXT NOT NULL,
  function_name TEXT,
  status TEXT DEFAULT 'running',
  items_found INTEGER DEFAULT 0,
  items_new INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_unchanged INTEGER DEFAULT 0,
  items_error INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.catalog_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read" ON public.catalog_sync_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON public.catalog_sync_runs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON public.catalog_sync_runs FOR UPDATE TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE ON public.catalog_sync_runs TO anon, authenticated;

-- Create sync_quality_results if missing
CREATE TABLE IF NOT EXISTS public.sync_quality_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.catalog_sync_runs(id),
  brand_slug TEXT NOT NULL,
  check_type TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sync_quality_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read" ON public.sync_quality_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON public.sync_quality_results FOR INSERT TO authenticated WITH CHECK (true);
GRANT SELECT, INSERT ON public.sync_quality_results TO anon, authenticated;
