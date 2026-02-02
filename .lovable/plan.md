
# Fix: Broken Amazon Product URLs for 3DHOJOR Filaments

## Root Cause Analysis

Two separate data issues in the database are causing broken Amazon URLs:

### Issue 1: Missing Product URL Pattern
The `brand_regional_stores` entry for 3DHOJOR has:
- **base_url**: `https://www.amazon.com` (just the homepage)
- **product_url_pattern**: `NULL` (missing!)

When there's no pattern, `buildRegionalUrl()` just returns the homepage.

### Issue 2: Malformed Affiliate Tags
The `affiliate_configs` table has incorrectly formatted Amazon tags:
- **Current value**: `?tag=yourstore-20`
- **Should be**: `filascope-20` (just the tag ID)

The code does `urlObj.searchParams.set("tag", amazon_us_tag)`, which results in:
```
?tag=%3Ftag%3Dyourstore-20  (URL-encoded ?tag=yourstore-20)
```

---

## Solution

### Step 1: Fix the Affiliate Config Tags

Update the `affiliate_configs` table to store just the tag value, not the full parameter:

```sql
UPDATE affiliate_configs 
SET 
  amazon_us_tag = 'filascope-20',
  amazon_uk_tag = 'filascope-20',
  amazon_de_tag = 'filascope-20',
  amazon_ca_tag = 'filascope-20',
  amazon_au_tag = 'filascope-20',
  amazon_jp_tag = 'filascope-20'
WHERE vendor_name = 'Amazon';
```

Note: Replace `filascope-20` with your actual Amazon Associates tag if different.

### Step 2: Add Product URL Pattern for 3DHOJOR

Update the `brand_regional_stores` entry to include Amazon's product URL pattern using ASINs:

```sql
UPDATE brand_regional_stores 
SET product_url_pattern = '/dp/{slug}'
WHERE id = 'e782a7f1-7205-4b7a-9bc8-8b012441f241';
```

This requires the `product_handle` field in the `filaments` table to contain the Amazon ASIN for each product.

### Step 3: Populate Amazon ASINs for 3DHOJOR Products

The current `product_handle` values are from the 3DHOJOR website (e.g., `3dprinting-petg-filament`), not Amazon ASINs.

We need to either:
- **Option A**: Research and manually add ASINs for each product
- **Option B**: Use the 3DHOJOR store URL directly (their products seem available on their own Shopify store)

---

## Recommended Approach

Given that 3DHOJOR has their own functional Shopify store (`https://3dhojor.com/products/...`), the simplest fix is:

**Option 1: Use 3DHOJOR's Direct Store (Recommended)**

Remove the Amazon-based regional store and use the existing `product_url` from the filaments table:

```sql
-- Delete the Amazon-based regional store entry
DELETE FROM brand_regional_stores 
WHERE id = 'e782a7f1-7205-4b7a-9bc8-8b012441f241';
```

This will cause the system to fall back to the original `product_url` in the filaments table, which correctly points to `https://3dhojor.com/products/...`.

**Option 2: Add 3DHOJOR's Own Store as Regional Store**

Create a proper regional store entry for 3DHOJOR's own website:

```sql
UPDATE brand_regional_stores 
SET 
  base_url = 'https://3dhojor.com',
  product_url_pattern = '/products/{slug}',
  store_name = '3DHOJOR Store'
WHERE id = 'e782a7f1-7205-4b7a-9bc8-8b012441f241';
```

This will use the existing `product_handle` values which are already 3DHOJOR Shopify slugs.

---

## Files to Modify

| File | Change |
|------|--------|
| Database: `affiliate_configs` | Fix Amazon tags (remove `?tag=` prefix) |
| Database: `brand_regional_stores` | Either delete the 3DHOJOR Amazon entry OR update to use 3DHOJOR's own store URL |

---

## Testing

After applying fixes:
1. Navigate to a 3DHOJOR product page (e.g., `/filament/d3e3c6fe-a7ab-4a90-b7cd-e7e85b1a8bd7`)
2. Click "Buy Now" or "View at Store"
3. Verify redirect goes to correct product page (either 3dhojor.com or amazon.com/dp/ASIN)
4. Verify affiliate tag is properly formatted (not double-encoded)

---

## Implementation Priority

1. **Immediate**: Fix the `affiliate_configs` Amazon tags (affects all Amazon links site-wide)
2. **Immediate**: Fix or remove the 3DHOJOR regional store entry
3. **Optional**: Research ASINs if Amazon integration is preferred over 3DHOJOR's store
