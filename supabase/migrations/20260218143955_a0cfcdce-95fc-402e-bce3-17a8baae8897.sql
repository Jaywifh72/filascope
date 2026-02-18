
-- Fix Extrudr brand_regional_stores entries
-- The correct URL format is /en/de/products/{slug}/ (de = Germany/Austria, primary EU locale)
-- Extrudr is EUR-only; no regional pricing differentiation exists

-- 1. Fix Extrudr EU store
UPDATE brand_regional_stores
SET
  product_url_pattern = 'https://www.extrudr.com/en/de/products/{slug}/',
  base_url            = 'https://www.extrudr.com/en/de',
  currency_code       = 'EUR',
  notes               = 'Extrudr sells exclusively in EUR. /en/de/ is the stable DE locale that avoids geo-redirects.'
WHERE store_name = 'Extrudr'
  AND region_code = 'EU';

-- 2. Fix Extrudr US store (Extrudr has no USD pricing; EUR is the only currency)
UPDATE brand_regional_stores
SET
  product_url_pattern = 'https://www.extrudr.com/en/de/products/{slug}/',
  base_url            = 'https://www.extrudr.com/en/de',
  currency_code       = 'EUR',
  notes               = 'Extrudr sells exclusively in EUR. US store points to same EUR storefront.'
WHERE store_name = 'Extrudr US'
  AND region_code = 'US';

-- 3. Deactivate AU/CA/UK stores — Extrudr has no regional pricing for these markets
--    (EUR-only brand; these entries cannot contribute meaningful price data)
UPDATE brand_regional_stores
SET
  is_active = false,
  notes     = 'Deactivated: Extrudr is EUR-only and has no regional pricing for this market.'
WHERE store_name IN ('Extrudr AU', 'Extrudr CA', 'Extrudr UK')
  AND region_code IN ('AU', 'CA', 'UK');

-- 4. Fix filament product_url records: replace /en/inlt/ with /en/de/
--    /en/inlt/ is an internal Extrudr locale that caused inconsistent geo-redirects
UPDATE filaments
SET
  product_url = REPLACE(product_url, '/en/inlt/', '/en/de/'),
  updated_at  = NOW()
WHERE LOWER(vendor) = 'extrudr'
  AND product_url LIKE '%/en/inlt/%';
