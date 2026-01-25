# Regional Pricing Hook - Implementation Complete ✅

## Summary

Created a new unified `useRegionalPricing` hook that:
1. Uses `brand_regional_stores` table as the primary source for regional pricing
2. Implements React Query for efficient caching (10-minute stale time)
3. Applies fallback logic using `REGION_FALLBACK_ORDER` from config
4. Integrates with `RegionContext` for proper currency conversion
5. Generates regional store URLs from `product_url_pattern` templates

## Files Created

| File | Purpose |
|------|---------|
| `src/hooks/useRegionalPricing.ts` | New unified pricing hook with React Query caching |

## Files Modified

| File | Changes |
|------|---------|
| `src/pages/FilamentDetail.tsx` | Replaced `useRegionalPrice` with new `useRegionalPricing` hook |

## Hook Interface

```typescript
const { 
  priceResult,      // RegionalPriceResult with displayPrice, formattedPrice, store info
  isLoading,        // Loading state
  error,            // Error message if any
  allStores,        // All regional stores for the brand
  hasLocalStore     // True if store matches user's region
} = useRegionalPricing({
  brandName: 'Creality',
  productSlug: 'hyper-pla-cf',
  basePrice: 34.99,
  baseCurrency: 'USD',
  originalUrl: 'https://store.creality.com/products/hyper-pla-cf'
});
```

## How It Works

1. **Brand Lookup**: Queries `automated_brands` by name to get brand ID
2. **Store Fetch**: Queries `brand_regional_stores` by brand ID for active stores
3. **Store Matching**: Finds best store using:
   - Exact region match (user's region) → `isLocal: true`
   - Fallback regions (from `REGION_FALLBACK_ORDER`) → `isLocal: false`
   - Primary store (if marked) → `isLocal: false`
   - First available store → `isLocal: false`
4. **URL Generation**: Builds product URL using store's `product_url_pattern`
5. **Price Conversion**: Converts base price to user's currency via `RegionContext`

## Expected Behavior

| User Region | Store Found | Result |
|-------------|-------------|--------|
| US | Creality US | "$34.99 at Creality US 🇺🇸" |
| CA | Creality CA | "$34.99 → ~C$47.59 at Creality CA 🇨🇦" |
| CA | No CA store | "$34.99 → ~C$47.59 at Creality US 🇺🇸 (fallback)" |
| EU | Creality EU | "€32.99 at Creality EU 🇪🇺" |

## Next Steps (Optional Enhancements)

- [ ] Update `FilamentCard` components to use new hook for consistent pricing across listings
- [ ] Add regional store switcher in pricing tab
- [ ] Add "View all regional stores" modal
