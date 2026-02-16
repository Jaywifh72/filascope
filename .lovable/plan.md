

# Geo-Redirect Bypass + Pricing Data UI Fixes

## Context
The pricing data deduplication by `product_line_id` is already fully implemented. This plan addresses the remaining items: optimizing the price sync engine to skip doomed Shopify JSON attempts for geo-redirect domains, and fixing UI gaps in the admin pricing table.

## Changes

### 1. `get-current-price/index.ts` -- Geo-redirect Firecrawl-first bypass

**Problem:** For non-USD currencies on geo-redirect domains (Bambu Lab, Anycubic, Creality, etc.), the Shopify JSON API always returns USD prices regardless of region headers. The function wastes time trying Shopify JSON first, then falling back to Firecrawl.

**Fix:** Add a check before the Shopify JSON attempt: if the domain is a known geo-redirector AND the requested currency is not USD, skip straight to Firecrawl with the correct location.

Insert after the `shouldAlwaysUseFirecrawl` check (around line 2596) and before the standard Shopify path:

```
} else if (isGeoRedirectDomain(urlToFetch) && expectedCurrency !== 'USD') {
  console.log(`Geo-redirect domain with ${expectedCurrency}, using Firecrawl directly`);
  result = await fetchPriceWithFirecrawl(urlToFetch, expectedCurrency, brandConfig, false, productType);
```

**Also:** Add `store.bambulab.com` to `shouldAlwaysUseFirecrawl` (line 1669), since their JSON API is completely disabled and always returns errors:

```typescript
const unreliableJsonStores = ['amolen.com', 'store.bambulab.com'];
```

### 2. `_shared/regional-fetch.ts` -- Export helper

Add a convenience function that edge functions can use to check if a URL+currency combo should bypass Shopify JSON:

```typescript
export function shouldUseFirecrawlForRegion(url: string, currency: string): boolean {
  return isGeoRedirectDomain(url) && currency !== 'USD';
}
```

### 3. `PricingData.tsx` -- Show extraction source in sync results

**Problem:** Admins cannot see which extraction method was used (Shopify JSON vs Firecrawl) after a price sync.

**Fix:** The `get-current-price` response already includes a `source` field ('shopify' or 'firecrawl'). Capture it in the `SyncResult` type and display it as a small badge next to the synced price.

- Add `source?: string` and `location?: string` to the `SyncResult` interface
- Store `data.source` from the edge function response into the sync result
- Show a small "Firecrawl" or "Shopify" badge in the price cell after sync, with the region location if Firecrawl was used

### 4. `PricingData.tsx` -- Regional store rows already have action buttons

After reviewing the code (lines 1425-1468), the child store rows already have sync, test, and external link buttons. No fix needed here -- the buttons are present for all rows that have a `productUrl`.

---

## Technical Details

### Files Modified

1. **`supabase/functions/get-current-price/index.ts`**
   - Line 1669: Add `'store.bambulab.com'` to `unreliableJsonStores` array
   - Lines 2596-2600: Insert geo-redirect Firecrawl-first condition before the standard Shopify path

2. **`supabase/functions/_shared/regional-fetch.ts`**
   - Add exported `shouldUseFirecrawlForRegion(url, currency)` helper function

3. **`src/pages/admin/PricingData.tsx`**
   - Update `SyncResult` interface to include `source?: string`
   - Capture `data.source` in `syncSinglePrice` callback
   - Display extraction source badge in the price cell after sync

### No Database Changes

All changes are to edge function routing logic and admin UI display.

### Impact

- Non-USD syncs on geo-redirect domains (Bambu Lab, Anycubic, Creality, eSUN, etc.) will complete faster by skipping the failing Shopify JSON attempt
- Bambu Lab US syncs will also go straight to Firecrawl since their JSON API is disabled
- Admins gain visibility into which extraction method produced each price

