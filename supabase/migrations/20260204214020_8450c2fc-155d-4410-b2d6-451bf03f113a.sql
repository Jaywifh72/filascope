-- =====================================================
-- PHASE 1: EXPAND EXISTING BRANDS TO MISSING REGIONS
-- =====================================================

-- 1.1 SUNLU EXPANSION (+2 regions: CA, AU)
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Sunlu Canada', 'CA', 'CAD', 'https://ca.sunlu.com', 'CA', true, false
FROM automated_brands WHERE brand_slug = 'sunlu'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Sunlu Australia', 'AU', 'AUD', 'https://au.sunlu.com', 'AU', true, false
FROM automated_brands WHERE brand_slug = 'sunlu'
ON CONFLICT DO NOTHING;

-- 1.2 SOVOL EXPANSION (+3 regions: UK, CA, AU)
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Sovol UK', 'UK', 'GBP', 'https://uk.sovol3d.com', 'UK', true, false
FROM automated_brands WHERE brand_slug = 'sovol'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Sovol Canada', 'CA', 'CAD', 'https://ca.sovol3d.com', 'CA', true, false
FROM automated_brands WHERE brand_slug = 'sovol'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Sovol Australia', 'AU', 'AUD', 'https://au.sovol3d.com', 'AU', true, false
FROM automated_brands WHERE brand_slug = 'sovol'
ON CONFLICT DO NOTHING;

-- 1.3 KINGROON EXPANSION (+3 regions: UK, CA, AU)
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Kingroon UK', 'UK', 'GBP', 'https://uk.kingroon.com', 'UK', true, false
FROM automated_brands WHERE brand_slug = 'kingroon'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Kingroon Canada', 'CA', 'CAD', 'https://ca.kingroon.com', 'CA', true, false
FROM automated_brands WHERE brand_slug = 'kingroon'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Kingroon Australia', 'AU', 'AUD', 'https://au.kingroon.com', 'AU', true, false
FROM automated_brands WHERE brand_slug = 'kingroon'
ON CONFLICT DO NOTHING;

-- 1.4 ERYONE EXPANSION (+3 regions: UK, CA, AU)
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Eryone UK', 'UK', 'GBP', 'https://uk.eryone3d.com', 'UK', true, false
FROM automated_brands WHERE brand_slug = 'eryone'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Eryone Canada', 'CA', 'CAD', 'https://ca.eryone3d.com', 'CA', true, false
FROM automated_brands WHERE brand_slug = 'eryone'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Eryone Australia', 'AU', 'AUD', 'https://au.eryone3d.com', 'AU', true, false
FROM automated_brands WHERE brand_slug = 'eryone'
ON CONFLICT DO NOTHING;

-- =====================================================
-- PHASE 2: UPDATE SUPPORTED REGIONS IN AUTOMATED_BRANDS
-- =====================================================

UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK', 'CA', 'AU']
WHERE brand_slug = 'sunlu';

UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK', 'CA', 'AU']
WHERE brand_slug = 'sovol';

UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK', 'CA', 'AU']
WHERE brand_slug = 'kingroon';

UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK', 'CA', 'AU']
WHERE brand_slug = 'eryone';

UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK', 'CA', 'AU']
WHERE brand_slug = 'polymaker';