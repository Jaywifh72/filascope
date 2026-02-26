

# Refactor: Consolidate Price Functions into `get-current-price-v2`

## Constraint: Supabase Edge Function File Structure

Supabase edge functions only support a single `index.ts` per function directory -- no subfolders like `extractors/` or `utils/` are allowed within a function. However, functions **can** import from `supabase/functions/_shared/`. The architecture must use `_shared/` for all module files, with `index.ts` as a thin router.

## Target Architecture

```text
supabase/functions/
  _shared/
    price-types.ts          (EXISTS, ~90 lines)  -- PriceResult, PriceResponse, etc.
    price-utils.ts          (EXISTS, ~260 lines) -- parseEuropeanPrice, validation, etc.
    price-db.ts             (EXISTS, ~213 lines) -- writePrice, updateStockStatus, lookupFilament
    price-regional.ts       (EXISTS, ~170 lines) -- regional URL transforms
    price-extract-shopify.ts   (NEW, ~180 lines) -- Shopify JSON API extraction
    price-extract-wc.ts        (NEW, ~170 lines) -- WooCommerce WC Store API v1 + JSON-LD
    price-extract-jsonld.ts    (NEW, ~80 lines)  -- Generic JSON-LD structured data
    price-extract-firecrawl.ts (NEW, ~120 lines) -- Firecrawl markdown scraping
    price-timeout.ts           (NEW, ~20 lines)  -- withTimeout(promise, ms) wrapper
    price-platforms.ts         (NEW, ~60 lines)  -- detectPlatform, isShopify, isWooCommerce
  get-current-price-v2/
    index.ts                   (NEW, ~100 lines) -- Router only
```

## File Responsibilities

### `_shared/price-timeout.ts` (~20 lines)
- `withTimeout<T>(promise: Promise<T>, ms: number): Promise<T>` -- wraps any promise with a timeout race
- Single reusable utility replacing the 4 duplicated `fetchWithTimeout` functions

### `_shared/price-platforms.ts` (~60 lines)
- `detectPlatform(url): "shopify" | "woocommerce" | "creality" | "extrudr" | "treed" | "prusa" | "geeetech" | "unknown"`
- `isShopify(url): boolean`
- `isWooCommerce(url): boolean`
- `extractSlug(url): string | null` -- WooCommerce `/product/slug` extraction
- `extractHandle(url): string | null` -- Shopify `/products/handle` extraction
- Consolidates platform detection currently scattered across 4 functions

### `_shared/price-extract-shopify.ts` (~180 lines)
- `extractShopifyPrice(url, currency, targetWeightGrams?): Promise<PriceResult>`
- `selectBestVariantByWeight(variants, title, targetWeight): ShopifyVariant`
- Geo-redirect handling (direct, spoofed headers, follow redirect)
- Returns standard `PriceResult` type
- Imports: `price-timeout`, `price-utils` (for weight/diameter parsing), `price-types`

### `_shared/price-extract-wc.ts` (~170 lines)
- `extractWooCommercePrice(url, domain): Promise<PriceResult>`
- WC Store API v1: `GET /wp-json/wc/store/v1/products?slug={slug}`
- Price parsing: `prices.price / 10^prices.currency_minor_unit`
- Variable products: fetch `/variations`, return cheapest in-stock
- `jsonLdFallback(url, domain): Promise<PriceResult | null>` -- fallback path
- Cloudflare detection, 429 retry
- Imports: `price-timeout`, `price-types`

### `_shared/price-extract-jsonld.ts` (~80 lines)
- `extractJsonLdPrice(html, expectedCurrency, sourceUrl): PriceResult | null`
- Parses `<script type="application/ld+json">` blocks for Product/@type with offers
- Handles both single and array offers
- Used by Creality, Extrudr, Prusa, Geeetech extractors and as WC fallback
- Pure function (no fetch, no side effects)

### `_shared/price-extract-firecrawl.ts` (~120 lines)
- `extractFirecrawlPrice(url, currency, productType?): Promise<PriceResult>`
- Firecrawl API call with retry (up to 3 attempts)
- Sale price extraction, generic currency-symbol price extraction
- Currency mismatch detection
- Imports: `price-utils` (getCurrencySymbol, removeSavingsAmounts, extractSalePriceBeforeSave)

### `get-current-price-v2/index.ts` (~100 lines)
Router-only entry point:
1. Parse request body (`productUrl`, `currency`, `forceRefresh`, `targetWeightGrams`, `productType`)
2. Call `detectPlatform(url)` to determine extractor
3. Apply regional URL transform
4. Check rate limit if `forceRefresh`
5. Dispatch to correct extractor:
   - `shopify` -> `extractShopifyPrice()`, fallback to `extractFirecrawlPrice()`
   - `woocommerce` -> `extractWooCommercePrice()`
   - `creality/extrudr/treed/prusa/geeetech` -> direct HTML fetch + `extractJsonLdPrice()`, platform-specific logic stays inline (Creality slug discovery, Extrudr URL normalization, TreeD API) -- these are small enough to keep in the router OR split into a `price-extract-direct.ts` (~150 lines)
   - `unknown` -> `extractFirecrawlPrice()`
6. Log extraction attempt via `logExtractionAttempt()`
7. Persist via `updateFilamentStockStatus()` on success
8. Return JSON response

## Standard Return Type

All extractors return the same `PriceResult` interface (added to `price-types.ts`):

```typescript
interface PriceResult {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
  stockStatus: StockStatus;
  method: string;       // "shopify_json" | "wc_store_api" | "json_ld" | "firecrawl" | ...
  source: string;       // "shopify" | "woocommerce" | "html" | "firecrawl"
  error?: string;
  is404?: boolean;
  weightGrams?: number | null;
  diameterMm?: number | null;
  variantTitle?: string | null;
}
```

## What Happens to Existing Functions

| Function | Action |
|---|---|
| `get-current-price-wc` | Keep deployed as-is (proven, working for AzureFilm) |
| `get-current-price-shopify` | Delete after v2 verified |
| `get-current-price-direct` | Delete after v2 verified |
| `get-current-price-scrape` | Delete after v2 verified |
| `get-current-price` | Keep frozen as legacy fallback |

## Implementation Order

1. Create `_shared/price-timeout.ts` (trivial, no risk)
2. Create `_shared/price-platforms.ts` (pure detection logic)
3. Create `_shared/price-extract-jsonld.ts` (extract from direct/wc functions)
4. Create `_shared/price-extract-shopify.ts` (extract from shopify function)
5. Create `_shared/price-extract-wc.ts` (extract from wc function)
6. Create `_shared/price-extract-firecrawl.ts` (extract from scrape function)
7. Create `get-current-price-v2/index.ts` (thin router importing all extractors)
8. Update `src/utils/priceEndpointRouter.ts` to route everything to `get-current-price-v2` (except AzureFilm which stays on `get-current-price-wc`)
9. Deploy and verify
10. Delete old `get-current-price-shopify`, `get-current-price-direct`, `get-current-price-scrape` directories

## Line Count Summary

| File | Lines | Role |
|---|---|---|
| `_shared/price-timeout.ts` | ~20 | Timeout wrapper |
| `_shared/price-platforms.ts` | ~60 | Platform detection |
| `_shared/price-extract-jsonld.ts` | ~80 | JSON-LD parser |
| `_shared/price-extract-firecrawl.ts` | ~120 | Firecrawl scraper |
| `_shared/price-extract-wc.ts` | ~170 | WooCommerce extractor |
| `_shared/price-extract-shopify.ts` | ~180 | Shopify extractor |
| `get-current-price-v2/index.ts` | ~100 | Router + direct-store handlers |
| **Total new code** | **~730** | |

Every extractor stays under 200 lines. All number parsing lives in `price-utils.ts`. The router contains zero extraction logic.

