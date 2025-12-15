-- ============================================================================
-- AUTOMATED BRANDS TABLE - Central registry for filament brand scraping
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.automated_brands (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name text NOT NULL UNIQUE,
  brand_slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  logo_url text,
  website_url text,
  platform_type text NOT NULL CHECK (platform_type IN ('shopify', 'woocommerce', 'amazon', 'bigcommerce', 'magento', 'prestashop', 'firecrawl', 'custom')),
  base_url text NOT NULL,
  
  -- Scraping configuration
  scraping_enabled boolean DEFAULT true,
  scraping_active boolean DEFAULT false,
  last_scrape_at timestamptz,
  next_scrape_at timestamptz,
  scrape_frequency_hours integer DEFAULT 12,
  
  -- Platform-specific settings
  has_api boolean DEFAULT false,
  requires_auth boolean DEFAULT false,
  rate_limit_ms integer DEFAULT 2000,
  timeout_ms integer DEFAULT 10000,
  max_retries integer DEFAULT 3,
  
  -- Selectors for HTML scraping (JSON)
  price_selectors jsonb DEFAULT '[]'::jsonb,
  availability_selectors jsonb DEFAULT '[]'::jsonb,
  title_selectors jsonb DEFAULT '[]'::jsonb,
  image_selectors jsonb DEFAULT '[]'::jsonb,
  
  -- Currency and region
  default_currency text DEFAULT 'USD',
  supported_regions text[] DEFAULT ARRAY['US'],
  requires_currency_conversion boolean DEFAULT false,
  
  -- Product info
  product_count integer DEFAULT 0,
  active_product_count integer DEFAULT 0,
  products_with_urls integer DEFAULT 0,
  
  -- Statistics
  total_scrapes integer DEFAULT 0,
  successful_scrapes integer DEFAULT 0,
  failed_scrapes integer DEFAULT 0,
  avg_scrape_duration_seconds numeric,
  last_error text,
  last_error_at timestamptz,
  
  -- Display settings
  featured boolean DEFAULT false,
  display_order integer DEFAULT 999,
  is_visible boolean DEFAULT true,
  color_primary text,
  color_secondary text,
  
  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid,
  notes text
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automated_brands_slug ON automated_brands(brand_slug);
CREATE INDEX IF NOT EXISTS idx_automated_brands_platform ON automated_brands(platform_type);
CREATE INDEX IF NOT EXISTS idx_automated_brands_enabled ON automated_brands(scraping_enabled) WHERE scraping_enabled = true;
CREATE INDEX IF NOT EXISTS idx_automated_brands_active ON automated_brands(scraping_active) WHERE scraping_active = true;
CREATE INDEX IF NOT EXISTS idx_automated_brands_featured ON automated_brands(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_automated_brands_visible ON automated_brands(is_visible) WHERE is_visible = true;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_automated_brands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS automated_brands_updated_at ON automated_brands;
CREATE TRIGGER automated_brands_updated_at
  BEFORE UPDATE ON automated_brands
  FOR EACH ROW
  EXECUTE FUNCTION update_automated_brands_updated_at();

-- Enable RLS
ALTER TABLE automated_brands ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Automated brands publicly readable"
  ON automated_brands FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Admins can manage automated brands"
  ON automated_brands FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- VIEWS FOR BRAND STATISTICS
-- ============================================================================

-- View: Active brands with statistics
CREATE OR REPLACE VIEW v_active_brands AS
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

-- View: Scraping statistics
CREATE OR REPLACE VIEW v_brand_scraping_stats AS
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

-- ============================================================================
-- FUNCTIONS FOR BRAND MANAGEMENT
-- ============================================================================

-- Function: Update brand product counts
CREATE OR REPLACE FUNCTION update_brand_product_counts(p_brand_slug text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  IF p_brand_slug IS NOT NULL THEN
    UPDATE automated_brands ab
    SET 
      product_count = counts.total,
      active_product_count = counts.active,
      products_with_urls = counts.with_urls
    FROM (
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN variant_available = true THEN 1 END) as active,
        COUNT(CASE WHEN product_url IS NOT NULL THEN 1 END) as with_urls
      FROM filaments
      WHERE LOWER(vendor) = LOWER((SELECT brand_name FROM automated_brands WHERE brand_slug = p_brand_slug))
    ) counts
    WHERE ab.brand_slug = p_brand_slug;
  ELSE
    UPDATE automated_brands ab
    SET 
      product_count = COALESCE(counts.total, 0),
      active_product_count = COALESCE(counts.active, 0),
      products_with_urls = COALESCE(counts.with_urls, 0)
    FROM (
      SELECT 
        ab2.id,
        COUNT(f.*) as total,
        COUNT(CASE WHEN f.variant_available = true THEN 1 END) as active,
        COUNT(CASE WHEN f.product_url IS NOT NULL THEN 1 END) as with_urls
      FROM automated_brands ab2
      LEFT JOIN filaments f ON LOWER(f.vendor) = LOWER(ab2.brand_name)
      GROUP BY ab2.id
    ) counts
    WHERE ab.id = counts.id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Record scrape result
CREATE OR REPLACE FUNCTION record_scrape_result(
  p_brand_slug text,
  p_success boolean,
  p_duration_seconds numeric,
  p_products_processed integer DEFAULT 0,
  p_products_updated integer DEFAULT 0,
  p_error_message text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE automated_brands
  SET 
    last_scrape_at = NOW(),
    next_scrape_at = NOW() + (scrape_frequency_hours || ' hours')::interval,
    scraping_active = false,
    total_scrapes = total_scrapes + 1,
    successful_scrapes = CASE WHEN p_success THEN successful_scrapes + 1 ELSE successful_scrapes END,
    failed_scrapes = CASE WHEN NOT p_success THEN failed_scrapes + 1 ELSE failed_scrapes END,
    avg_scrape_duration_seconds = CASE 
      WHEN avg_scrape_duration_seconds IS NULL THEN p_duration_seconds
      ELSE (avg_scrape_duration_seconds + p_duration_seconds) / 2
    END,
    last_error = CASE WHEN NOT p_success THEN p_error_message ELSE NULL END,
    last_error_at = CASE WHEN NOT p_success THEN NOW() ELSE last_error_at END
  WHERE brand_slug = p_brand_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Start scraping
CREATE OR REPLACE FUNCTION start_brand_scrape(p_brand_slug text)
RETURNS boolean AS $$
DECLARE
  v_already_active boolean;
BEGIN
  SELECT scraping_active INTO v_already_active
  FROM automated_brands
  WHERE brand_slug = p_brand_slug AND scraping_enabled = true;
  
  IF v_already_active THEN
    RETURN false;
  END IF;
  
  UPDATE automated_brands
  SET scraping_active = true
  WHERE brand_slug = p_brand_slug AND scraping_enabled = true;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Get brands needing scraping
CREATE OR REPLACE FUNCTION get_brands_needing_scrape()
RETURNS TABLE (
  brand_slug text,
  brand_name text,
  platform_type text,
  last_scrape_at timestamptz,
  scrape_frequency_hours integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ab.brand_slug,
    ab.brand_name,
    ab.platform_type,
    ab.last_scrape_at,
    ab.scrape_frequency_hours
  FROM automated_brands ab
  WHERE ab.scraping_enabled = true
    AND ab.scraping_active = false
    AND (
      ab.next_scrape_at IS NULL 
      OR ab.next_scrape_at <= NOW()
      OR ab.last_scrape_at IS NULL
    )
  ORDER BY 
    CASE WHEN ab.last_scrape_at IS NULL THEN 0 ELSE 1 END,
    ab.last_scrape_at ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- SEED DATA - All 37 brands from config.ts
-- ============================================================================

INSERT INTO automated_brands (brand_name, brand_slug, display_name, platform_type, base_url, default_currency, has_api, scraping_enabled) VALUES
-- Shopify brands (27)
('Prusament', 'prusament', 'Prusament', 'shopify', 'https://www.prusa3d.com', 'USD', true, true),
('3D-Fuel', '3d-fuel', '3D Fuel', 'shopify', 'https://www.3dfuel.com', 'USD', true, true),
('Polymaker', 'polymaker', 'Polymaker', 'shopify', 'https://us.polymaker.com', 'USD', true, true),
('ColorFabb', 'colorfabb', 'ColorFabb', 'shopify', 'https://colorfabb.com', 'EUR', true, true),
('Proto-Pasta', 'proto-pasta', 'Proto-Pasta', 'shopify', 'https://www.proto-pasta.com', 'USD', true, true),
('Fillamentum', 'fillamentum', 'Fillamentum', 'shopify', 'https://fillamentum.com', 'EUR', true, true),
('Atomic Filament', 'atomic-filament', 'Atomic Filament', 'shopify', 'https://atomicfilament.com', 'USD', true, true),
('Push Plastic', 'push-plastic', 'Push Plastic', 'shopify', 'https://www.pushplastic.com', 'USD', true, true),
('Fusion Filaments', 'fusion-filaments', 'Fusion Filaments', 'shopify', 'https://fusionfilaments.com', 'USD', true, true),
('NinjaTek', 'ninjatek', 'NinjaTek', 'shopify', 'https://ninjatek.com', 'USD', true, true),
('Recreus', 'recreus', 'Recreus', 'shopify', 'https://recreus.com', 'EUR', true, true),
('Extrudr', 'extrudr', 'Extrudr', 'shopify', 'https://www.extrudr.com', 'EUR', true, true),
('Fiberlogy', 'fiberlogy', 'Fiberlogy', 'shopify', 'https://fiberlogy.com', 'EUR', true, true),
('Ultimaker', 'ultimaker', 'Ultimaker', 'shopify', 'https://ultimaker.com', 'USD', true, true),
('Printed Solid', 'printed-solid', 'Printed Solid', 'shopify', 'https://www.printedsolid.com', 'USD', true, true),
('Bambu Lab', 'bambu-lab', 'Bambu Lab', 'shopify', 'https://store.bambulab.com', 'USD', true, true),
('Anycubic', 'anycubic', 'Anycubic', 'shopify', 'https://store.anycubic.com', 'USD', true, true),
('Elegoo', 'elegoo', 'Elegoo', 'shopify', 'https://www.elegoo.com', 'USD', true, true),
('Creality', 'creality', 'Creality', 'shopify', 'https://store.creality.com', 'USD', true, true),
('Sunlu', 'sunlu', 'Sunlu', 'shopify', 'https://www.sunlu.com', 'USD', true, true),
('Amolen', 'amolen', 'Amolen', 'shopify', 'https://amolen.com', 'USD', true, true),
('eSun', 'esun', 'eSun', 'shopify', 'https://www.esun3d.com', 'USD', true, true),
('Eryone', 'eryone', 'Eryone', 'shopify', 'https://eryone3d.com', 'USD', true, true),
('VoxelPLA', 'voxelpla', 'VoxelPLA', 'shopify', 'https://voxelpla.com', 'USD', true, true),
('Matter3D', 'matter3d', 'Matter3D', 'shopify', 'https://matter3d.com', 'CAD', true, true),
('Taulman3D', 'taulman3d', 'Taulman3D', 'shopify', 'https://taulman3d.com', 'USD', true, true),
('Siraya Tech', 'siraya-tech', 'Siraya Tech', 'shopify', 'https://siraya.tech', 'USD', true, true),

-- Amazon brands (6)
('Hatchbox', 'hatchbox', 'Hatchbox', 'amazon', 'https://www.amazon.com', 'USD', false, true),
('Ziro', 'ziro', 'Ziro', 'amazon', 'https://www.amazon.com', 'USD', false, true),
('Paramount 3D', 'paramount-3d', 'Paramount 3D', 'amazon', 'https://www.amazon.com', 'USD', false, true),
('GEEETECH', 'geeetech', 'GEEETECH', 'amazon', 'https://www.amazon.com', 'USD', false, true),
('TECBEARS', 'tecbears', 'TECBEARS', 'amazon', 'https://www.amazon.com', 'USD', false, true),
('TTYT3D', 'ttyt3d', 'TTYT3D', 'amazon', 'https://www.amazon.com', 'USD', false, true),

-- WooCommerce brands (1)
('Overture 3D', 'overture-3d', 'Overture 3D', 'woocommerce', 'https://overture3d.com', 'USD', false, true),

-- BigCommerce brands (1)
('3DXTech', '3dxtech', '3DXTech', 'bigcommerce', 'https://www.3dxtech.com', 'USD', false, true),

-- Firecrawl/Custom brands (3)
('FormFutura', 'formfutura', 'FormFutura', 'firecrawl', 'https://formfutura.com', 'EUR', false, true),
('MatterHackers', 'matterhackers', 'MatterHackers', 'firecrawl', 'https://www.matterhackers.com', 'USD', false, true),
('Inland', 'inland', 'Inland', 'firecrawl', 'https://www.microcenter.com', 'USD', false, true)

ON CONFLICT (brand_slug) DO NOTHING;

-- Update product counts for all brands
SELECT update_brand_product_counts();

-- Comments
COMMENT ON TABLE automated_brands IS 'Central registry of all automated filament brands with scraping configuration';
COMMENT ON COLUMN automated_brands.brand_name IS 'Official brand name (matches vendor field in filaments table)';
COMMENT ON COLUMN automated_brands.brand_slug IS 'URL-safe slug for routing and API calls';
COMMENT ON COLUMN automated_brands.platform_type IS 'E-commerce platform: shopify, woocommerce, amazon, etc.';