
# Fix FilamentPurchaseSidebar Regional Pricing

## Problem Summary

The `FilamentPurchaseSidebar` component currently **overrides** the regional pricing data passed from `FilamentDetail.tsx` with its own internal `useCurrentPrice` hook. This causes incorrect currency display (e.g., "C$35.99" shown to US users) because:

1. **Parent component (`FilamentDetail.tsx`)** correctly uses `useRegionalPricing` hook to calculate prices in the user's selected currency
2. **Child component (`FilamentPurchaseSidebar`)** ignores these passed props and re-fetches prices using `useCurrentPrice`, which returns prices in the store's native currency (CAD) without proper conversion

## Solution Overview

Refactor `FilamentPurchaseSidebar` to:
1. **Prioritize regional pricing** passed from the parent over internal live price fetching
2. **Use `useRegion` context** for proper currency formatting instead of `useCurrency`
3. **Only use `useCurrentPrice`** as a supplementary source for live sale prices and stock validation
4. **Add regional store badge** showing which store the price is from

---

## Implementation Plan

### Step 1: Update Component Props

Add new props to receive the complete regional pricing result from the parent:

```typescript
interface FilamentPurchaseSidebarProps {
  // ... existing props ...
  
  // NEW: Regional price result from parent
  regionalPriceResult?: RegionalPriceResult | null;
  
  // NEW: Currency the regional price is displayed in  
  displayCurrency?: CurrencyCode;
}
```

### Step 2: Modify Price Display Logic

Replace the current logic at lines 118-132 that unconditionally uses `useCurrentPrice` results:

**Current (problematic):**
```typescript
// Uses live price regardless of currency
const displayPrice = isLivePrice && currentPrice !== null ? currentPrice : pricePerSpool;
```

**New (fixed):**
```typescript
// Priority 1: Use regional pricing from parent (already in user's currency)
// Priority 2: Use live price only if currencies match
// Priority 3: Fall back to passed-in pricePerSpool

const shouldUseLivePrice = isLivePrice && 
  currentPrice !== null && 
  priceCurrency === displayCurrency;

const displayPrice = regionalPriceResult?.displayPrice 
  ?? (shouldUseLivePrice ? currentPrice : null)
  ?? pricePerSpool;
```

### Step 3: Update Price Formatting

Replace `useCurrency` hook with `useRegion` for proper formatting:

```typescript
// Instead of:
const { formatPrice, formatRegionalPrice, currency } = useCurrency();

// Use:
const { currency, formatPrice } = useRegion();
```

Update the price formatting at line 142-146:

**Current:**
```typescript
const formattedPricePerKg = displayPricePerKg 
  ? (isLivePrice 
      ? formatLivePrice(displayPricePerKg) 
      : hasActualRegionalPrice ? formatRegionalPrice(displayPricePerKg, false) : formatPrice(displayPricePerKg, false))
  : null;
```

**New:**
```typescript
const formattedPricePerKg = displayPricePerKg 
  ? formatPrice(displayPricePerKg, { 
      showApproximate: regionalPriceResult?.isConverted ?? false 
    })
  : null;
```

### Step 4: Add Regional Store Badge

Add a visual indicator showing which store the price is from (lines 269-274):

```typescript
{/* Retailer Info with Region Badge */}
<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
  <span className="font-medium">Best Price:</span>
  <span className="font-bold text-foreground/80">
    {regionalPriceResult?.store?.name || finalRetailerName}
  </span>
  {regionalPriceResult?.store?.regionCode && (
    <span>{REGIONS[regionalPriceResult.store.regionCode]?.flag}</span>
  )}
  {hasLocalStore && (
    <span className="text-xs text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
      Local
    </span>
  )}
</div>
```

### Step 5: Add Conversion Tooltip

When price is converted, show the original price and exchange rate:

```typescript
{regionalPriceResult?.isConverted && (
  <Tooltip>
    <TooltipTrigger>
      <span className="text-xs text-muted-foreground cursor-help">
        (converted)
      </span>
    </TooltipTrigger>
    <TooltipContent>
      <p>Original: {formatPrice(regionalPriceResult.originalPrice, regionalPriceResult.originalCurrency)}</p>
      {regionalPriceResult.conversionRate && (
        <p className="text-xs text-muted-foreground">
          Rate: 1 {regionalPriceResult.originalCurrency} = {regionalPriceResult.conversionRate.toFixed(4)} {currency}
        </p>
      )}
    </TooltipContent>
  </Tooltip>
)}
```

### Step 6: Update FilamentDetail.tsx Integration

Pass the regional pricing result to the sidebar:

```typescript
<FilamentPurchaseSidebar
  // ... existing props ...
  regionalPriceResult={regionalPriceResult}
  displayCurrency={regionalPriceResult?.displayCurrency || currency}
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx` | Update props interface, refactor price logic, add region badge |
| `src/pages/FilamentDetail.tsx` | Pass `regionalPriceResult` to sidebar |

---

## Technical Details

### Price Priority Logic

```text
┌─────────────────────────────────────────────────────────────┐
│  Price Resolution Priority                                  │
├─────────────────────────────────────────────────────────────┤
│  1. Regional Price Result (from parent)                     │
│     - Already converted to user's currency                  │
│     - Includes store metadata                               │
│                                                             │
│  2. Live Price (from useCurrentPrice)                       │
│     - Only if currency matches user's selection             │
│     - Provides sale price detection                         │
│                                                             │
│  3. Fallback to passed props                                │
│     - pricePerSpool / pricePerKg                           │
└─────────────────────────────────────────────────────────────┘
```

### Import Changes

```typescript
// Add:
import { useRegion } from '@/contexts/RegionContext';
import { REGIONS } from '@/config/regions';
import { RegionalPriceResult, CurrencyCode } from '@/types/regional';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Remove (if no longer needed):
// import { useCurrency, CurrencyCode, CURRENCIES } from '@/hooks/useCurrency';
```

---

## Expected Results

| Scenario | Before | After |
|----------|--------|-------|
| US user viewing Creality filament | C$35.99 (wrong) | $25.99 at Creality US 🇺🇸 |
| CA user viewing Creality filament | C$35.99 | C$35.99 at Creality CA 🇨🇦 Local |
| EU user viewing Creality filament | C$35.99 (wrong) | ~€23.50 at Creality EU 🇪🇺 (converted) |
| UK user, no UK store available | C$35.99 (wrong) | ~£20.50 at Creality US 🇺🇸 (converted) |
