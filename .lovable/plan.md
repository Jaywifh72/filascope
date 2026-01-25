
# Regional Store Utilities Implementation Plan

## Overview
Create a centralized utility system in `src/utils/regionalStoreUtils.ts` that consolidates regional store URL generation, store information retrieval, and price fetching. This new utility will leverage the existing `brand_regional_stores` database table (69 records) and integrate with the `RegionContext` for seamless regional pricing.

## Current State Analysis
The project already has several related implementations that we will build upon:
- `useRegionalPriceV2.ts` - Fetches stores by `brand_id` from database
- `useRegionalPrice.ts` - Uses hardcoded column mappings for regional prices
- `useRegionalStore.ts` - Client-side URL transformation using `brandRegionalStores.ts`
- `priceDisplay.ts` - Price formatting utilities
- `RegionContext.tsx` - Central region/currency state with exchange rates

The new utility will unify these approaches with database-first store lookups.

## Technical Implementation

### 1. New File: `src/utils/regionalStoreUtils.ts`

#### Type Definitions
```text
RegionalStoreInfo {
  id: string
  brand_id: string
  region_code: RegionCode
  store_name: string
  base_url: string
  product_url_pattern: string | null
  currency_code: CurrencyCode
  ships_from_country: string | null
  free_shipping_threshold: number | null
  estimated_shipping_days: number | null
  is_primary: boolean
  is_active: boolean
  supports_local_shipping: boolean  // derived from ships_from_country matching region
}

RegionalPriceResult {
  displayPrice: number
  displayCurrency: CurrencyCode
  formattedPrice: string
  originalPrice: number
  originalCurrency: CurrencyCode
  isConverted: boolean
  conversionRate: number | null
  store: RegionalStoreInfo | null
  tooltipData: {
    originalFormatted: string
    rateInfo: string
  } | null
}

PriceDisplayOptions {
  showApproximate?: boolean
  compact?: boolean
  includeTooltip?: boolean
}
```

#### Function 1: `getRegionalStoreInfo`
```text
async function getRegionalStoreInfo(
  brandName: string | null,
  region: RegionCode
): Promise<RegionalStoreInfo | null>
```
- Query `brand_regional_stores` table joining with `automated_brands` on brand_name
- Filter by `region_code = region` and `is_active = true`
- Return matching store info or null
- Results will be cached per brand+region combination

#### Function 2: `getRegionalStoreUrl`
```text
async function getRegionalStoreUrl(
  brandName: string | null,
  region: RegionCode,
  productSlug?: string,
  fallbackOrder?: RegionCode[]
): Promise<{ url: string; storeRegion: RegionCode; isFromFallback: boolean }>
```
- First attempt: Get store for exact region
- Fallback chain: Use provided `fallbackOrder` or default from `REGION_FALLBACK_ORDER`
- URL construction:
  - If `product_url_pattern` exists and `productSlug` provided: interpolate `{sku}` placeholder
  - Otherwise return `base_url`
- Return the URL, actual region used, and whether fallback was used

#### Function 3: `getBrandRegionalStores`
```text
async function getBrandRegionalStores(
  brandName: string | null
): Promise<RegionalStoreInfo[]>
```
- Fetch all active stores for a brand
- Used by components that need to show "available regions" or store selector

#### Function 4: `formatRegionalPrice`
```text
function formatRegionalPrice(
  price: number,
  sourceCurrency: CurrencyCode,
  targetCurrency: CurrencyCode,
  exchangeRates: Map<string, number>,
  options?: PriceDisplayOptions
): RegionalPriceResult
```
- Calculate conversion if currencies differ
- Format with appropriate symbol and decimal places
- Include tooltip data with original price and conversion rate
- Add "~" prefix for converted prices

#### Function 5: `findBestStoreForRegion`
```text
async function findBestStoreForRegion(
  brandName: string | null,
  userRegion: RegionCode,
  fallbackOrder?: RegionCode[]
): Promise<{ store: RegionalStoreInfo | null; isFallback: boolean }>
```
- Implements the fallback logic centrally
- Tries user's region first
- Then iterates through fallback order
- Returns null if no stores found

#### Utility: `interpolateProductUrl`
```text
function interpolateProductUrl(
  pattern: string,
  productSlug: string
): string
```
- Replaces `{sku}`, `{slug}`, or `{product}` placeholders with the product identifier

### 2. Database Query Patterns

The queries will match the existing table structure:
```sql
-- Get store for specific brand and region
SELECT brs.*, ab.brand_name 
FROM brand_regional_stores brs
JOIN automated_brands ab ON brs.brand_id = ab.id
WHERE LOWER(ab.brand_name) ILIKE LOWER($brandName)
  AND brs.region_code = $region
  AND brs.is_active = true
LIMIT 1

-- Get all stores for a brand
SELECT brs.*, ab.brand_name 
FROM brand_regional_stores brs
JOIN automated_brands ab ON brs.brand_id = ab.id
WHERE LOWER(ab.brand_name) ILIKE LOWER($brandName)
  AND brs.is_active = true
ORDER BY brs.is_primary DESC, brs.region_code
```

### 3. Fallback Logic

Using the existing `REGION_FALLBACK_ORDER` from `src/config/regions.ts`:
```text
Priority Order:
1. User's selected region (exact match)
2. First match from REGION_FALLBACK_ORDER[userRegion]
3. 'US' as ultimate fallback
4. Any available active store
5. null if no stores exist
```

### 4. Caching Strategy

Implement simple in-memory caching to avoid repeated database calls:
```text
- Cache key: `${brandName.toLowerCase()}_${region}`
- TTL: 5 minutes (matches existing query staleTime patterns)
- Cache invalidation: on page refresh or region change
```

### 5. Integration Points

The utility will be designed to work with:
- `RegionContext` for current region/currency and exchange rates
- `useRegionalPriceV2` hook can be refactored to use these utilities
- Product detail pages (`FilamentDetail.tsx`, `PrinterDetail.tsx`)
- Product cards for consistent store attribution

### 6. Error Handling

Each function will:
- Return null/empty gracefully on database errors
- Log warnings to console for debugging
- Never throw exceptions that break the UI

## Files to Create
1. `src/utils/regionalStoreUtils.ts` - Main utility file with all functions and types

## Files that Will Benefit (Future Integration)
- `src/hooks/useRegionalPriceV2.ts` - Can use `findBestStoreForRegion`
- `src/components/RegionalPriceDisplay.tsx` - Can use `formatRegionalPrice`
- `src/pages/FilamentDetail.tsx` - Can use `getRegionalStoreUrl` for product links
- `src/pages/PrinterDetail.tsx` - Same as above

## Testing Considerations
- Mock the supabase client for unit tests
- Test fallback chain behavior
- Test URL interpolation with various patterns
- Test currency conversion accuracy
