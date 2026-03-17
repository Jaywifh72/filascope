-- ============================================================
-- Amazon Sync System - Database Schema
-- ============================================================
-- Adds tables for Amazon product mapping, price tracking,
-- brand store discovery, and sync audit logging.
-- ============================================================

-- 1. Amazon Product Mappings
-- Links filaments to Amazon ASINs per marketplace
CREATE TABLE IF NOT EXISTS public.amazon_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id UUID NOT NULL REFERENCES public.filaments(id) ON DELETE CASCADE,
  asin TEXT NOT NULL,
  marketplace TEXT NOT NULL,

  -- Metadata from Amazon
  amazon_title TEXT,
  brand_name TEXT,
  product_group TEXT,
  parent_asin TEXT,                     -- For variation/multi-pack grouping
  spool_count INTEGER DEFAULT 1,       -- Number of spools in listing (1, 2, 3, etc.)
  weight_kg NUMERIC(6,3),              -- Weight per spool in kg

  -- Matching metadata
  match_confidence TEXT DEFAULT 'manual',
  match_source TEXT,
  matched_at TIMESTAMPTZ DEFAULT now(),
  verified_by TEXT,
  verified_at TIMESTAMPTZ,

  -- Link to filament_listings (the actual price record)
  listing_id UUID REFERENCES public.filament_listings(id) ON DELETE SET NULL,

  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT amazon_mappings_marketplace_check CHECK (
    marketplace IN ('US', 'UK', 'DE', 'CA', 'FR', 'IT', 'ES', 'AU', 'JP')
  ),
  CONSTRAINT amazon_mappings_confidence_check CHECK (
    match_confidence IN ('auto_high', 'auto_medium', 'auto_low', 'manual', 'verified')
  ),
  CONSTRAINT amazon_mappings_source_check CHECK (
    match_source IN ('pa_api_search', 'storefront_crawl', 'manual_entry', 'serpapi', 'legacy_import')
  ),
  CONSTRAINT amazon_mappings_unique UNIQUE (asin, marketplace)
);

CREATE INDEX IF NOT EXISTS idx_amazon_mappings_filament ON public.amazon_product_mappings(filament_id);
CREATE INDEX IF NOT EXISTS idx_amazon_mappings_asin ON public.amazon_product_mappings(asin);
CREATE INDEX IF NOT EXISTS idx_amazon_mappings_marketplace ON public.amazon_product_mappings(marketplace);
CREATE INDEX IF NOT EXISTS idx_amazon_mappings_listing ON public.amazon_product_mappings(listing_id);
CREATE INDEX IF NOT EXISTS idx_amazon_mappings_active ON public.amazon_product_mappings(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_amazon_mappings_confidence ON public.amazon_product_mappings(match_confidence);

-- 2. Amazon Product Details
-- Amazon-specific metadata that doesn't belong in filament_listings
CREATE TABLE IF NOT EXISTS public.amazon_product_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id UUID NOT NULL REFERENCES public.amazon_product_mappings(id) ON DELETE CASCADE,

  -- Rating & reviews
  rating NUMERIC(2,1),
  review_count INTEGER,

  -- Seller info
  buy_box_seller TEXT,
  is_sold_by_brand BOOLEAN,
  is_prime_eligible BOOLEAN,
  is_addon_item BOOLEAN DEFAULT false,

  -- Coupon / deal info
  coupon_text TEXT,
  coupon_percent INTEGER,
  coupon_amount_cents INTEGER,
  deal_type TEXT,
  deal_end_at TIMESTAMPTZ,
  subscribe_save_percent INTEGER,

  -- Images
  main_image_url TEXT,

  -- Stock
  stock_status TEXT DEFAULT 'in_stock',

  -- Price anomaly detection
  price_vs_msrp_ratio NUMERIC(4,2),
  is_price_anomaly BOOLEAN DEFAULT false,
  anomaly_reason TEXT,

  last_fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT amazon_details_mapping_unique UNIQUE (mapping_id),
  CONSTRAINT amazon_details_stock_check CHECK (
    stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'back_order', 'unknown')
  ),
  CONSTRAINT amazon_details_deal_check CHECK (
    deal_type IS NULL OR deal_type IN ('lightning', 'best', 'coupon', 'subscribe_save', 'prime_day')
  )
);

CREATE INDEX IF NOT EXISTS idx_amazon_details_mapping ON public.amazon_product_details(mapping_id);
CREATE INDEX IF NOT EXISTS idx_amazon_details_anomaly ON public.amazon_product_details(is_price_anomaly) WHERE is_price_anomaly = true;

-- 3. Amazon Brand Stores
-- Maps brands to their Amazon storefront URLs per marketplace
CREATE TABLE IF NOT EXISTS public.amazon_brand_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.automated_brands(id) ON DELETE CASCADE,
  brand_slug TEXT NOT NULL,
  marketplace TEXT NOT NULL,

  storefront_url TEXT,
  store_name TEXT,
  seller_id TEXT,

  -- Discovery metadata
  product_count INTEGER,
  last_crawled_at TIMESTAMPTZ,
  crawl_status TEXT DEFAULT 'pending',

  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT amazon_brand_stores_marketplace_check CHECK (
    marketplace IN ('US', 'UK', 'DE', 'CA', 'FR', 'IT', 'ES', 'AU', 'JP')
  ),
  CONSTRAINT amazon_brand_stores_unique UNIQUE (brand_slug, marketplace)
);

CREATE INDEX IF NOT EXISTS idx_amazon_brand_stores_brand ON public.amazon_brand_stores(brand_id);
CREATE INDEX IF NOT EXISTS idx_amazon_brand_stores_slug ON public.amazon_brand_stores(brand_slug);

-- 4. Amazon Sync Runs
-- Audit log for all sync operations
CREATE TABLE IF NOT EXISTS public.amazon_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',

  -- Scope
  brand_slug TEXT,
  marketplace TEXT,

  -- Stats
  total_items INTEGER DEFAULT 0,
  processed INTEGER DEFAULT 0,
  prices_updated INTEGER DEFAULT 0,
  new_mappings INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  skipped INTEGER DEFAULT 0,

  -- PA-API usage tracking
  api_calls_used INTEGER DEFAULT 0,

  -- Details
  error_log JSONB DEFAULT '[]'::jsonb,
  summary JSONB DEFAULT '{}'::jsonb,

  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  triggered_by TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_amazon_sync_runs_status ON public.amazon_sync_runs(status);
CREATE INDEX IF NOT EXISTS idx_amazon_sync_runs_started ON public.amazon_sync_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_amazon_sync_runs_type ON public.amazon_sync_runs(run_type);

-- 5. RLS Policies
ALTER TABLE public.amazon_product_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read amazon_product_mappings" ON public.amazon_product_mappings FOR SELECT USING (true);

ALTER TABLE public.amazon_product_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read amazon_product_details" ON public.amazon_product_details FOR SELECT USING (true);

ALTER TABLE public.amazon_brand_stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read amazon_brand_stores" ON public.amazon_brand_stores FOR SELECT USING (true);

ALTER TABLE public.amazon_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read amazon_sync_runs" ON public.amazon_sync_runs FOR SELECT USING (true);

-- Authenticated users (admin) can write to all Amazon tables
CREATE POLICY "Auth insert amazon_product_mappings" ON public.amazon_product_mappings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update amazon_product_mappings" ON public.amazon_product_mappings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete amazon_product_mappings" ON public.amazon_product_mappings FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert amazon_product_details" ON public.amazon_product_details FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update amazon_product_details" ON public.amazon_product_details FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete amazon_product_details" ON public.amazon_product_details FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert amazon_brand_stores" ON public.amazon_brand_stores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update amazon_brand_stores" ON public.amazon_brand_stores FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete amazon_brand_stores" ON public.amazon_brand_stores FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert amazon_sync_runs" ON public.amazon_sync_runs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update amazon_sync_runs" ON public.amazon_sync_runs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete amazon_sync_runs" ON public.amazon_sync_runs FOR DELETE TO authenticated USING (true);

-- 6. Seed Amazon retailers (if not already present)
INSERT INTO public.retailers (id, name, slug, logo_url, website_url, trust_score, regions_served)
VALUES
  (gen_random_uuid(), 'Amazon US',        'amazon-us', '/logos/amazon.svg', 'https://amazon.com',      5, ARRAY['US']),
  (gen_random_uuid(), 'Amazon UK',        'amazon-uk', '/logos/amazon.svg', 'https://amazon.co.uk',    5, ARRAY['UK']),
  (gen_random_uuid(), 'Amazon Germany',   'amazon-de', '/logos/amazon.svg', 'https://amazon.de',       5, ARRAY['EU']),
  (gen_random_uuid(), 'Amazon Canada',    'amazon-ca', '/logos/amazon.svg', 'https://amazon.ca',       5, ARRAY['CA']),
  (gen_random_uuid(), 'Amazon France',    'amazon-fr', '/logos/amazon.svg', 'https://amazon.fr',       5, ARRAY['EU']),
  (gen_random_uuid(), 'Amazon Italy',     'amazon-it', '/logos/amazon.svg', 'https://amazon.it',       5, ARRAY['EU']),
  (gen_random_uuid(), 'Amazon Spain',     'amazon-es', '/logos/amazon.svg', 'https://amazon.es',       5, ARRAY['EU']),
  (gen_random_uuid(), 'Amazon Australia', 'amazon-au', '/logos/amazon.svg', 'https://amazon.com.au',   5, ARRAY['AU']),
  (gen_random_uuid(), 'Amazon Japan',     'amazon-jp', '/logos/amazon.svg', 'https://amazon.co.jp',    5, ARRAY['JP'])
ON CONFLICT (slug) DO NOTHING;

-- 7. Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_amazon_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_amazon_mappings_updated
  BEFORE UPDATE ON public.amazon_product_mappings
  FOR EACH ROW EXECUTE FUNCTION update_amazon_updated_at();

CREATE TRIGGER trg_amazon_details_updated
  BEFORE UPDATE ON public.amazon_product_details
  FOR EACH ROW EXECUTE FUNCTION update_amazon_updated_at();

CREATE TRIGGER trg_amazon_brand_stores_updated
  BEFORE UPDATE ON public.amazon_brand_stores
  FOR EACH ROW EXECUTE FUNCTION update_amazon_updated_at();

-- 8. Helper view: Amazon coverage by brand
CREATE OR REPLACE VIEW public.v_amazon_brand_coverage AS
SELECT
  b.id AS brand_id,
  b.brand_name AS brand_name,
  COUNT(DISTINCT f.id) AS total_filaments,
  COUNT(DISTINCT apm.filament_id) AS mapped_filaments,
  ROUND(
    COUNT(DISTINCT apm.filament_id)::NUMERIC / NULLIF(COUNT(DISTINCT f.id), 0) * 100, 1
  ) AS coverage_pct,
  COUNT(DISTINCT apm.filament_id) FILTER (WHERE apm.verified_at IS NOT NULL) AS verified_count,
  MAX(apm.updated_at) AS last_sync
FROM public.automated_brands b
LEFT JOIN public.filaments f ON f.brand_id = b.id
LEFT JOIN public.amazon_product_mappings apm ON apm.filament_id = f.id
GROUP BY b.id, b.brand_name
ORDER BY total_filaments DESC;
