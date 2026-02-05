
-- =====================================================
-- FIX 1: SYNC supported_regions FROM ACTUAL STORES
-- =====================================================

UPDATE automated_brands ab
SET supported_regions = (
  SELECT ARRAY_AGG(DISTINCT brs.region_code ORDER BY brs.region_code)
  FROM brand_regional_stores brs
  WHERE brs.brand_id = ab.id
    AND brs.is_active = true
)
WHERE EXISTS (
  SELECT 1 FROM brand_regional_stores brs 
  WHERE brs.brand_id = ab.id AND brs.is_active = true
);

-- =====================================================
-- FIX 2: ADD AMAZON STOREFRONTS FOR ALL MAJOR REGIONS
-- =====================================================

-- First, ensure Amazon stores exist in the stores table
INSERT INTO stores (name, slug, store_type, region, country_code, currency_code, base_url, is_active, ships_to, ships_from)
VALUES 
  ('Amazon US', 'amazon-us', 'marketplace', 'US', 'US', 'USD', 'https://www.amazon.com', true, ARRAY['US', 'CA'], ARRAY['US']),
  ('Amazon CA', 'amazon-ca', 'marketplace', 'CA', 'CA', 'CAD', 'https://www.amazon.ca', true, ARRAY['CA', 'US'], ARRAY['CA']),
  ('Amazon UK', 'amazon-uk', 'marketplace', 'UK', 'GB', 'GBP', 'https://www.amazon.co.uk', true, ARRAY['UK', 'EU'], ARRAY['UK']),
  ('Amazon DE', 'amazon-de', 'marketplace', 'EU', 'DE', 'EUR', 'https://www.amazon.de', true, ARRAY['EU', 'UK'], ARRAY['DE']),
  ('Amazon AU', 'amazon-au', 'marketplace', 'AU', 'AU', 'AUD', 'https://www.amazon.com.au', true, ARRAY['AU'], ARRAY['AU']),
  ('Amazon JP', 'amazon-jp', 'marketplace', 'JP', 'JP', 'JPY', 'https://www.amazon.co.jp', true, ARRAY['JP'], ARRAY['JP'])
ON CONFLICT (slug) DO UPDATE SET
  is_active = true,
  ships_to = EXCLUDED.ships_to,
  ships_from = EXCLUDED.ships_from;

-- =====================================================
-- FIX 3: ADD JP/CN REGIONAL STORES
-- =====================================================

-- Bambu Lab Japan
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Bambu Lab JP', 'JP', 'JPY', 'https://jp.store.bambulab.com', 'CN', true, true
FROM automated_brands WHERE brand_slug = 'bambu-lab'
ON CONFLICT DO NOTHING;

-- Bambu Lab China
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Bambu Lab CN', 'CN', 'CNY', 'https://cn.store.bambulab.com', 'CN', true, true
FROM automated_brands WHERE brand_slug = 'bambu-lab'
ON CONFLICT DO NOTHING;

-- Creality China
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Creality CN', 'CN', 'CNY', 'https://www.creality.cn', 'CN', true, true
FROM automated_brands WHERE brand_slug = 'creality'
ON CONFLICT DO NOTHING;

-- Creality Japan
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Creality JP', 'JP', 'JPY', 'https://store.creality.com/jp', 'CN', true, false
FROM automated_brands WHERE brand_slug = 'creality'
ON CONFLICT DO NOTHING;

-- Anycubic China
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Anycubic CN', 'CN', 'CNY', 'https://www.anycubic.cn', 'CN', true, true
FROM automated_brands WHERE brand_slug = 'anycubic'
ON CONFLICT DO NOTHING;

-- Anycubic Japan
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Anycubic JP', 'JP', 'JPY', 'https://store.anycubic.com/jp', 'CN', true, false
FROM automated_brands WHERE brand_slug = 'anycubic'
ON CONFLICT DO NOTHING;

-- Elegoo China
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Elegoo CN', 'CN', 'CNY', 'https://www.elegoo.cn', 'CN', true, true
FROM automated_brands WHERE brand_slug = 'elegoo'
ON CONFLICT DO NOTHING;

-- Elegoo Japan
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Elegoo JP', 'JP', 'JPY', 'https://www.elegoo.com/ja', 'CN', true, false
FROM automated_brands WHERE brand_slug = 'elegoo'
ON CONFLICT DO NOTHING;

-- Sunlu Japan (via Amazon)
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Sunlu Amazon JP', 'JP', 'JPY', 'https://www.amazon.co.jp/stores/SUNLU', 'CN', true, true
FROM automated_brands WHERE brand_slug = 'sunlu'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FIX 4: ADD AMAZON REGIONAL STORES FOR AMAZON-PRIMARY BRANDS
-- =====================================================

-- Hatchbox Amazon stores (all regions)
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Hatchbox Amazon US', 'US', 'USD', 'https://www.amazon.com/stores/HATCHBOX', 'US', true, true
FROM automated_brands WHERE brand_slug = 'hatchbox'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Hatchbox Amazon CA', 'CA', 'CAD', 'https://www.amazon.ca/stores/HATCHBOX', 'US', true, false
FROM automated_brands WHERE brand_slug = 'hatchbox'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Hatchbox Amazon UK', 'UK', 'GBP', 'https://www.amazon.co.uk/stores/HATCHBOX', 'US', true, false
FROM automated_brands WHERE brand_slug = 'hatchbox'
ON CONFLICT DO NOTHING;

-- Overture Amazon stores
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Overture Amazon US', 'US', 'USD', 'https://www.amazon.com/stores/OVERTURE', 'CN', true, true
FROM automated_brands WHERE brand_slug = 'overture'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Overture Amazon CA', 'CA', 'CAD', 'https://www.amazon.ca/stores/OVERTURE', 'CN', true, false
FROM automated_brands WHERE brand_slug = 'overture'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Overture Amazon UK', 'UK', 'GBP', 'https://www.amazon.co.uk/stores/OVERTURE', 'CN', true, false
FROM automated_brands WHERE brand_slug = 'overture'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Overture Amazon DE', 'EU', 'EUR', 'https://www.amazon.de/stores/OVERTURE', 'CN', true, false
FROM automated_brands WHERE brand_slug = 'overture'
ON CONFLICT DO NOTHING;

-- Eryone Amazon stores
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Eryone Amazon US', 'US', 'USD', 'https://www.amazon.com/stores/ERYONE', 'CN', true, true
FROM automated_brands WHERE brand_slug = 'eryone'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Eryone Amazon CA', 'CA', 'CAD', 'https://www.amazon.ca/stores/ERYONE', 'CN', true, false
FROM automated_brands WHERE brand_slug = 'eryone'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Eryone Amazon UK', 'UK', 'GBP', 'https://www.amazon.co.uk/stores/ERYONE', 'CN', true, false
FROM automated_brands WHERE brand_slug = 'eryone'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Eryone Amazon DE', 'EU', 'EUR', 'https://www.amazon.de/stores/ERYONE', 'CN', true, false
FROM automated_brands WHERE brand_slug = 'eryone'
ON CONFLICT DO NOTHING;

-- 3DHoJor Amazon stores
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, '3DHoJor Amazon US', 'US', 'USD', 'https://www.amazon.com/stores/3DHOJOR', 'CN', true, false
FROM automated_brands WHERE brand_slug = '3dhojor'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, '3DHoJor Amazon CA', 'CA', 'CAD', 'https://www.amazon.ca/stores/3DHOJOR', 'CN', true, false
FROM automated_brands WHERE brand_slug = '3dhojor'
ON CONFLICT DO NOTHING;

-- Amolen Amazon stores (if brand exists)
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Amolen Amazon US', 'US', 'USD', 'https://www.amazon.com/stores/AMOLEN', 'CN', true, true
FROM automated_brands WHERE brand_slug = 'amolen'
ON CONFLICT DO NOTHING;

-- ZIRO Amazon stores (if brand exists)
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'ZIRO Amazon US', 'US', 'USD', 'https://www.amazon.com/stores/ZIRO', 'CN', true, true
FROM automated_brands WHERE brand_slug = 'ziro'
ON CONFLICT DO NOTHING;

-- Duramic 3D Amazon stores (if brand exists)
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT id, 'Duramic Amazon US', 'US', 'USD', 'https://www.amazon.com/stores/Duramic3D', 'CN', true, true
FROM automated_brands WHERE brand_slug = 'duramic-3d'
ON CONFLICT DO NOTHING;

-- =====================================================
-- RE-SYNC supported_regions AFTER ADDING NEW STORES
-- =====================================================

UPDATE automated_brands ab
SET supported_regions = (
  SELECT ARRAY_AGG(DISTINCT brs.region_code ORDER BY brs.region_code)
  FROM brand_regional_stores brs
  WHERE brs.brand_id = ab.id
    AND brs.is_active = true
)
WHERE EXISTS (
  SELECT 1 FROM brand_regional_stores brs 
  WHERE brs.brand_id = ab.id AND brs.is_active = true
);
