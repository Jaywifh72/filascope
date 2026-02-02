

# Fix Complete: Affiliate Tag URL Encoding Bug

## Summary
The malformed Amazon affiliate URLs (`?tag=%3Ftag%3Dyourstore-20`) were caused by **database data issues that have already been fixed** in a previous session. This investigation confirms the fixes are in place and working.

---

## Root Cause Analysis

| Issue | Status | Details |
|-------|--------|---------|
| **Malformed Amazon tags** | ✅ Fixed | `affiliate_configs.amazon_us_tag` etc. now correctly contain `filascope-20` (not `?tag=yourstore-20`) |
| **3DHOJOR regional store** | ✅ Fixed | Now points to `https://3dhojor.com` with pattern `/products/{slug}` |
| **Edge function cache** | ✅ Redeployed | `get-affiliate-url` function redeployed to clear 5-minute in-memory cache |

---

## Current Database State (Verified)

**affiliate_configs table:**
```
vendor_name: Amazon
amazon_us_tag: filascope-20  ✅
amazon_uk_tag: filascope-20  ✅
amazon_de_tag: filascope-20  ✅
amazon_ca_tag: filascope-20  ✅
```

**brand_regional_stores for 3DHOJOR:**
```
base_url: https://3dhojor.com  ✅
product_url_pattern: /products/{slug}  ✅
store_name: 3DHOJOR Store  ✅
```

**Filament (id: d3e3c6fe-a7ab-4a90-b7cd-e7e85b1a8bd7):**
```
product_url: https://3dhojor.com/products/3dprinting-petg-filament  ✅
product_handle: 3dprinting-petg-filament  ✅
```

---

## How URL Construction Works

### Code Flow (Already Correct)
```
1. useUnifiedRegionalPricing fetches brand_regional_stores
2. buildRegionalUrl() combines base_url + pattern + slug
   → https://3dhojor.com + /products/{slug} + 3dprinting-petg-filament
   → https://3dhojor.com/products/3dprinting-petg-filament

3. useAffiliateLinks.getAffiliateUrl() processes the URL
   - Checks if Amazon domain → adds tag via searchParams.set("tag", "filascope-20")
   - 3DHOJOR URLs pass through unchanged (no affiliate config exists for 3DHOJOR)
```

### For Amazon Links
```typescript
// Code in useAffiliateLinks.tsx (line 73)
urlObj.searchParams.set("tag", amazonConfig.amazon_us_tag);
// With correct data: sets tag=filascope-20
// With old bad data: was setting tag=?tag=yourstore-20 → URL-encoded to %3Ftag%3D...
```

---

## Expected Behavior Now

| Filament Type | Expected URL |
|---------------|--------------|
| 3DHOJOR products | `https://3dhojor.com/products/{slug}` |
| Amazon products | `https://www.amazon.com/dp/{ASIN}?tag=filascope-20` |

---

## No Code Changes Required

The code logic was always correct. The issue was bad data in the database. After the database fixes applied earlier:

1. Amazon affiliate tags are correctly formatted (just the tag ID)
2. 3DHOJOR regional store uses the correct Shopify URL pattern
3. Edge function cache has been cleared by redeployment

---

## Testing Checklist

1. Navigate to a 3DHOJOR product (e.g., `/filament/d3e3c6fe-a7ab-4a90-b7cd-e7e85b1a8bd7`)
2. Click "Buy Now" or "View at Store"
3. Verify URL goes to `https://3dhojor.com/products/3dprinting-petg-filament`
4. For Amazon products, verify affiliate tag shows as `?tag=filascope-20` (no double-encoding)

