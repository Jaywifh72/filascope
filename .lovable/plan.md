

# Fix Prusa Research Price Sync

## Problem

Prusa Research (www.prusa3d.com) uses a custom WooCommerce/Next.js storefront that renders prices entirely via JavaScript. Neither static HTML scraping nor Shopify JSON works. The `brand_sync_config` is already correctly set (`primary_extraction = 'json_ld'`, `shopify_json_available = false`), but JSON-LD and meta tags contain no price data on Prusa pages. The Firecrawl markdown fallback (Tier 4) fires but also returns no price because Prusa's pricing widget loads asynchronously and requires full JS rendering with geo-detection.

**Evidence**: Fetching the Core One product page returns 774 lines of markdown with zero price mentions. The HTML source also contains no structured price data -- prices are injected client-side based on the shipping country selector.

## Current Database State

- 10 Prusa products in DB (not 8 as originally stated)
- 3 already marked `discontinued = true`: MINI+, MINI+ Semi-assembled, MK3S+
- 7 active products: Core One, Core One L, CORE One+ Ultimate Edition, MK4S, Original Prusa XL (3 toolhead variants)
- All have `sync_status = 'never_synced'`
- All have US product URLs set, no regional URLs
- `brand_sync_config` already exists with correct settings

## Root Cause

Prusa's storefront is a Next.js app that:
1. Detects the user's country via Cloudflare geo headers
2. Loads pricing via a client-side API call (not embedded in HTML)
3. Shows a country/currency selector that changes prices dynamically
4. Has no JSON-LD, no meta tags, and no Shopify JSON for price data

Even Firecrawl's `waitFor: 3000` may not reliably capture the price because it depends on the geo-detection completing and the price widget rendering.

## Solution

### Step 1: Update `brand_sync_config` to use Firecrawl as primary

Change `primary_extraction` from `'json_ld'` to `'firecrawl'` so the engine skips the JSON-LD and meta tag tiers entirely and goes straight to Firecrawl markdown (Tier 4). This avoids wasting time on extraction methods that will never work for Prusa.

```text
UPDATE brand_sync_config SET
  primary_extraction = 'firecrawl',
  fallback_extraction = 'meta_tags',
  sync_notes = 'WooCommerce/Next.js. Prices rendered via JS. Firecrawl primary with waitFor=5000. Single global store with currency selector.'
WHERE brand_id = 'prusa-research';
```

### Step 2: Add a Prusa-specific Firecrawl extraction strategy

In `printer-price-extraction.ts`, add a new handler in the `extractPrice` orchestrator (similar to the Creality dedicated path) that detects Prusa URLs and:

1. Calls Firecrawl with `waitFor: 5000` (longer than default 3000ms to allow price widget to load)
2. Uses the `location` parameter to request rendering from the US (or target region)
3. Parses the rendered markdown for Prusa's specific price patterns

Add a new `isPrusaUrl()` check and `extractPrusaPrice()` function that:
- Detects `prusa3d.com` domain
- Calls Firecrawl with appropriate location settings
- Searches markdown for price patterns like `$1,349` near the product title or "Add to Cart" section
- Falls back to a regex scan of the full markdown for currency-prefixed prices within the $100-$5000 range

### Step 3: Handle the "no price found" case gracefully

If Firecrawl also fails to capture the price (which is possible given Prusa's aggressive client-side rendering), the sync should:
- Return `extraction_method: 'manual'` (not `'failed'`)
- Preserve the existing MSRP from the database
- Flag as `sync_status = 'manual_only'` with a note explaining why automated sync doesn't work

### Step 4: Mark 3 discontinued products properly

The 3 discontinued Prusa products (MINI+, MINI+ Semi-assembled, MK3S+) are already marked `discontinued = true` in the database. Ensure the sync engine's discontinued check (implemented earlier) catches them and skips sync.

Verify that:
- `product_url` is set to NULL for all 3 discontinued products (prevents sync attempts)
- MSRPs are preserved ($429, $549, $699)

### Step 5: Regional pricing consideration

Prusa uses a single global URL with a currency selector -- there are no separate regional storefronts. For now, only sync US prices (USD). Regional pricing (EUR) would require:
- Firecrawl rendering with EU location headers
- Parsing EUR prices from the rendered page
- This is a future enhancement, not part of this initial fix

## Technical Details

### Files to modify:
1. **`supabase/functions/_shared/printer-price-extraction.ts`**:
   - Add `isPrusaUrl()` helper
   - Add `extractPrusaPrice()` dedicated handler
   - Hook it into `extractPrice()` orchestrator before the standard tier loop (like Creality)

2. **Database updates** (via data operations):
   - Update `brand_sync_config` for Prusa to `primary_extraction = 'firecrawl'`
   - Set `product_url = NULL` for discontinued products
   - Leave active product URLs as-is

### New Prusa-specific markdown parsing patterns:
```text
Pattern 1: "$1,349" near "# Prusa CORE One" title
Pattern 2: "$1,349 USD" anywhere in first 2000 chars
Pattern 3: "from $1,349" or "starting at $1,349"
Pattern 4: Price in "Add to Cart" section context
```

### Firecrawl call configuration for Prusa:
```text
waitFor: 5000 (vs default 3000)
location: { country: 'US', languages: ['en-US'] }
onlyMainContent: true
formats: ['markdown']
```

## Expected Outcome

| Product | Status | Price Source |
|---------|--------|-------------|
| Core One | Active | Firecrawl USD |
| Core One L | Active | Firecrawl USD |
| CORE One+ Ultimate Edition | Active | Firecrawl USD |
| MK4S | Active | Firecrawl USD |
| Original Prusa XL (single) | Active | Firecrawl USD |
| Original Prusa XL (2-tool) | Active | Firecrawl USD |
| Original Prusa XL (5-tool) | Active | Firecrawl USD |
| MINI+ | Discontinued | MSRP preserved ($429) |
| MINI+ Semi-assembled | Discontinued | MSRP preserved ($549) |
| MK3S+ | Discontinued | MSRP preserved ($699) |

- **Best case**: 7 active products synced via Firecrawl, 3 discontinued skipped
- **Worst case**: Firecrawl can't render prices either -- all 7 active products marked `manual_only` with MSRPs preserved, 0 failures (graceful degradation)

## Risk

Prusa's site may not render prices even with Firecrawl because the price widget may require cookie consent, specific geo headers, or additional JS execution time. If the initial implementation doesn't capture prices, we can:
1. Increase `waitFor` to 8000ms
2. Try Firecrawl's `html` format instead of `markdown`
3. Fall back to manual price entry as the permanent solution for Prusa

