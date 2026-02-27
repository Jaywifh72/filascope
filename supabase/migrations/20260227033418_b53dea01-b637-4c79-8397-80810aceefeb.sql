-- Seed product_regional_urls for FormFutura EU (one row per unique product_url)
INSERT INTO product_regional_urls (product_id, region_code, store_name, store_url, currency_code, product_type, is_primary, is_verified)
SELECT DISTINCT ON (f.product_url)
  f.id as product_id,
  'EU' as region_code,
  'FormFutura EU' as store_name,
  f.product_url as store_url,
  'EUR' as currency_code,
  'filament' as product_type,
  true as is_primary,
  true as is_verified
FROM filaments f
WHERE f.vendor = 'FormFutura'
  AND f.product_url IS NOT NULL
ON CONFLICT DO NOTHING;

-- Clear variant_price for FormFutura (ensure clean state)
UPDATE filaments 
SET variant_price = NULL 
WHERE vendor = 'FormFutura' AND variant_price IS NOT NULL;