
CREATE TABLE IF NOT EXISTS public.brand_sync_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT NOT NULL,
  store_platform TEXT NOT NULL DEFAULT 'unknown',
  primary_extraction TEXT NOT NULL DEFAULT 'json_ld',
  fallback_extraction TEXT DEFAULT 'meta_tags',
  shopify_json_available BOOLEAN DEFAULT false,
  json_ld_type TEXT DEFAULT 'Product',
  variant_region_in_title BOOLEAN DEFAULT false,
  variant_region_separator TEXT DEFAULT ' / ',
  variant_exclude_patterns TEXT[] DEFAULT ARRAY['combo', 'bundle', 'kit', 'pack', 'set', 'ams', '2*', '3*'],
  variant_selection_strategy TEXT DEFAULT 'cheapest_standalone',
  price_field TEXT DEFAULT 'offers.price',
  compare_at_field TEXT DEFAULT 'offers.priceSpecification.price',
  store_url_us TEXT,
  store_url_ca TEXT,
  store_url_uk TEXT,
  store_url_eu TEXT,
  store_url_au TEXT,
  uses_geo_pricing BOOLEAN DEFAULT false,
  sync_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brand_sync_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to brand_sync_config"
  ON public.brand_sync_config FOR SELECT USING (true);

CREATE POLICY "Allow service role full access to brand_sync_config"
  ON public.brand_sync_config FOR ALL
  USING (auth.role() = 'service_role');

CREATE UNIQUE INDEX idx_brand_sync_config_brand_id ON public.brand_sync_config(brand_id);
