

# Bambu Lab Geo-Redirect Price Contamination: Diagnosis and Fix

## Confirmed Root Cause

The edge function logs prove the contamination conclusively:

```
[BAMBULAB] Extracting: https://us.store.bambulab.com/products/pla-sparkle region=US currency=USD
[BAMBULAB] ✓ 31.99 CAD available=true
[BAMBULAB] Currency mismatch: got CAD, expected USD

[BAMBULAB] Extracting: https://eu.store.bambulab.com/products/pla-sparkle region=EU currency=EUR
[BAMBULAB] ✓ 31.99 CAD available=true
[BAMBULAB] Currency mismatch: got CAD, expected EUR

[BAMBULAB] Extracting: https://au.store.bambulab.com/products/pla-sparkle region=AU currency=AUD
[BAMBULAB] ✓ 31.99 CAD available=true
[BAMBULAB] Currency mismatch: got CAD, expected AUD
```

**Every region returns the same price (31.99 CAD)**. Bambu Lab's server detects the Edge Function's IP (eu-central-1, Frankfurt) and serves Canadian pricing regardless of which subdomain (us./uk./eu./au.) is requested. The spoofed `CF-IPCountry` and `Accept-Language` headers are ignored because Bambu Lab's CDN performs its own IP-based geo-detection server-side.

## Audit Task Results

### Task 1: Redirect Behavior
- `redirect: "follow"` is used (line 172) -- so any server-side redirect is followed silently
- The response URL is never logged, so we can't see if a redirect occurred
- The JSON-LD `priceCurrency` field contains `CAD` for all regions, confirming the server is serving Canadian content

### Task 2: Currency Source
- Currency is read correctly from JSON-LD `priceCurrency` (line 95 in extractPriceFromJsonLd) -- this is **not** the bug
- The bug is that the **price value itself** is wrong. The page serves Canadian pricing to our German IP, so we get 31.99 CAD even when requesting the US store
- The extractor correctly reports the mismatch but still returns the contaminated price as "success"

### Task 3: Firecrawl Availability
- `FIRECRAWL_API_KEY` is configured in secrets (confirmed)
- `price-extract-firecrawl.ts` exists in `_shared/` with full retry logic
- `get-current-price-v2` already imports and uses `extractFirecrawlPrice` as a Shopify fallback
- The Firecrawl extractor uses `getFirecrawlLocation(currency)` which maps currencies to country codes
- API pattern: `POST https://api.firecrawl.dev/v1/scrape` with `Authorization: Bearer ${apiKey}`

### Task 4: Firecrawl Geo-Targeting
- Firecrawl supports `location: { country: "US", languages: ["en"] }` parameter
- `getFirecrawlLocation()` in `price-utils.ts` already maps USD->US, CAD->CA, GBP->GB, EUR->DE, AUD->AU
- Firecrawl proxies from the target country, bypassing Bambu Lab's IP-based geo-detection
- However, Firecrawl returns **markdown** by default, which strips JSON-LD. We need `formats: ["html"]` to preserve structured data

## The Fix: Firecrawl-Powered Bambu Lab Extractor

Replace direct `fetch()` with Firecrawl scraping using geo-targeted `location` parameter, then parse JSON-LD from the returned HTML.

### Changes to `price-extract-bambulab.ts`

1. Add Firecrawl as the **primary** extraction method with geo-targeting
2. Keep direct fetch as a **fallback** (for when Firecrawl is unavailable or rate-limited)
3. When currency mismatch is detected on direct fetch, flag it as contaminated and return failure instead of success
4. Log both requested URL and actual response URL for redirect debugging

#### Implementation detail:

```text
extractBambuLabPrice(url, currency)
  |
  v
[1] Try Firecrawl with location: { country: regionFromCurrency }
    - formats: ["html"] to preserve JSON-LD
    - Parse JSON-LD from returned HTML
    - If priceCurrency matches expected -> return success
  |
  v (if Firecrawl fails or not configured)
[2] Fallback: Direct fetch (current method)
    - If priceCurrency matches expected -> return success
    - If priceCurrency MISMATCHES -> return failure with "geo_redirect_contamination" error
      (instead of current behavior of returning wrong price as success)
```

### Currency mismatch = failure (critical behavioral change)

Currently, when the extractor gets CAD but expected USD, it logs a warning but returns `success: true` with the wrong price. This is the most damaging behavior -- it writes incorrect prices to the database.

After the fix: currency mismatch on direct fetch = `success: false` with error `"geo_redirect_contamination"`. This prevents bad data from being persisted.

### Specific code changes

**File: `supabase/functions/_shared/price-extract-bambulab.ts`**

- Add `FIRECRAWL_API_KEY` check at the start
- Add new function `extractViaFirecrawl(url, region, currency)` that:
  - Calls Firecrawl API with `formats: ["html"]` and `location: { country: X }`
  - Parses JSON-LD from the returned HTML using existing `extractJsonLdBlocks()`
  - Returns price only if `priceCurrency` matches expected currency
- Modify `extractBambuLabPrice()` to:
  - Try Firecrawl first
  - Fall back to direct fetch
  - On direct fetch: treat currency mismatch as failure, not success
- Add region-to-country mapping: `{ US: "US", CA: "CA", UK: "GB", EU: "DE", AU: "AU" }`

**File: `supabase/functions/get-current-price-v2/index.ts`**

- No changes needed. The bambulab case already calls `extractBambuLabPrice` and handles the PriceResponse.

**File: `supabase/functions/_shared/price-platforms.ts`**

- No changes needed. Detection is correct.

### Expected outcome after deployment

| Region | Before (contaminated) | After (Firecrawl geo-targeted) |
|--------|----------------------|-------------------------------|
| US | 31.99 CAD (wrong) | ~25.99 USD (correct) |
| CA | 31.99 CAD | 31.99 CAD (correct) |
| UK | 31.99 CAD (wrong) | ~19.99 GBP (correct) |
| EU | 31.99 CAD (wrong) | ~23.99 EUR (correct) |
| AU | 31.99 CAD (wrong) | ~39.99 AUD (correct) |

