
# Plan: Fix 3DHOJOR Store Links to Use Shopify When Amazon is Unavailable

## Summary

This plan addresses the issue where 3DHOJOR products without Amazon links incorrectly display "Amazon" as the retailer or generate malformed Amazon URLs. The fix ensures proper fallback to the Shopify store with correct retailer naming.

## Current State Analysis

Based on my investigation:

1. **Database Configuration is Correct**:
   - `brand_regional_stores` table has 3DHOJOR Store entry with `https://3dhojor.com`
   - 3DHOJOR products have valid Shopify URLs in `product_url` column
   - 6 products still have `amazon_link_us = NULL` (TPU, Silk variants, etc.)

2. **URL Resolution Works Correctly**:
   - Console logs show `useUnifiedRegionalPricing` correctly returns `storeUrl: "https://3dhojor.com/products/..."` and `storeName: "3DHOJOR Store"`
   - The priority chain in `FilamentDetail.tsx` correctly uses `unifiedPricing.storeUrl`

3. **Recent Fixes Already Applied**:
   - `FilamentHeroPurchaseCard.tsx` and `FilamentPurchaseSidebar.tsx` now check if `affiliateUrl` contains Amazon domains before showing "Amazon" as the retailer name
   - `useAffiliateLinks.tsx` returns `null` for invalid Amazon URLs instead of constructing broken homepage links

4. **Remaining Issues**:
   - Static config in `brandRegionalAvailability.ts` says `store: false` for 3DHOJOR, which is inconsistent with the database (cosmetic issue, not blocking)
   - Need to verify the fix works end-to-end for products without Amazon links

## Implementation Plan

### Step 1: Update Static Brand Availability Config

**File**: `src/lib/brandRegionalAvailability.ts`

Update the 3DHOJOR entry to reflect reality:

```typescript
// BEFORE (incorrect)
'3DHOJOR': {
  US: { store: false, amazon: true },
  // ...
},

// AFTER (correct)
'3DHOJOR': {
  US: { store: true, amazon: true },  // Has Shopify store + Amazon
  // ...
},
```

This aligns the static config with the database and ensures any code that references this config gets accurate information.

### Step 2: Verify Live Price Check Fallback

The `LivePriceCheckButton` component already receives `productUrl` from the parent component. For 3DHOJOR products:
- `productUrl` = Shopify URL (`https://3dhojor.com/products/...`)
- `storeName` = "3DHOJOR Store" (from `unifiedPricing.storeName`)

The `get-current-price` Edge Function already supports Shopify scraping via its platform detection logic. No changes needed.

### Step 3: Verify Retailer Name Display

The fix is already in place. Both `FilamentHeroPurchaseCard` and `FilamentPurchaseSidebar` use this logic:

```typescript
const isAmazon = affiliateUrl?.toLowerCase().includes('amazon.com') || 
                 affiliateUrl?.toLowerCase().includes('amazon.co.') ||
                 affiliateUrl?.toLowerCase().includes('amazon.de') ||
                 affiliateUrl?.toLowerCase().includes('amzn.');
const finalRetailerName = isAmazon ? 'Amazon' : `${displayRetailer} Store`;
```

For 3DHOJOR products using Shopify URLs, `affiliateUrl` will be `https://3dhojor.com/...` which does NOT contain any Amazon domain, so:
- `isAmazon = false`
- `finalRetailerName = "3DHOJOR Store"`

### Step 4: No Changes Needed for Amazon URL Validation

The `getAmazonUrl` function in `useAffiliateLinks.tsx` already returns `null` for:
- Empty/null URLs
- Non-Amazon domains
- Amazon URLs without valid product identifiers (`/dp/` or `/gp/product/`)

This prevents malformed URLs like `https://www.amazon.com/?tag=...` from being generated.

---

## Technical Details

### Data Flow for 3DHOJOR Products Without Amazon Links

```text
FilamentDetail.tsx
    ├── useUnifiedRegionalPricing() → returns storeUrl, storeName
    │     └── Queries brand_regional_stores → finds "3DHOJOR Store"
    │
    ├── Builds affiliateUrl = getAffiliateUrl(storeUrl, vendor)
    │     └── Returns Shopify URL (no Amazon transformation)
    │
    └── Passes to FilamentPurchaseSidebar
          ├── affiliateUrl = "https://3dhojor.com/products/..."
          ├── isAmazon = false (no Amazon domain in URL)
          └── finalRetailerName = "3DHOJOR Store"
```

### Retailers Modal

The retailers array in `FilamentDetail.tsx` already filters out Amazon entries that return `null` from `getAmazonUrl`:

```typescript
for (const amazon of sortedAmazon) {
  const affiliateUrl = getAmazonUrl(amazon.link);
  if (!affiliateUrl) continue;  // Skip if null
  // ... add to retailers
}
```

For 3DHOJOR products with `amazon_link_us = NULL`, the filter `a => a.link` removes them before processing.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/brandRegionalAvailability.ts` | Update 3DHOJOR entry: `store: false` → `store: true` |

---

## Testing Checklist

After implementation:

1. **View 3DHOJOR product without Amazon link** (e.g., TPU 95A)
   - "Best Price" should show "3DHOJOR Store"
   - "Buy Now" button should link to `https://3dhojor.com/products/...`
   - No Amazon-related text should appear

2. **Click "Check Current Price"**
   - Should successfully scrape price from Shopify
   - Should show live price with checkmark

3. **View 3DHOJOR product WITH Amazon link** (e.g., PETG)
   - Should show both "3DHOJOR Store" and "Amazon" in retailers modal
   - Primary retailer should be determined by price

4. **Verify console has no malformed URL warnings**
   - No `[getAmazonUrl] Not an Amazon domain:` warnings for Shopify URLs
   - No double-encoded tag errors

---

## Summary of Changes

This is a **minimal fix** requiring only one file change to align the static config with reality. The core logic for handling Shopify fallback and retailer name display was already fixed in previous updates to:
- `FilamentHeroPurchaseCard.tsx`
- `FilamentPurchaseSidebar.tsx`  
- `useAffiliateLinks.tsx`

The remaining 6 3DHOJOR products without Amazon links (TPU 95A, Crystal Rainbow, etc.) will now correctly display "3DHOJOR Store" and link directly to the Shopify product page.
