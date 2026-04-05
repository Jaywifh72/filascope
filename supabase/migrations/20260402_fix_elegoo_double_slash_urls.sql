-- Fix Elegoo URLs with double slashes
-- Impact.com API returns URLs like https://us.elegoo.com//products/pc-filament-1-75-mm-colored-5-kg
-- These break when converted to regional URLs (CA, EU, UK, AU) causing 404 errors
-- This migration cleans up existing malformed URLs in the database

-- Fix URLs with double slashes (but preserve https://)
UPDATE filaments
SET product_url = REGEXP_REPLACE(product_url, '(?<!:)\/{2,}', '/', 'g')
WHERE vendor = 'Elegoo'
  AND product_url LIKE '%//products/%';

-- Verify the fix - should return 0 rows if successful
SELECT COUNT(*) as remaining_bad_urls
FROM filaments
WHERE vendor = 'Elegoo'
  AND product_url LIKE '%//products/%';

-- Show a sample of fixed URLs for verification
SELECT id, title, product_url
FROM filaments
WHERE vendor = 'Elegoo'
  AND product_url LIKE '%elegoo.com/products/%'
LIMIT 5;

-- Note: The root cause has been fixed in fetch-elegoo-catalog edge function
-- which now normalizes URLs on ingest using: url: item.Url?.replace(/(?<!:)\/{2,}/g, '/')
