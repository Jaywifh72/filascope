
# Regional Pricing Hook - Core Fix Plan

## Problem Summary

The price display is broken because there are **two competing systems** for regional pricing:
- The **old system** (`useRegionalPrice`) reads directly from filament table columns (`price_cad`, `product_url_ca`)
- The **new system** (`brand_regional_stores` table) has proper regional store data but isn't being used

The filament detail page uses the old system, which finds no CAD-specific data and falls back incorrectly.

---

## Solution Overview

Create a **unified pricing hook** that:
1. Uses `brand_regional_stores` as the primary source (where your 39+ brands are properly configured)
2. Falls back to filament columns for legacy/unmatched brands
3. Integrates with `RegionContext` for proper currency conversion

---

## Implementation Steps

### Step 1: Create New Unified Hook

**File**: `src/hooks/useRegionalPricing.ts`

This hook will:
- Accept `brandName`, `productSlug`, `basePrice`, `baseCurrency`, and `originalUrl`
- Query `brand_regional_stores` for the user's selected region
- Apply fallback logic (US → CA → EU → UK → AU order)
- Generate proper store URLs using `product_url_pattern`
- Convert prices using `RegionContext.convertPrice()`

```text
Hook Interface:
┌───────────────────────────────────────────────────────────────┐
│  useRegionalPricing(options)                                  │
├───────────────────────────────────────────────────────────────┤
│  Input:                                                       │
│  - brandName: string                                          │
│  - productSlug: string (e.g., "hyper-pla-cf")                │
│  - basePrice: number                                          │
│  - baseCurrency: CurrencyCode                                 │
│  - originalUrl: string                                        │
│                                                               │
│  Output:                                                      │
│  - displayPrice: number (in user's currency)                  │
│  - formattedPrice: string (e.g., "$34.99")                   │
│  - isConverted: boolean                                       │
│  - conversionRate: number | null                              │
│  - store: { name, url, regionCode, isLocal }                 │
│  - isLoading: boolean                                         │
│  - error: string | null                                       │
└───────────────────────────────────────────────────────────────┘
```

### Step 2: Add React Query Caching

Use React Query (`@tanstack/react-query`) for efficient caching:
- Cache brand lookups by name
- Cache regional stores by brand ID
- Stale time: 10 minutes (stores don't change often)

### Step 3: URL Generation Logic

Extract product slug from original URL and apply to regional store pattern:
```
Original: https://store.creality.com/products/hyper-pla-cf
Pattern:  https://ca.store.creality.com/products/{sku}
Result:   https://ca.store.creality.com/products/hyper-pla-cf
```

### Step 4: Price Conversion Logic

```text
Priority Order:
1. User's region has a store → use store's currency, convert if needed
2. Fallback region has a store → use that store's price, convert to user's currency
3. No stores found → use basePrice, convert from baseCurrency
```

### Step 5: Update FilamentDetail Page

Replace `useRegionalPrice` with new `useRegionalPricing`:

```typescript
// Before
const regionalPriceData = useRegionalPrice(pricingFilament);

// After
const { priceResult, isLoading } = useRegionalPricing({
  brandName: pricingFilament.vendor,
  productSlug: extractSlug(pricingFilament.product_url),
  basePrice: pricingFilament.variant_price,
  baseCurrency: 'USD',
  originalUrl: pricingFilament.product_url
});
```

### Step 6: Update Components

Files to update:
- `FilamentPurchaseSidebar.tsx` - use new price result format
- `FilamentMobileBottomBar.tsx` - match sidebar changes
- `PricingTabContent.tsx` - show all regional stores from hook

---

## Technical Details

### Database Query (React Query)

```sql
-- 1. Find brand by name
SELECT id FROM automated_brands WHERE brand_name ILIKE $brandName LIMIT 1

-- 2. Get regional stores
SELECT * FROM brand_regional_stores 
WHERE brand_id = $brandId AND is_active = true
```

### Fallback Region Order

Use `REGION_FALLBACK_ORDER` from `src/config/regions.ts`:
```typescript
const REGION_FALLBACK_ORDER = {
  US: ['CA', 'UK', 'EU', 'AU'],
  CA: ['US', 'UK', 'EU', 'AU'],
  UK: ['EU', 'US', 'CA', 'AU'],
  // ...
};
```

### Store Matching Logic

```typescript
// 1. Find store matching user's region
const primaryStore = stores.find(s => s.region_code === userRegion);

// 2. If not found, try fallback regions
if (!primaryStore) {
  for (const fallback of getFallbackRegions()) {
    const fallbackStore = stores.find(s => s.region_code === fallback);
    if (fallbackStore) return { store: fallbackStore, isFallback: true };
  }
}

// 3. Use first available store
return { store: stores[0], isFallback: true };
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useRegionalPricing.ts` | **Create** | New unified pricing hook |
| `src/pages/FilamentDetail.tsx` | Modify | Use new hook |
| `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx` | Modify | Update props to use new format |
| `src/components/filament/sidebar/FilamentMobileBottomBar.tsx` | Modify | Match sidebar changes |

---

## Expected Result

When viewing the Creality filament with US region selected:
- **Before**: Shows "C$35.99" (incorrect)
- **After**: Shows "$34.99 at Creality US 🇺🇸" (correct)

When viewing with CA region selected:
- Shows "~C$47.59" with tooltip: "Original: $34.99 USD • Rate: 1 USD = 1.36 CAD"
- Links to `https://ca.store.creality.com/products/hyper-pla-cf`
