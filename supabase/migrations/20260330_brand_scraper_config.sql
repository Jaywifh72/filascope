-- ============================================================================
-- Brand Scraper Configuration Update (2026-03-30)
--
-- Updates automated_brands table to reflect Phase 2 new brands and
-- corrects extraction_method + has_api for all Shopify brands.
-- ============================================================================

-- ============================================================================
-- Phase 2: Insert missing brands into automated_brands
-- These brands have sync functions but may not have DB records yet.
-- Use ON CONFLICT DO NOTHING to avoid overwriting existing data.
-- ============================================================================

INSERT INTO automated_brands (
  brand_slug, brand_name, display_name, platform_type, base_url,
  extraction_method, has_api, scraping_enabled,
  default_currency, supported_regions, rate_limit_ms
)
VALUES
  (
    'sainsmart', 'SainSmart', 'SainSmart', 'shopify',
    'https://www.sainsmart.com',
    'shopify_api', true, true,
    'USD', ARRAY['US'], 500
  ),
  (
    'gst3d', 'GST3D', 'GST3D', 'shopify',
    'https://www.gst3d.com',
    'shopify_api', true, true,
    'USD', ARRAY['US'], 500
  ),
  (
    'filaments-ca', 'Filaments.ca', 'Filaments.ca', 'shopify',
    'https://filaments.ca',
    'shopify_api', true, true,
    'CAD', ARRAY['CA'], 500
  ),
  (
    'printed-solid', 'Printed Solid', 'Printed Solid', 'shopify',
    'https://www.printedsolid.com',
    'shopify_api', true, true,
    'USD', ARRAY['US'], 500
  ),
  (
    'taulman3d', 'Taulman3D', 'Taulman3D', 'shopify',
    'https://taulman3d.com',
    'shopify_api', true, true,
    'USD', ARRAY['US'], 500
  )
ON CONFLICT (brand_slug) DO NOTHING;

-- ============================================================================
-- Phase 6: Update extraction metadata for all Shopify brands
-- Mark extraction as working with shopify_api method.
-- ============================================================================

UPDATE automated_brands SET
  extraction_method    = 'shopify_api',
  has_api              = true,
  products_url         = base_url || '/products.json',
  scraping_enabled     = true
WHERE platform_type = 'shopify'
  AND extraction_method IS DISTINCT FROM 'shopify_api';

-- WooCommerce brands get woocommerce method
UPDATE automated_brands SET
  extraction_method = 'woocommerce',
  has_api           = true,
  scraping_enabled  = true
WHERE brand_slug IN ('ninjatek', 'ic3d-printers', 'overture-3d')
  AND platform_type = 'woocommerce';

-- Correct ninjatek platform_type if it was incorrectly set to shopify
UPDATE automated_brands SET
  platform_type     = 'woocommerce',
  extraction_method = 'woocommerce'
WHERE brand_slug = 'ninjatek'
  AND platform_type = 'shopify';

-- ============================================================================
-- Ensure scraping_enabled = true for all brands that have sync functions
-- ============================================================================

UPDATE automated_brands SET scraping_enabled = true
WHERE brand_slug IN (
  'bambu-lab', 'polymaker', 'elegoo', 'creality', 'anycubic', 'esun',
  'prusament', 'overture', 'sunlu', 'eryone', 'kingroon', 'sovol',
  'hatchbox', 'colorfabb', 'fillamentum', 'atomic-filament', 'proto-pasta',
  'ninjatek', 'qidi', 'flashforge', 'geeetech', '3d-fuel', '3dhojor',
  '3dxtech', 'amolen', 'azurefilm', 'duramic-3d', 'extrudr', 'fiberlogy',
  'formfutura', 'fusion-filaments', 'gizmo-dorks', 'ic3d-printers',
  'matter3d', 'numakers', 'paramount-3d', 'push-plastic', 'recreus',
  'siraya-tech', 'spectrum-filaments', 'treed-filaments', 'ultimaker',
  'voxelpla', 'yousu', 'ziro',
  'sainsmart', 'gst3d', 'filaments-ca', 'printed-solid', 'taulman3d'
)
AND scraping_enabled = false;
