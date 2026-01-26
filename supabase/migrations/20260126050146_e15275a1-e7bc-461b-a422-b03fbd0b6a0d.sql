-- =============================================
-- Regional Database Schema - Part 1
-- =============================================

-- Step 1: Create product_regional_urls table
CREATE TABLE public.product_regional_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  product_type text NOT NULL,
  region_code text NOT NULL,
  store_url text NOT NULL,
  store_name text,
  currency_code text NOT NULL DEFAULT 'USD',
  is_primary boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  last_verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT product_regional_urls_type_check 
    CHECK (product_type IN ('filament', 'printer')),
  CONSTRAINT product_regional_urls_region_check 
    CHECK (region_code IN ('US', 'CA', 'UK', 'EU', 'AU', 'JP', 'CN')),
  CONSTRAINT product_regional_urls_unique 
    UNIQUE (product_id, product_type, region_code, store_url)
);

CREATE INDEX idx_product_regional_urls_product ON product_regional_urls(product_id, product_type);
CREATE INDEX idx_product_regional_urls_region ON product_regional_urls(region_code);
CREATE INDEX idx_product_regional_urls_verified ON product_regional_urls(is_verified);

-- Step 2: Create product_regional_prices table
CREATE TABLE public.product_regional_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  product_type text NOT NULL,
  region_code text NOT NULL,
  currency_code text NOT NULL,
  current_price numeric,
  compare_at_price numeric,
  msrp numeric,
  price_source text,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_error text,
  store_url_id uuid REFERENCES product_regional_urls(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT product_regional_prices_type_check 
    CHECK (product_type IN ('filament', 'printer')),
  CONSTRAINT product_regional_prices_region_check 
    CHECK (region_code IN ('US', 'CA', 'UK', 'EU', 'AU', 'JP', 'CN')),
  CONSTRAINT product_regional_prices_unique 
    UNIQUE (product_id, product_type, region_code)
);

CREATE INDEX idx_product_regional_prices_product ON product_regional_prices(product_id, product_type);
CREATE INDEX idx_product_regional_prices_region ON product_regional_prices(region_code);

-- Step 3: Add columns to filaments table
ALTER TABLE filaments 
  ADD COLUMN IF NOT EXISTS primary_region text DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS has_regional_urls boolean DEFAULT false;

-- Step 4: Add columns to printers table
ALTER TABLE printers 
  ADD COLUMN IF NOT EXISTS primary_region text DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS has_regional_urls boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS regional_availability text[];

-- Step 5: Add regional columns to brand_sync_logs
ALTER TABLE brand_sync_logs
  ADD COLUMN IF NOT EXISTS region_code text,
  ADD COLUMN IF NOT EXISTS regions_synced text[];

-- Step 6: Create helper view for filaments
CREATE OR REPLACE VIEW filaments_with_regional AS
SELECT 
  f.*,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'region', pru.region_code,
      'url', pru.store_url,
      'storeName', pru.store_name,
      'isVerified', pru.is_verified,
      'isPrimary', pru.is_primary
    ))
    FROM product_regional_urls pru 
    WHERE pru.product_id = f.id AND pru.product_type = 'filament'),
    '[]'::jsonb
  ) as regional_urls,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'region', prp.region_code,
      'price', prp.current_price,
      'currency', prp.currency_code,
      'lastSync', prp.last_sync_at,
      'status', prp.last_sync_status
    ))
    FROM product_regional_prices prp 
    WHERE prp.product_id = f.id AND prp.product_type = 'filament'),
    '[]'::jsonb
  ) as regional_prices
FROM filaments f;

-- Step 7: Create helper view for printers
CREATE OR REPLACE VIEW printers_with_regional AS
SELECT 
  p.*,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'region', pru.region_code,
      'url', pru.store_url,
      'storeName', pru.store_name,
      'isVerified', pru.is_verified,
      'isPrimary', pru.is_primary
    ))
    FROM product_regional_urls pru 
    WHERE pru.product_id = p.id AND pru.product_type = 'printer'),
    '[]'::jsonb
  ) as regional_urls,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'region', prp.region_code,
      'price', prp.current_price,
      'currency', prp.currency_code,
      'lastSync', prp.last_sync_at,
      'status', prp.last_sync_status
    ))
    FROM product_regional_prices prp 
    WHERE prp.product_id = p.id AND prp.product_type = 'printer'),
    '[]'::jsonb
  ) as regional_prices
FROM printers p;

-- Step 8: RLS Policies
ALTER TABLE product_regional_urls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read regional URLs"
  ON product_regional_urls FOR SELECT USING (true);

CREATE POLICY "Service role manages regional URLs"
  ON product_regional_urls FOR ALL TO service_role
  USING (true) WITH CHECK (true);

ALTER TABLE product_regional_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read regional prices"
  ON product_regional_prices FOR SELECT USING (true);

CREATE POLICY "Service role manages regional prices"
  ON product_regional_prices FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Step 9: Auto-update triggers
CREATE OR REPLACE FUNCTION update_regional_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_product_regional_urls_timestamp
  BEFORE UPDATE ON product_regional_urls
  FOR EACH ROW EXECUTE FUNCTION update_regional_timestamp();

CREATE TRIGGER update_product_regional_prices_timestamp
  BEFORE UPDATE ON product_regional_prices
  FOR EACH ROW EXECUTE FUNCTION update_regional_timestamp();