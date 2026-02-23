
# Fix Price Extraction Engine — 5 Critical Bugs

## Problem Summary
The price sync system (`resync-bambu-prices` and `validate-printer-urls`) extracts wrong prices due to five distinct bugs: reading strikethrough prices instead of sale prices, picking combo variants instead of base models, ignoring region-encoded variants, no fallback chain when Shopify .json is blocked, and failing to handle ProductGroup JSON-LD schemas.

## Changes

### 1. Create Shared Price Extraction Module
**New file: `supabase/functions/_shared/printer-price-extraction.ts`**

A reusable module containing the multi-tier extraction engine used by both `resync-bambu-prices` and `validate-printer-urls`.

Core components:
- **`ExtractionResult` interface** -- Stores current_price, compare_at_price, currency, variant_name, extraction_method, confidence, and raw_variants_found
- **`selectBestVariant(variants, targetRegion)`** -- Variant selection logic:
  1. If variant titles encode regions (Sovol pattern: "US / Only SV06"), filter to target region first
  2. Exclude titles containing: Combo, Bundle, Kit, Pack, Set, AMS, "2*", "3*"
  3. Pick cheapest available variant from remaining
  4. If all excluded, fall back to cheapest overall and flag as combo
- **`extractFromShopifyJson(url, region)`** -- Tier 1: Fetch `{url}.json`, apply `selectBestVariant`, return price from `variant.price` and compare_at from `variant.compare_at_price`
- **`extractFromJsonLd(html, region)`** -- Tier 2: Parse all JSON-LD blocks, handling:
  - `@type: "Product"` -- read `offers.price` as current price, `offers.priceSpecification.price` (where priceType = StrikethroughPrice) as compare_at/MSRP
  - `@type: "ProductGroup"` -- iterate `hasVariant[]`, each is a Product; apply `selectBestVariant` logic on them
  - `@graph` arrays -- find Product or ProductGroup within
- **`extractFromMetaTags(html)`** -- Tier 3: Parse `og:price:amount`, `product:price:amount`, `itemprop="price"`
- **`extractPrice(url, region)`** -- Orchestrator: tries Tier 1 -> 2 -> 3 -> returns manual fallback

Safety rules built into the module:
- Never return null/0 as a valid price
- If extracted price differs from a provided `oldPrice` by more than 40%, return with `confidence: 'low'` and a flag `requiresReview: true`
- All results include `extraction_method` for audit

### 2. Rewrite `resync-bambu-prices` Edge Function
**Modified file: `supabase/functions/resync-bambu-prices/index.ts`**

Changes:
- Import and use the shared `extractPrice` function instead of the inline `findBaseVariant` + raw `.json` fetch
- For Bambu Lab specifically, the Shopify .json endpoint works but the variant selection was wrong -- now uses `selectBestVariant` which excludes Combo/AMS variants
- The JSON-LD fallback (Tier 2) handles Bambu Lab's `ProductGroup` schema correctly, reading `offers.price` (not `priceSpecification.price`) as the current price
- Add `extraction_method` and `confidence` fields to the price_history log entries
- Skip auto-update if confidence is 'low' (>40% change) -- instead log as anomaly for manual review
- Preserve existing price if extraction fails entirely (never overwrite with null)

### 3. Fix `validate-printer-urls` Price Extraction
**Modified file: `supabase/functions/validate-printer-urls/index.ts`**

Changes:
- Replace inline `extractShopifyPrice` (which reads `variants[0].price` -- Bug 2) with the shared module's `extractPrice`
- Replace inline `extractHtmlPrice` (which doesn't handle ProductGroup -- Bug 5) with the shared module
- Both functions now use identical, correct extraction logic

### 4. Database Migration
**New migration** -- Add extraction metadata columns to `printers`:

```sql
ALTER TABLE printers ADD COLUMN IF NOT EXISTS price_extraction_method TEXT;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS price_confidence TEXT;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS price_requires_review BOOLEAN DEFAULT false;
```

These columns track how each printer's price was obtained and whether it needs manual verification.

## Technical Details

### Variant Selection Logic (Bug 2 + Bug 3 fix)

```text
Input: All variants from Shopify JSON or JSON-LD hasVariant[]
                    |
    [Step 1] Region filter (Sovol: "US / Only SV06" -> match "US")
                    |
    [Step 2] Exclude: /combo|bundle|kit|pack|set|ams|2\*|3\*/i
                    |
    [Step 3] Filter to available variants only
                    |
    [Step 4] Sort by price ascending, pick first (cheapest)
                    |
    [Fallback] If empty after Step 2, use all from Step 1,
               pick cheapest, flag is_combo = true
```

### JSON-LD Parsing (Bug 1 + Bug 5 fix)

```text
For each <script type="application/ld+json"> block:
  |
  +-- @type === "Product"
  |     offers.price = CURRENT PRICE (use this)
  |     offers.priceSpecification?.price where
  |       priceType = StrikethroughPrice = COMPARE_AT / MSRP
  |
  +-- @type === "ProductGroup"
  |     hasVariant[] -> array of Product objects
  |     Apply selectBestVariant() on these
  |     Each variant's offers.price = its current price
  |
  +-- @graph array
        Find Product or ProductGroup within, apply above
```

### 3-Tier Extraction Chain (Bug 4 fix)

```text
Tier 1: {url}.json (Shopify API)
  Works: Elegoo, Sovol, some Bambu Lab regions
  Blocked: Creality, Anycubic, Qidi, FlashForge (404)
          |
Tier 2: Fetch HTML -> parse JSON-LD
  Works: Bambu Lab (ProductGroup), Creality (Product), Anycubic (Product)
  Fails: Prusa (JS-rendered only)
          |
Tier 3: Fetch HTML -> meta tags (og:price:amount)
  Works: Most stores as fallback
  Fails: Prusa
          |
Tier 4: Return { method: 'manual', confidence: 'low' }
  -> Do NOT overwrite existing price
  -> Flag printer as price_requires_review = true
```

### Files Created
1. `supabase/functions/_shared/printer-price-extraction.ts` -- Shared extraction engine

### Files Modified
1. `supabase/functions/resync-bambu-prices/index.ts` -- Use shared module, fix all 5 bugs
2. `supabase/functions/validate-printer-urls/index.ts` -- Use shared module for price extraction
3. Database migration for extraction metadata columns

### Safety Guarantees
- Existing prices are NEVER overwritten with null/0
- Price changes exceeding 40% are flagged for review, not auto-applied
- Every price update logs extraction_method + variant_selected to price_history
- The extraction_method column on printers provides admin visibility into data provenance
