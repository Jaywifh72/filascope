-- Backfill product_regional_urls from flat filament URL columns. Safe to re-run.

INSERT INTO product_regional_urls (product_id, product_type, region_code, store_url, currency_code, is_primary, is_verified, created_at)

-- AU
SELECT id, 'filament', 'AU', product_url_au, 'AUD', true, false, now()
FROM filaments WHERE product_url_au IS NOT NULL

UNION ALL

-- CA
SELECT id, 'filament', 'CA', product_url_ca, 'CAD', true, false, now()
FROM filaments WHERE product_url_ca IS NOT NULL

UNION ALL

-- EU
SELECT id, 'filament', 'EU', product_url_eu, 'EUR', true, false, now()
FROM filaments WHERE product_url_eu IS NOT NULL

UNION ALL

-- UK
SELECT id, 'filament', 'UK', product_url_uk, 'GBP', true, false, now()
FROM filaments WHERE product_url_uk IS NOT NULL

UNION ALL

-- JP
SELECT id, 'filament', 'JP', product_url_jp, 'JPY', true, false, now()
FROM filaments WHERE product_url_jp IS NOT NULL

UNION ALL

-- US
SELECT id, 'filament', 'US', product_url, 'USD', true, false, now()
FROM filaments WHERE product_url IS NOT NULL

ON CONFLICT (product_id, product_type, region_code, store_url) DO NOTHING;