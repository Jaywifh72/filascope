

# Bambu Lab Platform Detection and JSON-LD Extractor

## Summary
Bambu Lab migrated US/CA/UK/EU/AU stores from Shopify to Next.js. JP remains on Shopify. The fix adds a dedicated `'bambulab'` platform type and a new JSON-LD extractor that fetches product pages with geo-spoofed headers.

## Changes

### 1. `supabase/functions/_shared/price-platforms.ts`
- Add `"bambulab"` to the `Platform` type union
- Add detection rule before the default `return "shopify"`: if URL contains `store.bambulab.com` or `bambulab.com`, return `"bambulab"` -- except JP URLs which stay as `"shopify"`

### 2. `supabase/functions/_shared/price-types.ts`
- Add `"bambulab-jsonld"` to the `source` union on `PriceResponse` (line 36)
- Add `"bambulab_jsonld"` to the `method` union (line 47)

### 3. `supabase/functions/_shared/price-extract-bambulab.ts` (NEW, ~120 lines)
Dedicated extractor for Bambu Lab's Next.js stores:

- **Fetch**: Use `fetchRegionalStore()` from `regional-fetch.ts` with the detected region to handle geo-redirect cascading automatically
- **Parse**: Extract all `<script type="application/ld+json">` blocks, find the one with `@type: "ProductGroup"` or `"Product"`
- **Variant selection** (Bambu Lab-specific):
  - Iterate `hasVariant` array (or `offers` array)
  - Score each variant: prefer "Refill" + "1kg" (highest priority), then "Filament with spool"/"spool" + "1kg", then first available
  - If `targetWeightGrams` is provided, use weight matching instead
- **Currency**: Trust `priceCurrency` from JSON-LD, log warning if it mismatches expected currency
- **Return**: Standard `PriceResponse` with `source: "bambulab-jsonld"`, `method: "bambulab_jsonld"`
- **Error handling**: Return `is404: true` on 404, timeout errors via `withTimeout`

### 4. `supabase/functions/get-current-price-v2/index.ts`
- Import `extractBambuLabPrice` from `../_shared/price-extract-bambulab.ts`
- Add `case "bambulab":` in the switch statement (between the direct-store cases and the shopify default):
```text
case "bambulab":
  result = await extractBambuLabPrice(urlToFetch, expectedCurrency, targetWeightGrams);
  break;
```

## Architecture Notes
- JP Bambu Lab URLs (`jp.store.bambulab.com`) continue routing through the Shopify extractor -- no change needed
- No Firecrawl fallback required -- JSON-LD is server-side rendered and sufficient
- `regional-fetch.ts` already lists `store.bambulab.com` and `bambulab.com` in `GEO_REDIRECT_DOMAINS` -- the `fetchRegionalStore()` function handles the full cascade (direct -> spoofed -> follow redirect)
- The existing `extractJsonLdPrice()` in `price-extract-jsonld.ts` picks the cheapest variant globally; the new Bambu Lab extractor needs custom variant selection (Refill vs Spool) so it parses JSON-LD directly rather than delegating to the generic function

## File Summary

| File | Action | Lines changed |
|---|---|---|
| `_shared/price-platforms.ts` | Edit | ~5 lines added |
| `_shared/price-types.ts` | Edit | 2 union members added |
| `_shared/price-extract-bambulab.ts` | New | ~120 lines |
| `get-current-price-v2/index.ts` | Edit | ~5 lines added |

