

## Fix FormFutura URLs - Database Migration

### Current State Analysis

| Table | Status | Details |
|-------|--------|---------|
| `filaments` | ✅ Clean | 460 FormFutura products, 0 with `/products/` path |
| `broken_product_urls` | ❌ Needs fix | 2 URLs: one with `/products/`, one with `/search/` |
| `product_regional_urls` | ✅ Clean | No broken FormFutura URLs |

### Issue
The previous migration converted FormFutura `/products/` URLs to search URLs (`/search/?q=...`), but the correct fix is simpler: just use root-level slugs (`/{slug}`).

### Migration SQL

```sql
-- Migration: fix_formfutura_urls_v2
-- Correct FormFutura URLs to use root-level product slugs

-- 1. Fix any remaining /products/ paths in filaments (defensive)
UPDATE filaments 
SET product_url = REPLACE(product_url, '/products/', '/')
WHERE product_url LIKE '%formfutura.com/products/%';

-- 2. Fix search URLs back to root-level slugs in filaments
UPDATE filaments 
SET product_url = REGEXP_REPLACE(
  product_url, 
  'https://www\.formfutura\.com/search/\?q=(.+)$',
  'https://www.formfutura.com/\1'
)
WHERE product_url LIKE '%formfutura.com/search/?q=%';

-- 3. Fix broken_product_urls table - /products/ path
UPDATE broken_product_urls 
SET product_url = REPLACE(product_url, '/products/', '/')
WHERE product_url LIKE '%formfutura.com/products/%';

-- 4. Fix broken_product_urls table - search URLs
UPDATE broken_product_urls 
SET product_url = REGEXP_REPLACE(
  product_url,
  'https://www\.formfutura\.com/search/\?q=(.+)$', 
  'https://www.formfutura.com/\1'
)
WHERE product_url LIKE '%formfutura.com/search/?q=%';

-- 5. Fix product_regional_urls (defensive)
UPDATE product_regional_urls 
SET store_url = REPLACE(store_url, '/products/', '/')
WHERE store_url LIKE '%formfutura.com/products/%';

-- 6. Fix filament_listings (defensive)
UPDATE filament_listings 
SET product_url = REPLACE(product_url, '/products/', '/')
WHERE product_url LIKE '%formfutura.com/products/%';

-- 7. Update normalize_product_url trigger with simpler FormFutura fix
CREATE OR REPLACE FUNCTION public.normalize_product_url()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip if product_url is null
  IF NEW.product_url IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Fix eSUN domain: esun3d.com → esun3dstore.com
  IF NEW.product_url LIKE '%esun3d.com%' 
     AND NEW.product_url NOT LIKE '%esun3dstore.com%' THEN
    NEW.product_url := REPLACE(
      REPLACE(NEW.product_url, 'www.esun3d.com', 'esun3dstore.com'),
      'esun3d.com', 'esun3dstore.com'
    );
  END IF;
  
  -- Fix FormFutura URL: /products/{slug} -> /{slug}
  -- FormFutura uses root-level product slugs, not /products/ path
  IF NEW.product_url LIKE '%formfutura.com/products/%' THEN
    NEW.product_url := REPLACE(NEW.product_url, '/products/', '/');
  END IF;
  
  RETURN NEW;
END;
$function$;
```

### Tables Updated

1. **filaments** - Main product URLs (defensive, currently clean)
2. **broken_product_urls** - 2 records to fix
3. **product_regional_urls** - Regional store URLs (defensive)
4. **filament_listings** - Retailer listings (defensive)
5. **normalize_product_url trigger** - Simplified to use root-level slugs

### URL Transformations

| Before | After |
|--------|-------|
| `formfutura.com/products/easyfil-epla` | `formfutura.com/easyfil-epla` |
| `formfutura.com/search/?q=easyfil epla` | `formfutura.com/easyfil epla` |

### Technical Notes

- Simpler fix: just removes `/products/` from path
- Also fixes any search URLs created by previous migration
- Trigger now uses simple `REPLACE()` instead of regex extraction
- Migration is idempotent - safe to run multiple times
- Aligns with frontend fixes in `useAffiliateLinks.tsx` and `urlValidation.ts`

