
# Fix Price Display Inconsistency Across Product Detail Pages

## Problem Summary

Three price values appear for the same product, each from a different computation path:

1. **Sidebar**: Shows per-kg price from `useFilamentDetailPricing` best candidate (local-first preference)
2. **Best Prices section**: Shows spool prices from the same candidates list, with "Best Price" badge on the first item (which is the cheapest *local* store, not the absolute cheapest)
3. **Listing card (homepage)**: Shows per-kg price from `useResolvedPrice`, a completely independent computation using only the filament table's price columns -- no store/listing data

## Root Causes

### A. Sidebar shows a per-kg price that doesn't match any retailer's spool price
The sidebar receives `detailPricing.pricePerKg` (per-kg normalized from the **best** candidate's spool price). The Best Prices section shows each candidate's raw `spoolPrice`. These are different units (/kg vs per spool), so they will never numerically match. However, the sidebar's per-kg price should derive from the same retailer shown as "Best Price" -- and it currently does, except that "best" means "cheapest local" not "absolute cheapest."

### B. "Best Price" badge goes to local store, not absolute cheapest
In `useFilamentDetailPricing.ts` (lines 339-344), candidates are sorted local-first, then international. The `bestPrice` is chosen as `localCandidates[0]` when any local candidate exists -- even if an international store is dramatically cheaper. The BestPricesSection then assigns the "Best Price" badge to `idx === 0`.

### C. Listing card uses a completely different pricing pipeline
`FilamentCard` uses `useResolvedPrice` which reads `price_cad`, `price_eur`, etc. columns from the filament table. The detail page uses `useFilamentDetailPricing` which queries `filament_listings`, `filament_prices`, and `brand_regional_stores`. These two pipelines can produce different prices because they draw from different data sources.

### D. No label clarifying what unit each price represents
The Best Prices section shows spool prices without a "/spool" suffix. The sidebar shows per-kg prices with "/kg". Users see different numbers and assume they're the same unit.

## Implementation Plan

### Step 1: Change "Best Price" selection to absolute cheapest

**File: `src/hooks/useFilamentDetailPricing.ts`**

Change the sorting and best-price selection logic (lines 329-350):
- Sort ALL candidates by price-per-kg ascending (remove the local-first sort for the `allCandidates` array)
- Set `bestPrice` to the absolute cheapest candidate regardless of region
- Add `cheapestLocal` as a separate output field for components that need it
- Add an `isLocal` flag on the `DetailPricingResult` that's based on whether the cheapest candidate happens to be local

Add to the `DetailPricingResult` interface:
- `cheapestLocal: PriceCandidate | null` -- the cheapest candidate in the user's region (separate from `bestPrice`)

New sorting logic:
```
All candidates sorted by pricePerKg ascending (cheapest first)
bestPrice = sorted[0] (absolute cheapest)
cheapestLocal = cheapest among candidates where isLocal === true
```

### Step 2: Update BestPricesSection badges

**File: `src/components/filament/BestPricesSection.tsx`**

Currently the "Best Price" badge is assigned to `idx === 0`. Change to:
- Show **"Best Price"** badge on the candidate with the absolute lowest `spoolPrice` (should be idx 0 after re-sorting)
- Show **"Local"** badge (emerald-themed) on any candidate where `isLocal === true`
- If a candidate is both cheapest AND local, show both badges
- Add a "/spool" label after each price to clarify the unit
- Add per-kg price as secondary text below each spool price for easy comparison

### Step 3: Align listing card pricing with detail page

**File: `src/components/FilamentCard.tsx`**

The listing card currently uses `useResolvedPrice` which only reads the filament table columns (price_cad, variant_price, etc.). This is intentional for performance -- listing cards appear in grids of 20+ items and can't each make 4 async queries.

Rather than changing the card to use `useFilamentDetailPricing` (too expensive), the fix is to:
- Keep `useResolvedPrice` for the listing card (it's the right tradeoff for list views)
- Add a small note below the card price: the card shows a **per-kg estimate** from catalog data
- Ensure both `useResolvedPrice` and `useFilamentDetailPricing` use the same `computePricePerKg` formula (they already do -- both use `spoolPrice / (weightKg * packQty)`)

The real alignment issue is that the filament table's `price_cad` column may not match the cheapest store listing. This is a data consistency issue -- the `price_cad` column should be periodically refreshed from the store listings, but that's a data pipeline concern, not a UI fix.

### Step 4: Consistent unit labels

**File: `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx`**

- The sidebar already shows "/kg" after the price -- keep this
- Add secondary text showing the per-spool price: "C$X.XX/spool at [Store]"
- This makes it clear how the per-kg price relates to the actual purchase price

**File: `src/components/filament/BestPricesSection.tsx`**

- Show both spool price (primary, bold) and per-kg price (secondary, smaller) for each retailer row
- This lets users compare both the actual cost and the normalized cost

### Step 5: Add `isLocal` and `isCheapest` flags to PriceCandidate display

**File: `src/components/filament/BestPricesSection.tsx`**

Each retailer row will show contextual badges:
- Emerald "Best Price" badge on the absolute cheapest (idx 0 after global sort)
- Emerald "Local" badge on stores matching the user's region
- Both badges if the local store is also the cheapest

## Technical Details

### Changes to `useFilamentDetailPricing.ts`

```text
Current sorting (lines 339-344):
  localCandidates sorted by price  ->  intlCandidates sorted by price
  bestPrice = localCandidates[0] || intlCandidates[0]

New sorting:
  allCandidates sorted by pricePerKg ascending (cheapest first globally)
  bestPrice = allCandidates[0] (absolute cheapest)
  cheapestLocal = allCandidates.find(c => c.isLocal) || null
```

### Changes to `DetailPricingResult` interface

Add:
```
cheapestLocal: PriceCandidate | null;
```

### Changes to `BestPricesSection.tsx`

Each retailer row gets:
```
[Logo] Polymaker Canada        ~C$102.52/spool  (~C$75.94/kg)  [Local]
[Logo] Amazon US               ~C$28.70/spool   (~C$28.70/kg)  [Best Price]
[Logo] Polymaker               ~C$75.18/spool   (~C$55.69/kg)
```

### Changes to `FilamentPurchaseSidebar.tsx`

Below the main per-kg price, add:
```
~C$28.70/spool at Amazon US     [Best Price]
```

This secondary line shows the actual spool price from the cheapest retailer, connecting the per-kg display to the real purchase price.

### Changes to `FilamentDetail.tsx`

Update sidebar prop wiring to pass the new `cheapestLocal` field alongside `bestPrice`, and pass both to the sidebar so it can display the cheapest global price as the primary while still showing local availability.

## File Summary

| File | Action | Key Change |
|------|--------|------------|
| `src/hooks/useFilamentDetailPricing.ts` | Edit | Global price sort, add `cheapestLocal` field |
| `src/components/filament/BestPricesSection.tsx` | Edit | Badge logic: Best Price on cheapest, Local badge separate; add /kg secondary |
| `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx` | Edit | Show per-spool price secondary line below /kg |
| `src/pages/FilamentDetail.tsx` | Edit | Wire new `cheapestLocal` to sidebar |
| `src/components/filament/StickyBuyBar.tsx` | Edit | Align with new bestPrice (absolute cheapest) |
| `src/components/filament/mobile/FilamentMobileBottomBar.tsx` | Edit | Align with new bestPrice |

No database changes required.
