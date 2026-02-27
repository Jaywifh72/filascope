-- Insert missing FormFutura regional URLs for the 80 variants that were missed
INSERT INTO product_regional_urls (product_id, region_code, store_name, store_url, currency_code, product_type, is_primary, is_verified)
SELECT 
  f.id, 'EU', 'FormFutura EU', f.product_url, 'EUR', 'filament', true, true
FROM filaments f
WHERE f.vendor = 'FormFutura'
  AND f.product_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM product_regional_urls r 
    WHERE r.product_id = f.id AND r.region_code = 'EU'
  );