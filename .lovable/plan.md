

# Extrudr Reliability Improvements

## Change 1: Add Firecrawl fallback for Extrudr extraction

In `supabase/functions/get-current-price-v2/index.ts`, update the `case "extrudr":` block (lines 61-63) to include a Firecrawl fallback when direct fetch fails but is not a 404, mirroring the existing Shopify pattern.

```typescript
case "extrudr":
  result = await fetchExtrudrPrice(urlToFetch, expectedCurrency);
  // Firecrawl fallback if direct fetch fails (but not on 404)
  if (!result.success && !result.is404) {
    console.log("[PRICE-V2] Extrudr direct failed, trying Firecrawl fallback");
    result = await extractFirecrawlPrice(urlToFetch, expectedCurrency, productType as ProductType);
  }
  break;
```

## Change 2: Log Extrudr extraction failures to `scrape_errors`

In `supabase/functions/sync-prices/index.ts`, in the legacy fallback path (around line 614-617 where `failed++` and `errors.push(...)` happen for non-success, non-unavailable extractions), add an insert to `scrape_errors`. This is the same pattern used by `sync-brand-products` and the orchestrators.

```typescript
// After the existing failed++ and errors.push:
try {
  await supabase.from('scrape_errors').insert({
    brand_slug: vendor,
    error_type: extraction.error?.includes('timeout') ? 'timeout' 
      : extraction.error?.includes('404') ? '404' 
      : extraction.error?.includes('blocked') ? 'cloudflare' 
      : 'extraction_failed',
    error_message: extraction.error || 'Unknown extraction error',
    url_attempted: productUrl,
    region: isEurOnlyBrand ? 'EU' : 'US',
    filament_id: productType === 'filament' ? product.id : null,
  });
} catch (scrapeLogErr) {
  console.error('Failed to log scrape error:', scrapeLogErr);
}
```

The same logging should also be added in the regional URL processing path (around line 750+) where regional extraction failures occur, using `regionCode` and `storeUrl` for context.

## Technical Details

### Files to modify:
1. **`supabase/functions/get-current-price-v2/index.ts`** -- Add Firecrawl fallback to `case "extrudr"` (3 lines become 7 lines)
2. **`supabase/functions/sync-prices/index.ts`** -- Add `scrape_errors` insert in both the legacy fallback error path and the regional URL error path

### Deployment:
Both edge functions will be auto-deployed after editing.

### Impact:
- Extrudr products that fail direct HTML fetch will automatically retry via Firecrawl scraping before reporting failure
- All Extrudr sync failures will now appear in the Sync Monitor Errors tab with brand, region, error type, and URL context

