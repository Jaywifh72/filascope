
# Unified Regional Pricing Hook Implementation Plan

## Overview
Create a new `useUnifiedRegionalPricing` hook that consolidates all regional pricing logic into a single, comprehensive hook. This will simplify the current fragmented approach where multiple hooks (`useRegionalPricing`, `useRegionalPriceV2`, `useRegionalStoreData`, `useConvertedPrice`, `usePriceFreshness`) are used independently.

---

## Current State Analysis

### Existing Hooks (Fragmentation Issues)
The codebase currently has **6+ overlapping regional pricing hooks**:

| Hook | Purpose | Used In |
|------|---------|---------|
| `useRegionalPricing` | Full regional store + URL resolution | FilamentDetail |
| `useRegionalPriceV2` | Price conversion + all stores list | PricingTab components |
| `useRegionalStoreData` | Store data with React Query caching | Various components |
| `useConvertedPrice` | Currency conversion only | Price displays |
| `usePriceFreshness` | Data age calculation | Price freshness indicators |
| `useRegionalPrice` (legacy) | Hardcoded column-based pricing | FilamentCard, LabReadoutCard |

### Problems with Current Approach
1. **Duplicated Logic**: Store lookups, fallback logic, and currency conversion are repeated
2. **Inconsistent Results**: Different hooks may return slightly different values
3. **Missing Freshness Data**: Most hooks don't include `price_confidence` or `last_scraped_at`
4. **No Caching Coordination**: Multiple hooks may fetch the same store data independently
5. **Complex Consumer Code**: Components must wire together multiple hooks manually

---

## Solution Design

### New Unified Hook: `useUnifiedRegionalPricing`

A single hook that:
1. Accepts flexible product data (filament, printer, or accessory)
2. Uses React Query for efficient caching (shares cache with existing hooks)
3. Returns all regional pricing data in one result object
4. Includes price freshness metadata
5. Handles all edge cases (no stores, fallbacks, conversions)

### Interface Design

```typescript
interface UnifiedRegionalPricingResult {
  // Display values
  displayPrice: number;
  displayCurrency: CurrencyCode;
  formattedPrice: string;
  
  // Store info
  storeUrl: string;
  storeRegion: RegionCode;
  storeName: string;
  isLocalStore: boolean;
  storeFlag: string;
  
  // Price freshness (NEW)
  priceConfidence: PriceConfidence;
  lastVerifiedAt: Date | null;
  priceSource: string | null;
  timeAgo: string | null;
  
  // Conversion info
  isConverted: boolean;
  originalPrice: number | null;
  originalCurrency: CurrencyCode | null;
  conversionRate: number | null;
  conversionTooltip: string | null;
  
  // All available stores
  allStores: RegionalStoreData[];
  
  // Status
  isLoading: boolean;
  error: string | null;
}

interface UnifiedProductData {
  // Required
  brandName: string;
  
  // Price info (at least one required)
  basePrice?: number | null;
  baseCurrency?: CurrencyCode;
  
  // URL generation
  productSlug?: string;
  originalUrl?: string | null;
  filamentId?: string | null; // For regional slug resolution
  
  // Freshness data (optional - from new DB columns)
  priceLastVerifiedAt?: string | null;
  priceSource?: string | null;
  priceConfidence?: string | null;
}
```

---

## Implementation Steps

### Step 1: Create the Unified Hook File
**File: `src/hooks/useUnifiedRegionalPricing.ts`**

Core implementation:
- Use `useQuery` with shared cache keys (`['brand-id', brandName]`, `['regional-stores', brandId]`)
- Integrate `usePriceFreshness` logic inline for single-object return
- Reuse `findBestStore` and `buildRegionalUrl` from `useRegionalPricing`
- Add `storeFlag` from `REGION_CONFIGS`
- Calculate `conversionTooltip` string for UI consumption

### Step 2: Add Freshness Fields to Return Object
The hook will read from the new database columns:
- `price_source` (manual, scraper, api, affiliate)
- `price_confidence` (high, medium, low, stale, unknown)
- `last_scraped_at` / `prices_last_updated_at`

Calculate derived values:
- `timeAgo`: Uses `formatDistanceToNow` from date-fns
- `priceConfidence`: Uses thresholds (<24h = high, <7d = medium, etc.)

### Step 3: Handle All Edge Cases
```typescript
// No stores found
if (!stores.length) {
  return fallbackResult(basePrice, baseCurrency);
}

// No exact region match
const { store, isLocal } = findBestStore(stores, region);

// No base price
if (!basePrice) {
  return resultWithStore(null, store, isLocal);
}

// Currency conversion needed
const needsConversion = storeCurrency !== userCurrency;
```

### Step 4: Generate Convenience Tooltip
```typescript
conversionTooltip: isConverted 
  ? `Original: ${formatCurrencyPrice(basePrice, baseCurrency)}\nRate: 1 ${baseCurrency} = ${rate.toFixed(4)} ${userCurrency}`
  : null
```

### Step 5: Export All Stores for Pricing Tab
The hook returns `allStores` array so PricingTab can display all regional options without a separate hook call.

---

## File Changes Summary

### New Files
| File | Description |
|------|-------------|
| `src/hooks/useUnifiedRegionalPricing.ts` | Main unified hook implementation |

### Modified Files (Future - Not in This PR)
| File | Change |
|------|--------|
| `src/pages/FilamentDetail.tsx` | Replace `useRegionalPricing` with `useUnifiedRegionalPricing` |
| `src/pages/PrinterDetail.tsx` | Add unified hook for printer pricing |
| `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx` | Use freshness data from unified result |
| `src/components/filament/tabs/PricingTabContent.tsx` | Use `allStores` from unified result |

---

## Technical Details

### React Query Cache Keys (Shared)
```typescript
// Brand lookup - shared with existing hooks
queryKey: ['brand-id', brandName?.toLowerCase()]

// Store data - shared with useRegionalStoreData
queryKey: ['regional-stores', brandId]

// Regional slug - shared with useRegionalPricing
queryKey: ['regional-slug', filamentId, region]
```

### Dependencies
- `@tanstack/react-query` (already installed)
- `date-fns` (already installed)
- `RegionContext` for user preferences
- Existing type definitions from `src/types/regional.ts`

### Performance Considerations
- Uses React Query with 10-minute staleTime for store data
- Memoized result computation with `useMemo`
- Shares cache with existing hooks to avoid duplicate fetches

---

## Example Usage

```typescript
// In FilamentDetail or any component
const {
  displayPrice,
  formattedPrice,
  storeUrl,
  isLocalStore,
  priceConfidence,
  timeAgo,
  isConverted,
  conversionTooltip,
  allStores,
  isLoading,
} = useUnifiedRegionalPricing({
  brandName: filament.vendor,
  basePrice: filament.variant_price,
  baseCurrency: 'USD',
  productSlug: extractProductSlug(filament.product_url),
  originalUrl: filament.product_url,
  filamentId: filament.id,
  priceLastVerifiedAt: filament.last_scraped_at,
  priceSource: filament.price_source,
});

// Use in UI
<PriceFreshnessIndicator confidence={priceConfidence} timeAgo={timeAgo} />
<RegionalPriceDisplay price={formattedPrice} isConverted={isConverted} />
<a href={storeUrl}>Buy Now</a>
```

---

## Benefits
1. **Single Source of Truth**: One hook for all regional pricing needs
2. **Includes Freshness**: Price confidence and age built-in
3. **Efficient Caching**: Shares React Query cache with existing hooks
4. **Simpler Components**: Consumers get everything in one call
5. **Type Safety**: Full TypeScript interfaces
6. **Backward Compatible**: Existing hooks remain functional during migration
