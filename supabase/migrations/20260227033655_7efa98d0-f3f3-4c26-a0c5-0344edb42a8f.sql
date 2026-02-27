-- Delete old partial seed (only 43 rows with one product_id per URL)
DELETE FROM product_regional_urls WHERE store_name = 'FormFutura EU';

-- Seed regional URLs for ALL FormFutura variants (460 rows, one per product_id)
INSERT INTO product_regional_urls (product_id, region_code, store_name, store_url, currency_code, product_type, is_primary, is_verified)
SELECT 
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