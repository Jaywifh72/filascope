

# Fix Price Instability Across FilaScope

## Problem Analysis

After tracing the complete pricing data flow, I identified **four root causes** of price instability:

### Root Cause 1: Two Different Exchange Rate Tables
- `RegionContext.convertPrice()` reads from `currency_exchange_rates` (legacy base/target pairs)
- `useFilamentStorePricing` reads from `exchange_rates` (normalized `rate_to_usd` values)
- These tables can contain different rates updated at different times, causing the same conversion to produce different results depending on which component does the math

### Root Cause 2: Race Conditions in Detail Page Pricing
- `useFilamentDetailPricing` fires 4 async data sources in parallel: local retailer listings, US retailer listings, store pricing (RPC), and unified regional pricing
- Each resolves at a different time, causing the `useMemo` to recompute and the "best price" to jump between candidates
- On one render the cheapest might be an Amazon listing at C$75/kg; on the next, a store-pricing RPC result at C$102/kg resolves and becomes the new "best"

### Root Cause 3: Duplicate Per-Kg Calculation in FilamentDetail.tsx
- Lines 610-614 independently compute `rawPricePerKg` using `regionalPriceResult.displayPrice / totalWeightKg`
- Meanwhile, `detailPricing.pricePerKg` computes per-kg using listing spool prices
- The sidebar uses `detailPricing.pricePerKg ?? rawPricePerKg` -- so it flip-flops between these two different values as async sources load

### Root Cause 4: Listing Cards vs Detail Pages Use Completely Different Pricing Paths
- `FilamentCard` uses `useResolvedPrice` (deterministic, DB-column-only, no async fetching)
- `FilamentDetail` uses `useFilamentDetailPricing` (async aggregator across 4 sources)
- These fundamentally different approaches can produce different per-kg values for the same product

---

## Implementation Plan

### Step 1: Unify Exchange Rate Source

Consolidate all exchange rate conversions to use a single source.

**Changes:**
- **`src/contexts/RegionContext.tsx`**: Change `loadExchangeRates()` to read from the `exchange_rates` table (using `rate_to_usd`) instead of the legacy `currency_exchange_rates` table. Build the `fromCurrency_toCurrency` map from these normalized rates. This ensures `RegionContext.convertPrice()` and `useExchangeRateMap()` return identical conversion results.
- **`src/hooks/useExchangeRates.ts`**: Add a `staleTime` alignment comment to confirm it matches RegionContext's caching window (1 hour).

### Step 2: Stabilize `useFilamentDetailPricing` Against Race Conditions

Prevent the "best price" from jumping as async sources resolve incrementally.

**Changes to `src/hooks/useFilamentDetailPricing.ts`:**
- Add an `isReady` gate to the `useMemo` that builds candidates: only compute and return candidates when **all** sources have finished loading (not just some)
- While loading, return a stable "pending" state with `bestPrice: null` and `isLoading: true`
- This means the price appears once (correctly) rather than flickering through intermediate states
- Keep the existing `isReady` flag semantics but enforce it: `allCandidates` returns empty until `isReady === true`

### Step 3: Remove Duplicate Per-Kg Calculation from FilamentDetail.tsx

Eliminate the competing `rawPricePerKg` logic that conflicts with the SSOT hook.

**Changes to `src/pages/FilamentDetail.tsx`:**
- Remove the independent `rawPricePerKg` and `rawPricePerSpool` calculations (lines 610-629)
- Change `sidebarPricePerKg` to use `detailPricing.pricePerKg` exclusively (no `?? rawPricePerKg` fallback)
- Same for `sidebarPricePerSpool` -- use only `detailPricing.pricePerSpool`
- Keep `rawPricePerKg` only for the pricing validation call and SEO meta (where it's needed as a simple sanity check), clearly labeled as "validation-only"
- The sticky bar, mobile bar, and sidebar will now all receive the exact same value from `detailPricing`

### Step 4: Align FilamentCard with the Same Per-Kg Formula

Ensure listing page cards produce the same number as the detail page.

**Changes:**
- **`src/components/FilamentCard.tsx`**: `useResolvedPrice` already uses `resolveFilamentPrice` which uses `computePricePerKg` -- this is correct and deterministic. No changes needed to the card's core price logic.
- **`src/hooks/useFilamentDetailPricing.ts`**: Ensure the per-kg computation uses `computePricePerKg()` from `resolveFilamentPrice.ts` instead of inline `price / totalWeightKg` division. This guarantees the same formula is used everywhere.
- Specifically, replace the inline `pricePerKg: price / totalWeightKg` with `pricePerKg: computePricePerKg(price, filament.net_weight_g, packQty)` for every candidate

### Step 5: Make the Sticky Bar Prefer Local Stores

Ensure the mobile bottom bar and sticky bar show the best local price first.

**Changes to `src/hooks/useFilamentDetailPricing.ts`:**
- Add a new convenience accessor: `stickyBarPrice` that returns `cheapestLocal ?? bestPrice` (local-first, global fallback)
- Update the return type and value

**Changes to `src/pages/FilamentDetail.tsx`:**
- Update sticky bar and mobile bottom bar props to use `detailPricing.stickyBarPrice` instead of `detailPricing.bestPrice` for the displayed price
- The sidebar still shows `bestPrice` (absolute cheapest globally) since it has room for the full store context

---

## Technical Details

### Files Modified

| File | Change |
|------|--------|
| `src/contexts/RegionContext.tsx` | Switch from `currency_exchange_rates` to `exchange_rates` table |
| `src/hooks/useFilamentDetailPricing.ts` | Gate candidates behind `isReady`; use `computePricePerKg`; add `stickyBarPrice` |
| `src/pages/FilamentDetail.tsx` | Remove `rawPricePerKg`/`rawPricePerSpool` fallbacks; use SSOT values exclusively |
| `src/lib/resolveFilamentPrice.ts` | No changes (already correct -- exports `computePricePerKg`) |
| `src/components/FilamentCard.tsx` | No changes (already uses `useResolvedPrice` correctly) |
| `src/components/filament/StickyBuyBar.tsx` | No structural changes (receives correct props from parent) |
| `src/components/filament/sidebar/FilamentMobileBottomBar.tsx` | No structural changes |

### Expected Outcome

After these changes:
1. The same product will show identical per-kg prices on listing cards, detail hero, sidebar, sticky bar, and mobile bar
2. Prices will appear once (after all sources resolve) instead of flickering
3. Currency conversion will be consistent across all components since they share one rate source
4. The sticky bar will prefer showing local store prices, falling back to international only when no local option exists

