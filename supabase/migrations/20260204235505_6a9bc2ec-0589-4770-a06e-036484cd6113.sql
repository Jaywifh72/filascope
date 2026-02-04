
-- =====================================================
-- FIX 1: SYNC supported_regions METADATA WITH ACTUAL STORES
-- (35 brands with mismatched metadata)
-- =====================================================

-- Bambu Lab: Add CN to supported_regions
UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK', 'CA', 'AU', 'JP', 'CN']
WHERE brand_slug = 'bambu-lab';

-- Amazon Basics: Add all actual regions
UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK', 'CA', 'AU', 'JP']
WHERE brand_slug = 'amazon-basics';

-- eSun: Add CA to supported_regions
UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'CA']
WHERE brand_slug = 'esun';

-- Matter3D: Add CA, EU
UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'CA']
WHERE brand_slug = 'matter3d';

-- Proto-pasta, Hatchbox, Overture: Add all 5 regions
UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK', 'CA', 'AU']
WHERE brand_slug IN ('proto-pasta', 'hatchbox', 'overture');

-- Anycubic: Already correct but ensure format
UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK', 'CA', 'AU']
WHERE brand_slug = 'anycubic';

-- Flashforge: Normalize array format
UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK', 'CA', 'AU']
WHERE brand_slug = 'flashforge';

-- Jayo: Add EU, UK
UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK']
WHERE brand_slug = 'jayo';

-- EU-primary brands: Add EU to supported_regions
UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU']
WHERE brand_slug IN (
  '3dxtech', 'azurefilm', 'colorfabb', 'extrudr', 'fiberlogy', 
  'fillamentum', 'formfutura', 'geeetech', 'ninjatek', 'prusa',
  'prusament', 'qidi', 'recreus', 'spectrum-filaments', 
  'treed-filaments', 'ultimaker', 'artillery'
);

-- =====================================================
-- FIX 2: MERGE "TreeD" VENDOR INTO "TreeD Filaments"
-- (209 orphaned products with no brand_id)
-- =====================================================

-- First, get the TreeD Filaments brand_id and update products
UPDATE filaments
SET 
  vendor = 'TreeD Filaments',
  brand_id = (SELECT id FROM automated_brands WHERE brand_slug = 'treed-filaments')
WHERE LOWER(vendor) = 'treed'
  AND brand_id IS NULL;

-- =====================================================
-- FIX 3: ADD MISSING UK/AU STORES FOR EU-PRIMARY BRANDS
-- (Expand coverage for Spectrum, FormFutura, Prusament)
-- =====================================================

-- Spectrum Filaments: Add UK, CA, AU stores
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Spectrum UK', 'UK', 'GBP', 'https://spectrumfilaments.com', 'EU', true, false
FROM automated_brands WHERE brand_slug = 'spectrum-filaments'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Spectrum CA', 'CA', 'CAD', 'https://spectrumfilaments.com', 'EU', true, false
FROM automated_brands WHERE brand_slug = 'spectrum-filaments'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Spectrum AU', 'AU', 'AUD', 'https://spectrumfilaments.com', 'EU', true, false
FROM automated_brands WHERE brand_slug = 'spectrum-filaments'
ON CONFLICT DO NOTHING;

-- Update Spectrum supported_regions
UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK', 'CA', 'AU']
WHERE brand_slug = 'spectrum-filaments';

-- FormFutura: Add UK store (ships from EU)
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'FormFutura UK', 'UK', 'GBP', 'https://formfutura.com', 'EU', true, false
FROM automated_brands WHERE brand_slug = 'formfutura'
ON CONFLICT DO NOTHING;

UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK']
WHERE brand_slug = 'formfutura';

-- Prusament: Add UK store
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Prusament UK', 'UK', 'GBP', 'https://www.prusa3d.com/product-category/prusament', 'EU', true, false
FROM automated_brands WHERE brand_slug = 'prusament'
ON CONFLICT DO NOTHING;

UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK']
WHERE brand_slug = 'prusament';
