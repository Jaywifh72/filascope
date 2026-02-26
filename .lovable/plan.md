

# Fix Bambu Lab Sync Failures: Root Cause Analysis and Resolution

## Two Distinct Failure Categories

### Category 1: `geo_redirect_contamination` (14 failures)

**Root cause**: Firecrawl's geo-targeting proxy is intermittently unreliable. For ~6% of product/region combinations, Firecrawl returns HTML from a different region despite the `location` parameter. The strict currency validation correctly rejects this, then the direct-fetch fallback also fails (expected -- Frankfurt IP always gets wrong region). Both paths return null, so the error `geo_redirect_contamination` is returned.

**Affected**: UK (7), EU (3), AU (2) regions -- specific products only.

**Fix**: Add a single Firecrawl retry with a 2-second backoff when the first attempt returns a currency mismatch. Firecrawl's geo-proxy is probabilistic -- a second attempt often routes through a different exit node. This matches the retry pattern already used in `price-extract-firecrawl.ts` (line 30-35).

### Category 2: `HTTP 404` on JP (3 failures)

**Root cause**: These products genuinely don't exist on the JP Shopify store. PLA Matte, PLA Tough+, and Support for PA/PET are not sold in Japan. The Shopify `.json` endpoint returns 404.

**Affected**: JP only -- `pla-matte`, `pla-tough-upgrade`, `support-for-pa-pet`.

**Fix**: When the bambulab extractor receives a 404 from JP (which goes through the Shopify path), the response should include `notAvailableInRegion: true` so the UI shows a grey "N/A" badge instead of a red "Failed" badge. This is already supported by the `PriceResponse` type but not set for Bambu Lab JP 404s. The fix is in `get-current-price-v2` -- after the Shopify extractor returns `is404: true` for a `jp.store.bambulab.com` URL, set `notAvailableInRegion: true`.

## Changes

### File 1: `supabase/functions/_shared/price-extract-bambulab.ts`

**Change in `extractViaFirecrawl`**: When currency mismatch is detected, retry once with a 2-second delay before returning null.

Current flow:
```
Firecrawl attempt -> currency mismatch -> return null (immediate)
```

New flow:
```
Firecrawl attempt -> currency mismatch -> wait 2s -> retry -> currency mismatch again -> return null
```

This is a ~6 line change inside the `extractViaFirecrawl` function, wrapping the currency mismatch check (lines 182-186) in a retry loop.

### File 2: `supabase/functions/get-current-price-v2/index.ts`

**Change in the Shopify default case**: After the Shopify extractor returns a result, check if it's a 404 for a `bambulab.com` JP URL and add `notAvailableInRegion: true` to the response. This ensures JP 404s show as grey "N/A" badges.

Add after line 85 (after Firecrawl fallback block):
```typescript
// Mark Bambu Lab JP 404s as not-in-region (graceful skip)
if (result.is404 && productUrl.includes("jp.store.bambulab.com")) {
  result.notAvailableInRegion = true;
}
```

## Expected Outcome After Deploy

| Failure | Current Error | After Fix |
|---------|--------------|-----------|
| 14x geo_redirect_contamination | Hard fail, red badge | Most will succeed on retry; remaining few stay as failures (acceptable) |
| 3x JP 404 | Red "Failed" badge | Grey "N/A" badge (not_in_region) |

Net effect: ~14 failures reduced to ~2-3 (Firecrawl retry will resolve most geo mismatches). JP 404s reclassified from "failed" to "not available in region".
