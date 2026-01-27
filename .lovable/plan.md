

## Fix eSUN URLs Database Migration

### Summary
Create a comprehensive migration to fix all remaining eSUN product URLs across multiple tables in the database. While the main `filaments` table already has correct URLs, several configuration and reference tables still contain the broken `www.esun3d.com` domain.

### Database Audit Findings

| Table | Status | Issues Found |
|-------|--------|--------------|
| `filaments` | ✅ Clean | 360 eSUN products already using correct domain |
| `product_regional_urls` | ✅ Clean | No broken URLs |
| `filament_listings` | ✅ Clean | No broken URLs |
| `broken_product_urls` | ❌ Fix needed | 1 URL: `https://www.esun3d.com/products/epla-pro-hs` |
| `automated_brands` | ❌ Fix needed | eSUN brand has `base_url` and `products_url` pointing to broken domain |
| `brand_regional_stores` | ❌ Fix needed | 2 entries (US/EU) with `base_url` pointing to broken domain |

### Migration SQL

```sql
-- Migration: fix_esun_urls_www_prefix
-- Fix all eSUN URLs across the database to use correct domain

-- 1. Fix filaments table (defensive - in case any slip through)
UPDATE filaments 
SET product_url = REGEXP_REPLACE(
  REGEXP_REPLACE(product_url, 'https?://www\.esun3d\.com', 'https://esun3dstore.com', 'gi'),
  'https?://esun3d\.com', 'https://esun3dstore.com', 'gi'
)
WHERE (product_url LIKE '%esun3d.com%' OR product_url LIKE '%www.esun3d.com%') 
  AND product_url NOT LIKE '%esun3dstore.com%';

-- 2. Fix product_regional_urls table
UPDATE product_regional_urls 
SET store_url = REGEXP_REPLACE(
  REGEXP_REPLACE(store_url, 'https?://www\.esun3d\.com', 'https://esun3dstore.com', 'gi'),
  'https?://esun3d\.com', 'https://esun3dstore.com', 'gi'
)
WHERE (store_url LIKE '%esun3d.com%' OR store_url LIKE '%www.esun3d.com%') 
  AND store_url NOT LIKE '%esun3dstore.com%';

-- 3. Fix broken_product_urls table
UPDATE broken_product_urls 
SET product_url = REGEXP_REPLACE(
  REGEXP_REPLACE(product_url, 'https?://www\.esun3d\.com', 'https://esun3dstore.com', 'gi'),
  'https?://esun3d\.com', 'https://esun3dstore.com', 'gi'
)
WHERE (product_url LIKE '%esun3d.com%' OR product_url LIKE '%www.esun3d.com%') 
  AND product_url NOT LIKE '%esun3dstore.com%';

-- 4. Fix automated_brands table (base_url and products_url)
UPDATE automated_brands 
SET 
  base_url = REGEXP_REPLACE(
    REGEXP_REPLACE(base_url, 'https?://www\.esun3d\.com', 'https://esun3dstore.com', 'gi'),
    'https?://esun3d\.com', 'https://esun3dstore.com', 'gi'
  ),
  products_url = REGEXP_REPLACE(
    REGEXP_REPLACE(products_url, 'https?://www\.esun3d\.com', 'https://esun3dstore.com', 'gi'),
    'https?://esun3d\.com', 'https://esun3dstore.com', 'gi'
  ),
  website_url = REGEXP_REPLACE(
    REGEXP_REPLACE(website_url, 'https?://www\.esun3d\.com', 'https://esun3dstore.com', 'gi'),
    'https?://esun3d\.com', 'https://esun3dstore.com', 'gi'
  ),
  test_product_url = REGEXP_REPLACE(
    REGEXP_REPLACE(test_product_url, 'https?://www\.esun3d\.com', 'https://esun3dstore.com', 'gi'),
    'https?://esun3d\.com', 'https://esun3dstore.com', 'gi'
  )
WHERE brand_slug = 'esun' 
  OR base_url LIKE '%esun3d.com%' 
  OR products_url LIKE '%esun3d.com%';

-- 5. Fix brand_regional_stores table
UPDATE brand_regional_stores 
SET base_url = REGEXP_REPLACE(
  REGEXP_REPLACE(base_url, 'https?://www\.esun3d\.com', 'https://esun3dstore.com', 'gi'),
  'https?://esun3d\.com', 'https://esun3dstore.com', 'gi'
)
WHERE (base_url LIKE '%esun3d.com%' OR base_url LIKE '%www.esun3d.com%') 
  AND base_url NOT LIKE '%esun3dstore.com%';

-- 6. Fix filament_listings table (defensive)
UPDATE filament_listings 
SET product_url = REGEXP_REPLACE(
  REGEXP_REPLACE(product_url, 'https?://www\.esun3d\.com', 'https://esun3dstore.com', 'gi'),
  'https?://esun3d\.com', 'https://esun3dstore.com', 'gi'
)
WHERE (product_url LIKE '%esun3d.com%' OR product_url LIKE '%www.esun3d.com%') 
  AND product_url NOT LIKE '%esun3dstore.com%';
```

### Tables Updated

1. **filaments** - Main product URLs (defensive, currently clean)
2. **product_regional_urls** - Regional store URLs (defensive, currently clean)
3. **broken_product_urls** - Tracking table for broken URLs (1 record to fix)
4. **automated_brands** - Brand configuration URLs (1 brand to fix)
5. **brand_regional_stores** - Regional store configurations (2 records to fix)
6. **filament_listings** - Retailer listings (defensive, currently clean)

### Technical Notes

- Uses `REGEXP_REPLACE` with `'gi'` flags for case-insensitive global replacement
- Two-step replacement ensures both `www.esun3d.com` and `esun3d.com` are caught
- `WHERE` clauses prevent unnecessary updates to already-correct URLs
- Migration is idempotent - safe to run multiple times
- Works in conjunction with the existing `normalize_product_url()` trigger to prevent future issues

