
# Regional Pricing Integration for Product Cards

## Overview

This plan updates the FilamentCard, LabReadoutCard, SimilarFilamentCard, and MediumStandardPrinterCard components to use the new `RegionContext` system instead of the legacy `useCurrency` hook. It also creates utility functions for consistent price display across the application.

## Current State Analysis

| Component | Current Approach | Issues |
|-----------|-----------------|--------|
| `FilamentCard.tsx` | Uses `useCurrency` + `useRegionalPrice` | Uses legacy hook, no store attribution in UI |
| `LabReadoutCard.tsx` | Uses `useCurrency` + `useRegionalPrice` | Shows vendor as retailer, no conversion indicator |
| `SimilarFilamentCard.tsx` | Uses `useCurrency.formatPrice` | No regional awareness at all |
| `MediumStandardPrinterCard.tsx` | Uses `useCurrency` + `usePrinterCurrentPrice` | Has live price but no regional store attribution |
| `RegionalPriceDisplay.tsx` | Uses new `RegionalPriceResult` type | Already compatible with new system |

## Key Challenge

The existing `useRegionalPrice` hook (in `src/hooks/useRegionalPrice.ts`) returns a different interface than the new `RegionalPriceResult` type used by `RegionalPriceDisplay`. We need to either:

1. **Option A**: Update the existing `useRegionalPrice` hook to return the new `RegionalPriceResult` format
2. **Option B**: Create an adapter that transforms the legacy result to the new format
3. **Option C**: Update cards to use `useRegionalPriceV2` which already uses the new format

This plan uses **Option C** for new integrations while maintaining backward compatibility.

---

## Implementation Plan

### File 1: Create `src/utils/priceDisplay.ts`

A utility module for consistent price display across cards:

```text
Functions:
- getPriceDisplayText(priceResult) → string
- getStoreAttributionText(priceResult) → string  
- shouldShowConversionBadge(priceResult) → boolean
- formatPricePerKg(price, weightG, packQty) → number | null
```

These utilities work with both the legacy `RegionalPriceResult` from `useRegionalPrice.ts` and the new `RegionalPriceResult` from `types/regional.ts`.

### File 2: Update `src/components/FilamentCard.tsx`

Changes:
- Replace `useCurrency` import with `useRegion` from RegionContext
- Add conversion indicator (info icon with tooltip) when price is converted
- Add store attribution row showing regional flag and store name
- Add "Local" badge when product is available in user's region
- Update "Compare →" link to use regional store URL

Key UI additions:
```text
Price section:
  [Current Price] /kg [Info Icon if converted]
  🇨🇦 at Amazon.ca  ← NEW: Store attribution with flag
  [Local badge] ← NEW: If hasRegionalStore
```

### File 3: Update `src/components/LabReadoutCard.tsx`

Changes:
- Replace `useCurrency` with `useRegion`
- Add conversion indicator when `isConverted` is true
- Update "at {vendor}" to show actual store name from regional data
- Add regional flag to store attribution
- Keep existing sale price / discount percentage logic

Key UI change:
```text
Before: "at Bambu Lab"
After:  "🇺🇸 at Bambu Lab Store" (with flag)
```

### File 4: Update `src/components/filament/similar/SimilarFilamentCard.tsx`

Changes:
- Add `useRegion` hook for currency formatting
- Replace `formatPrice` with context-aware formatting
- Add conversion indicator if needed (subtle, due to compact size)
- This card uses simpler pricing (no live fetch), so lighter changes

### File 5: Update `src/components/printers/MediumStandardPrinterCard.tsx`

Changes:
- Replace `useCurrency` with `useRegion`  
- Add regional store attribution for printer purchases
- Show conversion indicator when live price is from different currency
- Update discount calculation to work with regional pricing

---

## Technical Details

### Bridging Legacy and New Types

The existing `useRegionalPrice` returns:
```typescript
{
  regionalPrice: number | null;
  isActualRegionalPrice: boolean;
  regionalUrl: string;
  currency: CurrencyCode;
  isUsingFallbackRegion: boolean;
  isRegionalBrand: boolean;
  // ...
}
```

The new `RegionalPriceResult` expects:
```typescript
{
  displayPrice: number;
  formattedPrice: string;
  isConverted: boolean;
  store: { name, url, regionCode, ... };
  // ...
}
```

The utility functions in `priceDisplay.ts` will handle both formats by checking which fields are present.

### Import Changes Pattern

```typescript
// Before
import { useCurrency } from "@/hooks/useCurrency";
const { formatPrice, formatRegionalPrice, currency } = useCurrency();

// After  
import { useRegion } from "@/contexts/RegionContext";
const { currency, formatPrice, region, regionConfig } = useRegion();
```

### Store Attribution Logic

```text
1. If isActualRegionalPrice && !isUsingFallbackRegion:
   → Show "🇺🇸 at [Vendor]" with checkmark
   
2. If isUsingFallbackRegion:
   → Show "🇨🇦 at [Vendor] (converted)" with info icon
   
3. If priceSource === 'converted':
   → Show info icon with conversion tooltip
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/utils/priceDisplay.ts` | Create | Centralized price display utilities |
| `src/components/FilamentCard.tsx` | Modify | Add regional indicators and store attribution |
| `src/components/LabReadoutCard.tsx` | Modify | Add regional indicators and store attribution |
| `src/components/filament/similar/SimilarFilamentCard.tsx` | Modify | Use RegionContext for formatting |
| `src/components/printers/MediumStandardPrinterCard.tsx` | Modify | Add regional indicators |

---

## UI Specifications

### Conversion Indicator
- Small info icon (lucide `Info`) next to price
- On hover: Tooltip with original price, exchange rate, source region
- Color: `text-muted-foreground` default, `text-foreground` on hover

### Store Attribution
- Format: `[Flag] at [Store Name]`
- Size: `text-xs` or `text-[10px]`
- Color: `text-muted-foreground`
- Show `ExternalLink` icon if URL available

### Local Badge
- Format: `[Flag] Local`
- Style: Small teal badge
- Only show when `hasRegionalStore` is true

---

## Backward Compatibility

- The existing `useCurrency` hook continues to work
- Components not yet migrated will function normally
- The `useRegionalPrice` hook from `src/hooks/useRegionalPrice.ts` remains unchanged
- New `useRegionalPriceV2` can be adopted incrementally

---

## Testing Considerations

After implementation, verify:
1. Price displays correctly in user's selected currency
2. Conversion indicator appears for non-local prices
3. Store attribution shows correct regional store name
4. Regional flag displays correctly
5. "Compare" links navigate to appropriate regional store
6. Sale prices still calculate correctly with regional pricing
