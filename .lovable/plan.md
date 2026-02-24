

# Fix Creality Regional Pricing: Wrong Matches, Missing Products, Price Sanity

## Problem Summary

Three distinct issues remain after previous Creality fixes:

1. **Wrong prices from accessory matches** -- Short model names like "K1" match accessories (e.g., "K1 Series Extrusion Kit" at C$18.99 instead of a $339 printer). The existing `EXCLUDE_KEYWORDS` filter misses items like "Extrusion Kit" that don't contain the blocked words.
2. **Products missing from myshopify backends** -- Some products (Sermoon D3, Ender-3 V2 Neo) exist on the custom storefront but aren't in the myshopify.com catalog, causing false `not_in_region` results.
3. **Unpredictable handle suffixes** -- Handles like `sermoon-d3-pro-3d-printer-qhqz` can't be guessed from the product name.

## Solution

### Fix 1: Price sanity check against US price (cross-region validation)

After the Creality pipeline extracts a regional price, compare it against the US price. If the regional price is less than 15% of the US price (after rough currency conversion), reject the match as a likely accessory.

**Where**: `extractCrealityRegionalPrice()` in `printer-price-extraction.ts`

**How**: 
- Pass the US price into the Creality extraction function (available as `current_price_usd_store` on the printer row)
- Add rough exchange rate constants (USD to CAD ~1.36, GBP ~0.79, EUR ~0.92, AUD ~1.55, JPY ~150)
- After extraction, compute: `regionalPrice / (usPrice * exchangeRate)`. If ratio < 0.15 or > 5.0, reject and retry discovery or mark `not_in_region`

This immediately catches the C$18.99 case (18.99 / (339 * 1.36) = 0.04, well below 0.15).

### Fix 2: Expand EXCLUDE_KEYWORDS and add minimum price filter

**Where**: `discoverCrealityRegionalHandle()` in `printer-price-extraction.ts`

**Changes**:
- Add to EXCLUDE_KEYWORDS: `kit|mount|cover|tube|clip|screw|bolt|motor|wheel|pulley|rail|guide|adapter|connector|mod|part|component|extrusion`
- After filtering by keywords, also filter by price: require at least one variant with price > $30 USD equivalent (rough check: any variant price > 30). This eliminates cheap accessories that slip through keyword filters.
- For the matched product, check that its cheapest variant price is within a reasonable range of printer pricing (> $50 equivalent)

### Fix 3: Custom storefront search fallback

When myshopify.com handle discovery fails, try the custom storefront's search before giving up.

**Where**: `extractCrealityRegionalPrice()` -- add a new step between myshopify discovery and the `not_in_region` fallback.

**New function**: `discoverCrealityHandleViaSearch(region, productTitle)`
- Fetch `https://store.creality.com/{region}/search?q={encodeURIComponent(productTitle)}`
- Parse the HTML response for product links matching `/products/{handle}` pattern
- Filter results to find the one whose title best matches the search query
- Return the discovered handle

**Flow update**:
```text
1. Try JSON-LD on custom storefront URL
2. Try handle discovery via myshopify.com catalog
3. NEW: Try handle discovery via custom storefront search
4. If handle found from either source, extract price
5. If nothing found, mark not_in_region
```

### Fix 4: Pass US price through the sync orchestrator

**Where**: `sync-printer-prices/index.ts`

**Changes**:
- After syncing US price (always first in the loop), store the US price result
- Pass it to `extractPrice()` for non-US regions via a new optional parameter `usPriceForSanity`
- In `extractCrealityRegionalPrice()`, use this value for cross-region validation

## Technical Details

### Files to modify

1. **`supabase/functions/_shared/printer-price-extraction.ts`**:
   - Add `CREALITY_ROUGH_EXCHANGE_RATES` constant
   - Add `usPriceForSanity` optional parameter to `extractPrice()` and `extractCrealityRegionalPrice()`
   - Add cross-region price validation after Creality extraction succeeds
   - Expand `EXCLUDE_KEYWORDS` regex with additional accessory terms
   - Add minimum price filter in `discoverCrealityRegionalHandle()` (filter products where all variants are < $30)
   - Add `discoverCrealityHandleViaSearch()` function for custom storefront search fallback
   - Integrate search fallback into `extractCrealityRegionalPrice()` flow

2. **`supabase/functions/sync-printer-prices/index.ts`**:
   - Track US extraction result price as `usSalePrice` after US region sync
   - Pass `usSalePrice` to `extractPrice()` for non-US Creality regions

### New function: `discoverCrealityHandleViaSearch`

```text
Input: region (e.g., "CA"), productTitle (e.g., "Sermoon D3")
Process:
  1. Fetch store.creality.com/{region}/search?q={title}
  2. Parse HTML for <a href="/{region}/products/{handle}"> links
  3. For each link, check if the associated text contains the product name
  4. Return the best-matching handle
Output: handle string or null
```

### Cross-region price validation logic

```text
CREALITY_ROUGH_EXCHANGE_RATES = { CA: 1.36, UK: 0.79, EU: 0.92, AU: 1.55, JP: 150 }

After extraction returns a price:
  expectedRange = usPrice * exchangeRate
  ratio = regionalPrice / expectedRange
  if ratio < 0.15:  → wrong match (accessory), reject
  if ratio > 5.0:   → suspicious, flag requires_review
  else: accept
```

### Updated extraction flow for Creality

```text
1. Try JSON-LD on custom storefront URL (existing)
2. Discover handle via myshopify.com catalog (existing, with expanded filters)
3. NEW: If myshopify discovery fails, try storefront search
4. Extract price via myshopify.com/{handle}.json or JSON-LD (existing)
5. NEW: Validate extracted price against US price
   - If too low (accessory match), discard and try next discovery method
   - If too high, flag requires_review
6. If all methods fail, mark not_in_region (existing)
```

