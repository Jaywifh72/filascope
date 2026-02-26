

# Refactor: Split `get-current-price` Monolith into Deployable Modules

## Problem

The `get-current-price` edge function is ~4,600 lines in a single `index.ts` file. It consistently fails to deploy with Supabase platform 500 errors due to size. Both `get-current-price` and `get-current-price-v2` are essentially identical copies of the same monolith. The only reliably deployable price function is `get-current-price-wc` at ~390 lines.

## Architecture

Split the monolith into **4 platform-specific edge functions** + **shared modules** in `_shared/`. The frontend already routes AzureFilm to `get-current-price-wc`; we extend this pattern to all brands.

```text
Frontend / Orchestrator
       |
       +-- azurefilm.com ---------> get-current-price-wc     (~390 lines, EXISTS)
       +-- store.creality.com ----> get-current-price-direct  (~700 lines, NEW)
       |   extrudr.com
       |   treedfilaments.com
       |   prusa3d.com
       |   geeetech.com
       +-- *.shopify.com --------> get-current-price-shopify (~900 lines, NEW)
       |   (polymaker, elegoo,
       |    esun, sunlu, etc.)
       +-- everything else ------> get-current-price-scrape  (~600 lines, NEW)
           (firecrawl-based)
```

## New Shared Modules

### `_shared/price-types.ts` (~80 lines)
All shared interfaces and type definitions extracted from the monolith:
- `PriceResponse` interface (with all fields: status, method, price_alert, etc.)
- `StockStatus` type
- `BrandExtractionConfig` and `BrandConfig` interfaces
- `RegionalStoreConfig` interface
- `ShopifyVariant` and `ShopifyProduct` interfaces

### `_shared/price-utils.ts` (~250 lines)
Pure utility functions with no external dependencies:
- `parseEuropeanPrice()`, `cleanEuropeanPrice()`, `parsePriceForDomain()`
- `extractSalePriceBeforeSave()`, `removeSavingsAmounts()`
- `validateFilamentPrice()`, `validateProductPrice()`, `CURRENCY_PRICE_RANGES`
- `detectCurrencyFromContent()`, `getCurrencySymbol()`, `buildCurrencyPricePattern()`
- `extractWeightFromContent()`, `extractDiameterFromContent()`
- `parseWeightFromTitle()`, `parseDiameter()`, `parsePackQuantity()`
- `is404Content()`, `isCloudflareBlock()`
- `detectStockStatus()`

### `_shared/price-db.ts` (~300 lines)
All database interaction helpers:
- `getSupabaseClient()` (service role)
- `findBrandConfigByUrl()` - brand config lookup
- `logExtractionAttempt()` - extraction log insert
- `canForceRefresh()` - rate limit check
- `logBrokenUrl()` - broken URL tracking
- `updateFilamentStockStatus()` - stock + discrepancy detection + price persistence
- `getRegionalPriceColumn()` - currency-to-column mapping

### `_shared/price-regional.ts` (~250 lines)
Regional URL transformation logic (supplements existing `_shared/regional-fetch.ts`):
- `REGIONAL_STORE_CONFIGS` map (BambuLab, Polymaker, Elegoo, Anycubic, Creality, Extrudr, Prusa)
- `transformToRegionalUrl()`
- `normalizeCrealityUrl()`
- `CURRENCY_TO_REGION` map
- `getFirecrawlLocation()`

## New Edge Functions

### 1. `get-current-price-shopify` (~900 lines)
Handles all Shopify-based stores (the majority of brands).

Contains:
- `fetchShopifyPrice()` - JSON API fetch with geo-bypass headers
- `selectBestVariantByWeight()` - smart variant selection (consumer spool preference)
- `fetchPriceWithFirecrawl()` - Firecrawl fallback when Shopify JSON fails
- `extractBambuLabPrice()` / `extractPriceWithConfig()` - markdown price extraction
- `getMainProductSection()` - cross-sell/accessory content filtering
- 404 resolution system: `attemptSearchResolution()`, `handle404WithResolution()`, `handleUrlRedirect()`
- `extractPrinterPrice()` - printer-specific extraction (higher price range)
- Main router: Shopify JSON first, Firecrawl fallback, multi-currency handling

Imports from `_shared/`: price-types, price-utils, price-db, price-regional, regional-fetch

### 2. `get-current-price-direct` (~700 lines)
Handles custom storefronts that use direct HTML fetch + JSON-LD extraction.

Contains:
- `fetchCrealityPriceDirect()` - Creality HTML fetch + JSON-LD
- `extractCrealityPriceFromHtml()` - Creality JSON-LD parser
- `generateCrealitySlugVariants()` + `attemptCrealitySlugDiscovery()` - slug discovery for regional 404s
- `fetchExtrudrPriceDirect()` - Extrudr JSON-LD (EUR-only)
- `normalizeExtrudrUrl()` - region code injection
- `fetchTreeDPrice()` - TreeD backend API (EUR cents/kg)
- `extractCrealityPrice()` - legacy markdown fallback
- `extractOpenCartPrice()` - Geeetech legacy
- Main router: detects storefront type from URL domain, dispatches to correct handler

Imports from `_shared/`: price-types, price-utils, price-db, price-regional

### 3. `get-current-price-scrape` (~600 lines)
Pure Firecrawl-based extraction for unknown or generic platforms.

Contains:
- `fetchPriceWithFirecrawl()` - Firecrawl API call with retries, location spoofing
- `extractPriceWithConfig()` - configured brand extraction patterns
- `extractBambuLabPrice()` - generic multi-currency price extraction
- Prusa MK404 location-gate detection
- Main router: brand config lookup, Firecrawl dispatch

Imports from `_shared/`: price-types, price-utils, price-db, price-regional, regional-fetch

### 4. `get-current-price-wc` (EXISTS, no changes needed)
Already deployed and working for WooCommerce stores (AzureFilm).

## Frontend Routing Changes

Update the routing logic in **8 files** that currently do:
```typescript
const fnName = url.includes('azurefilm.com') ? 'get-current-price-wc' : 'get-current-price';
```

Replace with a shared routing function:

```typescript
// src/utils/priceEndpointRouter.ts
export function getPriceEndpoint(url: string): string {
  const lower = url.toLowerCase();
  
  // WooCommerce stores
  if (lower.includes('azurefilm.com')) return 'get-current-price-wc';
  
  // Direct HTML/JSON-LD stores
  if (lower.includes('store.creality.com') || lower.includes('creality.com'))
    return 'get-current-price-direct';
  if (lower.includes('extrudr.com')) return 'get-current-price-direct';
  if (lower.includes('treedfilaments.com')) return 'get-current-price-direct';
  if (lower.includes('prusa3d.com')) return 'get-current-price-direct';
  if (lower.includes('geeetech.com')) return 'get-current-price-direct';
  
  // Shopify stores (default for most brands)
  return 'get-current-price-shopify';
}
```

Files to update:
- `src/hooks/useCurrentPrice.ts`
- `src/hooks/useLivePriceFetch.ts`
- `src/hooks/useAdminPriceRefresh.ts`
- `src/pages/AdminPriceFreshness.tsx`
- `src/pages/admin/SyncMonitor.tsx`
- `src/components/admin/BrandExtractionEditor.tsx`
- `src/pages/admin/pricing/hooks/usePricingActions.ts`
- `src/pages/admin/pricing/constants.ts`

Also update `supabase/functions/sync-prices/index.ts` to use the same routing logic server-side.

## Implementation Order

1. Create `_shared/price-types.ts` -- interfaces only, no risk
2. Create `_shared/price-utils.ts` -- pure functions, testable
3. Create `_shared/price-db.ts` -- database helpers
4. Create `_shared/price-regional.ts` -- URL transformation
5. Create `get-current-price-direct/index.ts` -- Creality/Extrudr/TreeD
6. Create `get-current-price-shopify/index.ts` -- Shopify + Firecrawl fallback
7. Create `get-current-price-scrape/index.ts` -- generic Firecrawl
8. Create `src/utils/priceEndpointRouter.ts` -- shared frontend routing
9. Update all 8 frontend call sites to use the router
10. Update `sync-prices` to use server-side routing
11. Verify all 3 new functions deploy successfully (each under 1,000 lines)
12. Delete `get-current-price-v2` (redundant copy of the monolith)
13. Keep `get-current-price` frozen as legacy fallback (do not redeploy)

## Risk Mitigation

- The existing `get-current-price` remains deployed and functional as a fallback
- Each new function can be tested independently via the admin "Test" button
- The `get-current-price-wc` pattern is proven (deployed and working)
- If any new function fails to deploy, the router can temporarily fall back to `get-current-price`

