

# Fix Price Instability Across FilaScope

## Problem Summary

The same product shows different prices per kilogram depending on which component renders first and which data source "wins" a race condition. For example, Polymaker PC-PBT might show ~C$102.52/kg, ~C$75.94/kg, or ~C$21.26/kg on the same detail page between different loads.

## Root Cause Analysis

After tracing every pricing pipeline, I identified **5 distinct root causes**:

### 1. Multiple Independent Price Sources Racing Each Other

The `FilamentDetail.tsx` page fetches prices from **4 independent async sources** that resolve at different times:

| Source | Hook | What it returns | Per-kg formula |
|---|---|---|---|
| Source 1 | `useFilamentListings` (x2: local + US) | Retailer prices from `filament_listings` table | `price / wKg` (lines 300-302) |
| Source 2 | `useFilamentStorePricing` | Store prices from `filament_prices` table via RPC | `priceDisplay / wKg` (line 323) |
| Source 3 | `useUnifiedRegionalPricing` | Brand regional store prices from `brand_regional_stores` | `displayPrice / wKg` (line 344) |
| Source 4 | Legacy Amazon price | `filament.amazon_price_usd` column | `price / wKg` (line 373) |

The `sidebarBest` selection (line 257) merges these into a `candidates` array. Whichever sources have loaded when `useMemo` runs determines which candidate "wins." On the next render, a different source may have loaded, changing the winner.

### 2. Inconsistent Weight Normalization (Critical Bug)

The per-kg weight denominator (`wKg`) is calculated differently across components:

**Detail page** (`FilamentDetail.tsx` lines 260-263):
```
wKg = (net_weight_g / 1000) * packQty    // Total weight across ALL spools in pack
```

**Sidebar** (`FilamentPurchaseSidebar.tsx` lines 175-179):
```
effectiveWeightKg = weightGrams / 1000    // Weight of ONE spool (ignores pack_quantity!)
displayPricePerKg = displayPrice / effectiveWeightKg
```

For a product with `net_weight_g=1350` and `pack_quantity=1`, these agree. But for multi-packs, the sidebar divides by single-spool weight, producing a DIFFERENT per-kg result.

**FilamentCard** uses `useResolvedPrice` which uses yet another formula:
```
pricePerKg = spoolPrice / (weightKg * packQty)   // Correct
```

### 3. Spool Price vs Total Pack Price Confusion

The `sidebarBest` candidates store `spoolPrice` which is actually the **total price for the whole listing** (not per-spool). But when passed to the sidebar:
```
sidebarPricePerSpool = sidebarBest.spoolPrice / packQuantity  // line 864
```
The sidebar then RECALCULATES per-kg from this per-spool price using single-spool weight, potentially double-dividing by pack quantity.

### 4. BestPricesSection Fetches Its Own Data Independently

`BestPricesSection.tsx` (line 26-41) makes its own `useFilamentListings` calls with potentially different parameters than the parent page. It also does its own price conversion (line 63-65), which may produce different results than the `sidebarBest` selection, leading to the sidebar saying one price while the Best Prices card says another.

### 5. Currency Conversion Timing

Exchange rate loading is guarded by `hasRates`, but some conversion paths (like `useFilamentStorePricing` via `convertPrice`) may execute before rates are fully cached, while others wait. This means the same USD amount can convert to different local amounts depending on timing.

---

## Solution Plan

### Phase 1: Create a Unified Price Resolution Pipeline

**File: `src/hooks/useFilamentDetailPricing.ts`** (NEW)

Create a single hook that:
- Accepts the filament data, all listing/store/unified pricing results, and the user's region context
- Waits for ALL async sources to settle before computing the final "best" price
- Returns one canonical `bestPrice` object used by every component on the detail page

This hook will:
1. Collect candidates from all sources (listings, store pricing, unified pricing, legacy Amazon) -- same logic as current `sidebarBest` but extracted into a dedicated hook
2. Use a single, consistent per-kg formula: `totalPrice / ((net_weight_g / 1000) * pack_quantity)`
3. Expose an `isReady` flag that is only `true` when all non-optional data sources have resolved
4. Return a single `DetailPricingResult` object containing:
   - `bestPrice.pricePerKg` (in user's currency)
   - `bestPrice.spoolPrice` (total pack price in user's currency)
   - `bestPrice.pricePerSpool` (per individual spool)
   - `bestPrice.storeName`, `bestPrice.storeRegion`, `bestPrice.productUrl`
   - `bestPrice.isConverted`, `bestPrice.isLocal`
   - `allCandidates` (sorted array for the "All Retailers" modal)
   - `retailerCount`
   - `isReady` / `isLoading`

### Phase 2: Fix the Weight Normalization Bug

**File: `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx`**

Remove the sidebar's independent price recalculation (lines 160-180). Instead, trust the parent-provided `pricePerKg` prop directly without recalculating. The sidebar should be a "dumb display" component that receives fully computed values.

Current problematic code to remove:
```typescript
// Lines 175-180: Independent recalculation that ignores pack_quantity
if (hasValidRegionalPrice && displayPrice && weightGrams) {
  const effectiveWeightKg = weightGrams / 1000;
  if (effectiveWeightKg > 0) {
    displayPricePerKg = displayPrice / effectiveWeightKg;
  }
}
```

Replace with: simply use the `pricePerKg` prop passed from the parent.

### Phase 3: Wire BestPricesSection to Parent Data

**File: `src/components/filament/BestPricesSection.tsx`**

Instead of making independent `useFilamentListings` calls, accept pre-computed candidates as a prop from the parent. This ensures the "Best Prices" card shows the exact same data and ordering as the sidebar.

Changes:
- Add a `candidates` prop (optional, for backward compatibility)
- When `candidates` is provided, use them directly instead of fetching
- When not provided, fall back to current self-fetching behavior

**File: `src/pages/FilamentDetail.tsx`**

Pass the `allCandidates` from the new hook into `BestPricesSection`:
```tsx
<BestPricesSection
  filamentId={displayFilament.id}
  candidates={detailPricing.allCandidates}
  totalRetailerCount={detailPricing.retailerCount}
/>
```

### Phase 4: Add Loading Guards

**File: `src/pages/FilamentDetail.tsx`**

Show price loading skeletons in the sidebar and sticky bar until `detailPricing.isReady` is true. This prevents the user from seeing intermediate values that change as data sources resolve.

- Sidebar: show a price skeleton placeholder when `!detailPricing.isReady`
- StickyBuyBar: defer visibility until `detailPricing.isReady`
- MobileBottomBar: same treatment

### Phase 5: Ensure Card Consistency

**File: `src/components/FilamentCard.tsx`**

The card already uses `useResolvedPrice` (the SSOT utility), which is correct. No changes needed here. However, verify that the formula in `resolveFilamentPrice.ts` matches the detail page formula exactly:

Current `resolveFilamentPrice.ts` (lines in `buildResult`):
```
pricePerSpool = spoolPrice / packQty
pricePerKg = spoolPrice / (weightKg * packQty)
```

This is correct and consistent with the target formula. The card path is already aligned.

---

## Files to Create/Modify

| File | Action | Purpose |
|---|---|---|
| `src/hooks/useFilamentDetailPricing.ts` | CREATE | Single source of truth for detail page pricing |
| `src/pages/FilamentDetail.tsx` | MODIFY | Use new hook, remove inline `sidebarBest` logic, pass unified data to children |
| `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx` | MODIFY | Remove independent price recalculation, trust parent props |
| `src/components/filament/BestPricesSection.tsx` | MODIFY | Accept pre-computed candidates prop |
| `src/components/filament/StickyBuyBar.tsx` | MINOR | No formula changes, just receives correct data from parent |
| `src/components/filament/sidebar/FilamentMobileBottomBar.tsx` | MINOR | Same -- receives correct data from parent |

## Validation Criteria

After implementation:
1. Load any filament detail page 10 times -- the per-kg price should be identical every time
2. The listing card, detail sidebar, Best Prices section, and sticky bar should all show the same per-kg value
3. Multi-pack products (pack_quantity > 1) should calculate per-kg correctly: `totalPackPrice / ((net_weight_g / 1000) * pack_quantity)`
4. Converted prices always show `~` prefix; native regional prices do not
5. No price flicker during page load -- skeleton shown until all sources resolve

