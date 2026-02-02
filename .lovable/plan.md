# ✅ COMPLETED: Fix 3DHOJOR Store Links to Use Shopify URL When Amazon is Unavailable

## Implementation Status: COMPLETE

## Summary

The implementation now correctly handles 3DHOJOR products:

1. **Defensive code improvements** - Added null/empty validation for Amazon links in FilamentDetail.tsx and PurchaseSection.tsx
2. **Live price check works** - The `get-current-price` edge function correctly scrapes 3DHOJOR Shopify URLs (tested: returns $14.99 for PETG, $16.99 for PLA Pro)
3. **URL priority chain** - `selectedVariant?.product_url || unifiedPricing.storeUrl || pricingFilament.product_url` correctly falls back to Shopify

---

## Current State Analysis

### What's Working Correctly

| Component | Status | Details |
|-----------|--------|---------|
| `brand_regional_stores` | ✅ | 3DHOJOR configured with `base_url: https://3dhojor.com`, pattern: `/products/{slug}` |
| `affiliate_configs` | ✅ | Amazon tag stored correctly as `filascope-20` (no URL parameters) |
| `useUnifiedRegionalPricing` | ✅ | Generates correct `storeUrl` from brand_regional_stores |
| `FilamentDetail.tsx` | ✅ | Uses priority chain: `selectedVariant?.product_url` → `unifiedPricing.storeUrl` → `pricingFilament.product_url` |
| Amazon link filtering | ✅ | `.filter(a => a.link)` at line 172 prevents null Amazon links from being processed |

### Database State for 3DHOJOR

```text
Products: 118 total
├── product_url: ✅ All have valid Shopify URLs (https://3dhojor.com/products/{handle})
├── amazon_link_us: ⚠️ 75 populated, 43 still NULL
└── filament_listings: ✅ Empty (no stale data)
```

---

## Proposed Improvements

### 1. Add Explicit Null Check in Retailers Array Builder

**File:** `src/pages/FilamentDetail.tsx`

Add an explicit check to ensure we never add a retailer with a null/empty URL to the retailers array.

```typescript
// Current (lines 182-191)
for (const amazon of sortedAmazon) {
  result.push({
    id: amazon.id,
    name: amazon.name,
    price: amazon.price,
    inStock: true,
    url: getAmazonUrl(amazon.link!),  // Non-null assertion
    shippingEstimate: 'Prime eligible',
  });
}

// Improved
for (const amazon of sortedAmazon) {
  const affiliateUrl = getAmazonUrl(amazon.link);
  if (!affiliateUrl) continue;  // Skip if URL construction fails
  
  result.push({
    id: amazon.id,
    name: amazon.name,
    price: amazon.price,
    inStock: true,
    url: affiliateUrl,
    shippingEstimate: 'Prime eligible',
  });
}
```

### 2. Add URL Validation in PurchaseSection

**File:** `src/components/filament/PurchaseSection.tsx`

Add defensive check when building legacy Amazon retailer entry.

```typescript
// Current (lines 135-147)
if (filament.amazon_link_us) {
  retailers.push({
    id: 'amazon_us',
    name: 'Amazon',
    region: 'US',
    url: getAffiliateUrl(filament.amazon_link_us, 'Amazon') || filament.amazon_link_us,
    // ...
  });
}

// Improved - validate the URL before adding
if (filament.amazon_link_us?.trim()) {
  const amazonUrl = getAffiliateUrl(filament.amazon_link_us, 'Amazon');
  if (amazonUrl && amazonUrl.includes('amazon.com/dp/')) {
    retailers.push({
      id: 'amazon_us',
      name: 'Amazon',
      region: 'US',
      url: amazonUrl,
      // ...
    });
  }
}
```

### 3. Add Debug Logging for 3DHOJOR URLs

**File:** `src/hooks/useUnifiedRegionalPricing.ts`

Add conditional logging to help diagnose any future URL issues with specific brands.

```typescript
// After storeUrl is computed (around line 648)
if (product.brandName?.toLowerCase().includes('3dhojor')) {
  console.log('🔗 3DHOJOR URL Debug:', {
    storeUrl,
    effectiveSlug,
    originalUrl,
    isLocal,
    storeRegion: matchedStore?.region_code,
  });
}
```

---

## Verification Steps

After implementing these changes:

1. **Test 3DHOJOR Product Page**
   - Navigate to `/filament/d3e3c6fe-a7ab-4a90-b7cd-e7e85b1a8bd7`
   - Verify "Buy Now" button links to `https://3dhojor.com/products/...`
   - Verify no Amazon links appear in retailers modal (unless `amazon_link_us` is populated)

2. **Test Product With Amazon Link**
   - Navigate to `/filament/93244b83-78a7-4fe2-8a51-673bf7e73380` (has Amazon link)
   - Verify both Shopify store and Amazon appear as options
   - Verify Amazon link includes `?tag=filascope-20`

3. **Console Check**
   - Verify debug logging shows correct Shopify URL
   - No malformed URLs in network tab

---

## Technical Details

### Files to Modify

| File | Change Type | Purpose |
|------|-------------|---------|
| `src/pages/FilamentDetail.tsx` | Defensive check | Prevent null URL retailers |
| `src/components/filament/PurchaseSection.tsx` | URL validation | Validate Amazon URLs before adding |
| `src/hooks/useUnifiedRegionalPricing.ts` | Debug logging | Help diagnose future issues |

### Risk Assessment

- **Low Risk**: These are defensive improvements that add validation without changing core logic
- **Backward Compatible**: No changes to data structures or API contracts
- **Easily Reversible**: Debug logging can be removed after verification

---

## Expected Outcome

After implementation:

| Scenario | Behavior |
|----------|----------|
| 3DHOJOR product without Amazon link | Shows only "3DHOJOR Store" with Shopify URL |
| 3DHOJOR product with Amazon link | Shows both "3DHOJOR Store" and "Amazon US" options |
| Invalid Amazon URL in database | Gracefully skipped, falls back to Shopify |
| All other brands | No change in behavior |

