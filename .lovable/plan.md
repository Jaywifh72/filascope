
# Fix: Pricing Tab Currency Conversion Bug ✅ IMPLEMENTED

## Problem

The "Where to Buy" section on the Pricing tab shows the **same price for every store** (e.g., ~C$21.26/kg for all 7 stores) because of a fundamental data flow error.

**Root cause**: The Pricing tab builds its store list from `useUnifiedRegionalPricing().allStores`, which only contains store **metadata** (name, region, URL pattern, currency) -- no per-store prices. The code then assigns the **same single `pricePerKg`** prop (the globally cheapest price) to every store and "reverse-converts" it into fake native prices. Every store thus shows the same number.

**Meanwhile**, the Overview tab's "Best Prices" section uses `useFilamentDetailPricing().allCandidates`, which contains real, distinct prices per store from multiple data sources (filament_listings, filament_prices RPC, brand_regional_stores). That's why the Overview tab shows correct, different prices.

## Solution

Replace the Pricing tab's broken store list construction with the already-computed `allCandidates` from `useFilamentDetailPricing` -- the same single source of truth the Overview tab already uses.

## Changes

### 1. Update `PricingTabContent` props (src/components/filament/tabs/PricingTabContent.tsx)

- Add new prop: `priceCandidates?: PriceCandidate[]` and `candidatesLoading?: boolean`
- Import `PriceCandidate` type from `useFilamentDetailPricing`
- Remove the internal `useUnifiedRegionalPricing` hook call (it was only used for `allStores`)
- Remove `pricePerKg` as the source for per-store prices

### 2. Rewrite `unifiedStoreList` construction

- Instead of iterating `allStores` and assigning the same price, map from `priceCandidates` which already has:
  - `name` (retailer name)
  - `pricePerKg` (properly converted to user's currency)
  - `spoolPrice` (total price in user's currency)
  - `isConverted` / `originalCurrency`
  - `storeRegion` / `isLocal`
  - `productUrl` / `affiliateUrl`
- Each candidate has a genuinely different price since they come from actual store listings
- Keep the existing `StoreRow` component but feed it real data instead of faked reverse-conversions

### 3. Compute native prices correctly

For international stores (where `isConverted` is true):
- The `spoolPrice` is already in the user's currency
- To show the native price in parentheses, reverse-convert from user currency to the store's native currency using `getConversionRate`
- This is the **same direction** as before, but now starts from a per-store price instead of a global best price

For local stores:
- Show the price directly without tilde or parenthetical

### 4. Pass candidates from FilamentDetail.tsx

- `FilamentDetail.tsx` already has `detailPricing.allCandidates` and `detailPricing.isLoading`
- Pass these as new props to `PricingTabContent`:
  ```
  priceCandidates={detailPricing.allCandidates}
  candidatesLoading={detailPricing.isLoading}
  ```

### 5. Keep deduplication and sorting logic

- Retain the existing deduplication logic (group by store+region, pick best price)
- Retain local-first sorting
- The existing `StoreRow` UI stays the same -- only the data feeding into it changes

### 6. Exchange rate freshness indicator

- Add a small "Exchange rates updated [X ago]" line at the bottom of the Where to Buy section when any converted prices are shown
- Source this from the `exchange_rates` table's `updated_at` timestamp (already available via `useExchangeRateMap`)

## What stays the same

- The `StoreRow` component's visual layout
- Price history chart section
- Price alerts section
- The deduplication and local-first sorting strategy
- The Overview tab (already correct)

## Technical Details

```text
BEFORE (broken):
  allStores (metadata only, no prices)
    --> assign same pricePerKg to every store
    --> reverse-convert to "native" prices
    --> all stores show identical ~C$21.26/kg

AFTER (fixed):
  allCandidates (from useFilamentDetailPricing)
    --> each candidate has real per-store price
    --> Amazon US: ~C$28.70/spool (~C$21.26/kg)  
    --> Polymaker US: ~C$75.18/spool (~C$55.69/kg)
    --> Polymaker Canada: C$102.52/spool (C$75.94/kg)
```

Files modified:
- `src/components/filament/tabs/PricingTabContent.tsx` -- main fix
- `src/pages/FilamentDetail.tsx` -- pass new props
