

# Unify Per-Kg Price Calculation Across the Entire Application

## Problem Statement

The per-kg price is calculated in **at least 6 different ways** across 15+ files, leading to inconsistent values between views. The root causes are:

1. **Formula divergence**: Some files use `price / (weight_g / 1000)`, others use `(price / weight_g) * 1000`, and some account for `pack_quantity` while others do not.
2. **Price source divergence**: Cards and tables use `resolveFilamentPrice` (which picks the best regional column like `price_cad`), while the detail page uses `useFilamentDetailPricing` (which picks the best marketplace listing like Amazon). These are fundamentally different price sources yielding different per-kg values.
3. **Inline calculations everywhere**: Many components compute `variant_price / net_weight_g * 1000` inline, ignoring `pack_quantity` and regional pricing entirely.

## Audit: Every Per-Kg Calculation Site

| Location | Formula | Uses pack_qty? | Uses regional price? | Source |
|---|---|---|---|---|
| `resolveFilamentPrice.ts` | `spoolPrice / (weightKg * packQty)` | Yes | Yes (column priority) | Cards, Table |
| `useFilamentDetailPricing.ts` | `price / totalWeightKg` where `totalWeightKg = weightKg * packQty` | Yes | Yes (marketplace listings) | Detail page |
| `BentoGrid.tsx` | `variant_price / (weightKg * packQty)` | Yes | No (USD only) | Homepage |
| `SimilarFilamentCard.tsx` | `variant_price / (net_weight_g / 1000)` | **No** | No | Similar cards |
| `SimilarMaterialCard.tsx` | `(variant_price / net_weight_g) * 1000` | **No** | No | Similar materials |
| `PerformanceAtAGlance.tsx` | `(variant_price / net_weight_g) * 1000` | **No** | No | Performance section |
| `MobileStickyBuyBar.tsx` (compare) | `(price / weight) * 1000` | **No** | No | Compare tray |
| `MobileCompareView.tsx` | `(price / weight) * 1000` | **No** | No | Compare mobile |
| `WishlistItem.tsx` | `(variant_price / net_weight_g) * 1000` | **No** | No | Wishlist |
| `TrayActionsMenu.tsx` | `(variant_price / net_weight_g) * 1000` | **No** | No | Compare export |
| `ExportMenu.tsx` | inline calculation | **No** | No | Compare export |
| `SideBySideComparisonDialog.tsx` | fallback inline | **No** | No | Compare dialog |
| `TrayFilters.tsx` | `(variant_price / net_weight_g) * 1000` | **No** | No | Compare sort |
| `performanceProfileService.ts` | receives as param | N/A | N/A | Service |

## Solution: Two-Tier Approach

The key insight is that there are **two valid per-kg values** for different contexts:

- **Catalog per-kg** (cards, tables, comparisons): Based on the product's static database price resolved through `resolveFilamentPrice`. This is the "MSRP-like" value for comparison across products.
- **Best-deal per-kg** (detail page sidebar, sticky bar): Based on live marketplace listings. This is the "best available price" from a specific retailer.

Both are legitimate, but they must be **internally consistent** within their context. The problem is that 10+ files compute catalog per-kg with incorrect formulas (missing `pack_quantity`).

### Step 1: Create a shared pure utility function

Add a `computePricePerKg` function to `resolveFilamentPrice.ts` (the existing SSOT file) that encapsulates the canonical formula:

```text
function computePricePerKg(
  totalSpoolPrice: number, 
  netWeightG: number, 
  packQuantity: number = 1
): number | null
```

Formula: `totalSpoolPrice / ((netWeightG / 1000) * packQuantity)`

This is a pure function with no hooks or dependencies -- usable everywhere.

### Step 2: Replace all inline calculations

Replace every inline `variant_price / net_weight_g * 1000` with a call to `computePricePerKg`, passing `pack_quantity` correctly. Files to update:

1. `SimilarFilamentCard.tsx` -- add `pack_quantity` support
2. `SimilarMaterialCard.tsx` -- add `pack_quantity` support
3. `PerformanceAtAGlance.tsx` -- add `pack_quantity` support
4. `MobileStickyBuyBar.tsx` (compare) -- replace inline `getPricePerKg`
5. `MobileCompareView.tsx` -- replace inline `getPricePerKg`
6. `WishlistItem.tsx` -- add `pack_quantity` support
7. `TrayActionsMenu.tsx` -- replace inline calculations
8. `ExportMenu.tsx` -- replace inline calculations
9. `TrayFilters.tsx` -- replace inline sort calculations
10. `SideBySideComparisonDialog.tsx` -- replace fallback calculation
11. `BentoGrid.tsx` -- already correct, switch to shared function for consistency

### Step 3: Guard against future drift

Add a JSDoc comment and `@deprecated` tag pattern to discourage inline calculations:

```typescript
/**
 * Canonical per-kg price calculation.
 * DO NOT compute price-per-kg inline anywhere else.
 * Always use this function or useResolvedPrice hook.
 */
export function computePricePerKg(...)
```

## Technical Details

### The shared function (added to `resolveFilamentPrice.ts`)

```typescript
export function computePricePerKg(
  totalSpoolPrice: number,
  netWeightG: number | null | undefined,
  packQuantity: number | null | undefined = 1
): number | null {
  const pq = packQuantity || 1;
  if (!netWeightG || netWeightG <= 0) return null;
  const weightKg = netWeightG / 1000;
  if (weightKg <= 0) return null;
  return totalSpoolPrice / (weightKg * pq);
}
```

### Files to modify (11 files)

Each file gets the same pattern: replace the inline math with an import of `computePricePerKg` from `@/lib/resolveFilamentPrice`.

Example transformation in `SimilarFilamentCard.tsx`:

Before:
```typescript
const pricePerKg = filament.variant_price && filament.net_weight_g
  ? (filament.variant_price / (filament.net_weight_g / 1000))
  : null;
```

After:
```typescript
import { computePricePerKg } from '@/lib/resolveFilamentPrice';
// ...
const pricePerKg = filament.variant_price
  ? computePricePerKg(filament.variant_price, filament.net_weight_g, filament.pack_quantity)
  : null;
```

### No changes needed to

- `resolveFilamentPrice.ts` core logic (already correct internally, just adding the export)
- `useResolvedPrice.ts` (wraps `resolveFilamentPrice`, already correct)
- `useFilamentDetailPricing.ts` (already correct with `totalWeightKg`)
- `FilamentCard.tsx` (already uses `useResolvedPrice`)
- `FilamentTableView.tsx` (already uses `resolveFilamentPrice`)

### Risk mitigation

- The formula change only affects products with `pack_quantity > 1` (multi-packs). For the majority of single-spool products (`pack_quantity = 1` or null), the result is identical.
- All existing validation thresholds (min $5/kg, max $500/kg) remain unchanged.
- No database changes required.
- No new dependencies.

