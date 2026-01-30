
-- Add missing regional store configurations for multi-region brands
-- This populates brand_regional_stores with correct store URLs, currencies, and shipping info

-- GEEETECH - Missing EU store (declared in supported_regions)
INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
VALUES 
  ('15ade56b-5da5-4f41-8cbc-80ce6035aeb5', 'US', 'GEEETECH US', 'https://www.geeetech.com', 'USD', 'CN', true, true, 'https://www.geeetech.com/{sku}'),
  ('15ade56b-5da5-4f41-8cbc-80ce6035aeb5', 'EU', 'GEEETECH EU', 'https://www.geeetech.com', 'USD', 'CN', false, true, 'https://www.geeetech.com/{sku}')
ON CONFLICT DO NOTHING;

-- Extrudr - Missing US store (declared in supported_regions)
INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
VALUES 
  ('b992d77e-75cf-4dff-a12a-b6b4915ec175', 'US', 'Extrudr US', 'https://www.extrudr.com', 'EUR', 'AT', false, true, 'https://www.extrudr.com/en/products/{sku}'),
  ('b992d77e-75cf-4dff-a12a-b6b4915ec175', 'EU', 'Extrudr EU', 'https://www.extrudr.com', 'EUR', 'AT', true, true, 'https://www.extrudr.com/en/products/{sku}')
ON CONFLICT DO NOTHING;

-- Fillamentum - Missing US store (declared in supported_regions)
INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
VALUES 
  ('610c767d-561e-47d9-bc99-d9ec5a80ce0b', 'US', 'Fillamentum US', 'https://fillamentum.com', 'EUR', 'CZ', false, true, 'https://fillamentum.com/products/{sku}'),
  ('610c767d-561e-47d9-bc99-d9ec5a80ce0b', 'EU', 'Fillamentum EU', 'https://fillamentum.com', 'EUR', 'CZ', true, true, 'https://fillamentum.com/products/{sku}')
ON CONFLICT DO NOTHING;

-- FormFutura - Missing US store (declared in supported_regions)
-- Note: FormFutura uses root-level slugs: formfutura.com/{slug} NOT /products/{slug}
INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
VALUES 
  ('798f309a-3e61-4f67-8ed3-ad7e8b485f82', 'US', 'FormFutura US', 'https://www.formfutura.com', 'EUR', 'NL', false, true, 'https://www.formfutura.com/{sku}'),
  ('798f309a-3e61-4f67-8ed3-ad7e8b485f82', 'EU', 'FormFutura EU', 'https://www.formfutura.com', 'EUR', 'NL', true, true, 'https://www.formfutura.com/{sku}')
ON CONFLICT DO NOTHING;

-- AzureFilm - Missing US store (declared in supported_regions)
-- Already has EU store, adding US
INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
VALUES 
  ('05167088-b672-4b5e-9c3d-7cb25180c815', 'US', 'AzureFilm US', 'https://azurefilm.com', 'EUR', 'SI', false, true, 'https://azurefilm.com/products/{sku}')
ON CONFLICT DO NOTHING;

-- Recreus - Missing US store (declared in supported_regions)
INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
VALUES 
  ('e19fa826-eeb4-4e04-87c4-072fb28d6cc2', 'US', 'Recreus US', 'https://recreus.com', 'EUR', 'ES', false, true, 'https://recreus.com/products/{sku}'),
  ('e19fa826-eeb4-4e04-87c4-072fb28d6cc2', 'EU', 'Recreus EU', 'https://recreus.com', 'EUR', 'ES', true, true, 'https://recreus.com/products/{sku}')
ON CONFLICT DO NOTHING;

-- Paramount 3D - US only (Amazon seller)
INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
VALUES 
  ('7d975b0f-74a1-4f13-b141-36a32d571df2', 'US', 'Paramount 3D Amazon', 'https://www.amazon.com', 'USD', 'US', true, true, null)
ON CONFLICT DO NOTHING;

-- 3DHOJOR - US only (Amazon seller)
INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
VALUES 
  ('1f17e310-1890-403b-a8ba-5d67d1be8f48', 'US', '3DHOJOR Amazon', 'https://www.amazon.com', 'USD', 'US', true, true, null)
ON CONFLICT DO NOTHING;

-- VoxelPLA - US only
INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
VALUES 
  ('061a31a3-a60a-4d55-a288-30de62e287bf', 'US', 'VoxelPLA', 'https://voxelpla.com', 'USD', 'US', true, true, 'https://voxelpla.com/products/{sku}')
ON CONFLICT DO NOTHING;

-- Prusa - Global store (ships everywhere)
INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
VALUES 
  ('d5dabc20-b67f-405c-b257-5b89c6181353', 'US', 'Prusa US', 'https://www.prusa3d.com', 'EUR', 'CZ', false, true, 'https://www.prusa3d.com/product/{sku}'),
  ('d5dabc20-b67f-405c-b257-5b89c6181353', 'EU', 'Prusa EU', 'https://www.prusa3d.com', 'EUR', 'CZ', true, true, 'https://www.prusa3d.com/product/{sku}'),
  ('d5dabc20-b67f-405c-b257-5b89c6181353', 'UK', 'Prusa UK', 'https://www.prusa3d.com', 'GBP', 'CZ', false, true, 'https://www.prusa3d.com/product/{sku}'),
  ('d5dabc20-b67f-405c-b257-5b89c6181353', 'CA', 'Prusa Canada', 'https://www.prusa3d.com', 'USD', 'CZ', false, true, 'https://www.prusa3d.com/product/{sku}'),
  ('d5dabc20-b67f-405c-b257-5b89c6181353', 'AU', 'Prusa Australia', 'https://www.prusa3d.com', 'EUR', 'CZ', false, true, 'https://www.prusa3d.com/product/{sku}')
ON CONFLICT DO NOTHING;

-- Add more UK stores for major brands that support UK but don't have stores configured
-- Polymaker UK
INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
SELECT id, 'UK', 'Polymaker UK', 'https://uk.polymaker.com', 'GBP', 'UK', false, true, 'https://uk.polymaker.com/products/{slug}'
FROM automated_brands WHERE brand_slug = 'polymaker'
ON CONFLICT DO NOTHING;

-- Add AU stores for major brands
-- Polymaker AU (ships from EU)
INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
SELECT id, 'AU', 'Polymaker AU', 'https://us.polymaker.com', 'USD', 'US', false, true, 'https://us.polymaker.com/products/{slug}'
FROM automated_brands WHERE brand_slug = 'polymaker'
ON CONFLICT DO NOTHING;

-- Sunlu regional stores (they have subdomain stores)
INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
SELECT id, 'UK', 'Sunlu UK', 'https://uk.sunlu.com', 'GBP', 'UK', false, true, 'https://uk.sunlu.com/products/{slug}'
FROM automated_brands WHERE brand_slug = 'sunlu'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
SELECT id, 'CA', 'Sunlu Canada', 'https://www.sunlu.com', 'USD', 'CN', false, true, 'https://www.sunlu.com/products/{slug}'
FROM automated_brands WHERE brand_slug = 'sunlu'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
SELECT id, 'AU', 'Sunlu Australia', 'https://www.sunlu.com', 'USD', 'CN', false, true, 'https://www.sunlu.com/products/{slug}'
FROM automated_brands WHERE brand_slug = 'sunlu'
ON CONFLICT DO NOTHING;

-- eSun regional stores
INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
SELECT id, 'UK', 'eSun UK', 'https://esun3dstore.com', 'USD', 'CN', false, true, 'https://esun3dstore.com/products/{slug}'
FROM automated_brands WHERE brand_slug = 'esun'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
SELECT id, 'CA', 'eSun Canada', 'https://esun3dstore.com', 'USD', 'CN', false, true, 'https://esun3dstore.com/products/{slug}'
FROM automated_brands WHERE brand_slug = 'esun'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
SELECT id, 'AU', 'eSun Australia', 'https://esun3dstore.com', 'USD', 'CN', false, true, 'https://esun3dstore.com/products/{slug}'
FROM automated_brands WHERE brand_slug = 'esun'
ON CONFLICT DO NOTHING;

-- Hatchbox (Amazon-only but ships to multiple regions)
INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
SELECT id, 'US', 'Hatchbox Amazon US', 'https://www.amazon.com', 'USD', 'US', true, true, null
FROM automated_brands WHERE brand_slug = 'hatchbox'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
SELECT id, 'CA', 'Hatchbox Amazon CA', 'https://www.amazon.ca', 'CAD', 'US', false, true, null
FROM automated_brands WHERE brand_slug = 'hatchbox'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
SELECT id, 'UK', 'Hatchbox Amazon UK', 'https://www.amazon.co.uk', 'GBP', 'US', false, true, null
FROM automated_brands WHERE brand_slug = 'hatchbox'
ON CONFLICT DO NOTHING;

-- Overture (Amazon primarily)
INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
SELECT id, 'US', 'Overture', 'https://overture3d.com', 'USD', 'US', true, true, 'https://overture3d.com/products/{slug}'
FROM automated_brands WHERE brand_slug = 'overture'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, currency_code, ships_from_country, is_primary, is_active, product_url_pattern)
SELECT id, 'CA', 'Overture Amazon CA', 'https://www.amazon.ca', 'CAD', 'US', false, true, null
FROM automated_brands WHERE brand_slug = 'overture'
ON CONFLICT DO NOTHING;
