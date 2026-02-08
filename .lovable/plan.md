
# Fix Price Display Inconsistency Across Product Detail Pages

## Status: ✅ IMPLEMENTED

## Changes Made

### Step 1: ✅ Changed "Best Price" selection to absolute cheapest
**File: `src/hooks/useFilamentDetailPricing.ts`**
- Sorting now uses global price-per-kg ascending (cheapest first globally)
- `bestPrice` = absolute cheapest candidate regardless of region
- Added `cheapestLocal: PriceCandidate | null` to `DetailPricingResult` interface
- `cheapestLocal` = cheapest among candidates where `isLocal === true`

### Step 2: ✅ Updated BestPricesSection badges & labels
**File: `src/components/filament/BestPricesSection.tsx`**
- "Best Price" badge now goes to the absolute cheapest retailer (idx 0 after global sort)
- Separate "Local" badge (emerald-themed) on stores matching user's region
- Both badges shown if local store is also cheapest
- Added "/spool" label after each price
- Added per-kg price as secondary text below spool price

### Step 3: ✅ Sidebar shows per-spool secondary line
**File: `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx`**
- Added `bestSpoolPrice`, `bestSpoolStoreName`, `bestSpoolIsConverted` props
- Shows secondary text: "C$X.XX/spool at [Store]" below the /kg price
- Connects the per-kg display to the actual purchase price

### Step 4: ✅ Updated FilamentDetail wiring
**File: `src/pages/FilamentDetail.tsx`**
- Passes new `bestSpoolPrice`, `bestSpoolStoreName`, `bestSpoolIsConverted` to sidebar
- Fixed `hasLocalStore` to use `detailPricing.cheapestLocal != null` instead of `detailPricing.isLocal`
- StickyBuyBar and MobileBottomBar automatically use the global cheapest via existing prop wiring

### Step 5: Listing card (deferred)
**File: `src/components/FilamentCard.tsx`**
- No changes needed — uses `useResolvedPrice` (different pipeline, correct for performance)
- The price difference between listing cards and detail page is a data pipeline issue, not a UI bug
