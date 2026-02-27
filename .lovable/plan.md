

# FormFutura Sync -- Complete Fix

## Root Causes Identified

1. **Stale Edge Function Deployment**: The `get-current-price-v2` function is still running old code that detects FormFutura as Shopify. The `formfutura.com -> magento` fix exists in source code but was never deployed. This causes every request to first try the Shopify JSON endpoint (which fails), wasting time before falling back to Firecrawl.

2. **Zero Regional URLs**: FormFutura has 0 entries in `product_regional_urls`. The sync engine checks for regional URLs first, finds none, and falls into the legacy path -- which only updates a single price column and doesn't participate in the regional sync health tracking.

3. **Redundant Fetch Calls**: 460 variants map to only 80 unique product URLs. Each variant triggers its own Firecrawl request, but variants sharing the same URL will get the same price. At 2 seconds rate limiting per call, this creates massive waste and frequently hits the 5-minute timeout before completing.

4. **455 of 460 products stale (30+ days)**: Consequence of the above -- most products never get reached before the timeout.

## Fix Plan

### Fix 1: Redeploy `get-current-price-v2`
Deploy the edge function so the `formfutura.com -> magento` platform detection takes effect. This eliminates the failed Shopify JSON attempt and routes directly to Firecrawl with the 5000ms wait.

### Fix 2: Seed Regional URLs for FormFutura
Create a database migration that populates `product_regional_urls` for FormFutura products. Since FormFutura is a single EUR-only store (no regional subdomains), each unique product URL gets one EU region entry. This brings FormFutura into the regional sync system and makes it visible in the Brand Region Matrix.

```sql
INSERT INTO product_regional_urls (product_id, product_type, region_code, store_url, currency_code, is_primary)
SELECT DISTINCT ON (f.product_url)
  f.id, 'filament', 'EU', f.product_url, 'EUR', true
FROM filaments f
WHERE f.vendor ILIKE 'formfutura'
  AND f.product_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM product_regional_urls pru 
    WHERE pru.product_id = f.id AND pru.product_type = 'filament'
  );
```

### Fix 3: Add URL deduplication to `sync-prices` legacy fallback
In the legacy fallback path of `sync-prices/index.ts`, add a URL-level cache so that when multiple variants share the same `product_url`, only the first variant triggers a Firecrawl call. Subsequent variants reuse the cached extraction result. This reduces FormFutura from ~80 Firecrawl calls to exactly 80, and avoids the timeout.

The change adds a `Map<string, ExtractionResult>` cache before the product loop. In the legacy fallback section, before calling `extractPrice`, check if the URL was already fetched. If so, reuse the result (still updating the DB row for each variant).

### Fix 4: Add FormFutura to EUR-only brand list
In `sync-prices/index.ts`, the `isEurOnlyBrand` check currently only covers `extrudr`. Add `formfutura` so prices are correctly written to the `price_eur` column instead of `variant_price` (USD).

```typescript
const isEurOnlyBrand = ['extrudr', 'formfutura'].includes(vendor.toLowerCase());
```

## Files Modified

1. **`supabase/functions/sync-prices/index.ts`** -- Add URL dedup cache + FormFutura to EUR-only list
2. **New migration** -- Seed `product_regional_urls` for FormFutura EU entries
3. **Edge function deployment** -- Redeploy `get-current-price-v2`

## Expected Impact

- FormFutura sync completes within 3-4 minutes instead of timing out
- All 80 unique product URLs get fresh prices per sync cycle
- Prices correctly written to `price_eur` column
- FormFutura appears in Regional Health dashboard under EU region
- No more wasted Shopify JSON attempts (direct Firecrawl routing)

