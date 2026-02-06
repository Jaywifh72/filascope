

# Regional Pricing Data Pipeline Investigation & Fix Plan

## Root Cause Analysis

After thorough investigation, the problem is a **data gap**, not a code bug. The code pipeline is correctly structured but the underlying data is incomplete.

### What the Data Shows

**filament_prices table (normalized store-level pricing):**
- 119 total rows, but only **3 rows** have actual prices (price_cents > 0)
- All 3 are from Amazon US (USD)
- Amazon UK and Amazon Germany rows exist but have **price_cents = 0** (never scraped)
- No prices from any other stores

**Legacy filament columns (price_eur, price_gbp, etc.):**
- Out of 7,336 filaments with a USD price:
  - **1,047** have EUR prices (mostly Bambu Lab 227, Fillamentum 194, Fiberlogy 274)
  - **1,010** have CAD prices (mostly Polymaker 561, Bambu Lab 227)
  - **349** have GBP prices (all Bambu Lab)
  - **349** have AUD prices (all Bambu Lab)
- The vast majority (~85%) of filaments have **NO regional prices at all**

**Polymaker specifically (user's example):**
- 573 filaments, 561 have CAD prices from the Polymaker Canada store
- **Zero** EUR, GBP, or AUD prices despite having EU/UK/AU stores configured in `brand_regional_stores`
- The regional store URLs exist (eu.polymaker.com, uk.polymaker.com) but no prices were scraped

### How the Code Currently Handles This

The price resolution chain is:

```text
1. useFilamentStorePricing (filament_prices RPC) 
   --> Almost always empty (0 price_cents)
   
2. useUnifiedRegionalPricing (brand_regional_stores + regional columns)
   --> Checks price_eur/price_gbp etc. columns
   --> For Polymaker EU/UK/AU: columns are NULL
   --> Falls back to: convertPrice(variant_price, 'USD')
   --> This DOES convert properly ($19.99 * 0.846 = ~EUR16.92)
   
3. FilamentCard uses useRegionalPrice (legacy hook)
   --> Same priority chain, same result for non-CAD regions
```

### Where the "Same Number" Bug Likely Occurs

The conversion IS working in the `convertPrice` function. If the user is truly seeing identical numbers (e.g., $15.55 = C$15.55 = EUR15.55 = GBP15.55), the issue is likely:

1. **Exchange rates not loaded yet** -- `convertPrice` returns `amount * 1` when rates haven't loaded (the map is empty and fallback multiplier is `1`)
2. **Race condition on initial page load** -- the `currency_exchange_rates` query resolves after the first render, so cards may briefly show unconverted prices
3. **Polymaker CAD prices ARE different** (C$26.99 vs $19.99) -- if the user is seeing same numbers, it's for EUR/GBP/AUD where there's no data and conversion may be silently failing

The most likely culprit: in `getConversionRate()` at line 174 of RegionContext.tsx, when no direct rate exists AND no inverse exists, it falls through to:
```typescript
const toUsd = exchangeRates.get(toUsdKey) || 1;
const fromUsd = exchangeRates.get(fromUsdKey) || 1;
return toUsd * fromUsd;
```
If the exchange rates Map is empty (not yet loaded), both `toUsd` and `fromUsd` default to `1`, producing a rate of `1` -- meaning no conversion happens.

---

## Fix Plan

### Phase 1: Fix the Conversion Reliability (Frontend - Critical)

**Problem:** Exchange rates may not be loaded when prices first render, causing rate = 1 (no conversion).

**File: `src/contexts/RegionContext.tsx`**

1. Add a `hasRates` boolean derived from the exchange rates Map size
2. Expose `hasRates` in the context so consuming components can show a loading state instead of an unconverted price
3. Update `convertPrice` to return `null` (not the unconverted amount) when rates haven't loaded yet
4. Add a `useEffect` guard that re-renders dependents once rates are available

**File: `src/hooks/useRegionalPrice.ts`** (used by FilamentCard)

5. When `convertPrice` returns null/same value as input for a cross-currency conversion, mark the price as "loading" rather than displaying the raw USD number with a EUR/GBP symbol

**File: `src/components/FilamentCard.tsx`**

6. Show a skeleton/placeholder for the price while exchange rates are loading, instead of showing the unconverted USD number with the wrong currency symbol

### Phase 2: Populate Regional Price Data (Database)

The real fix is getting actual regional prices into the database. Two approaches in priority order:

**Approach A: Scrape Polymaker regional stores (preferred)**

Create or update an Edge Function to scrape the regional Polymaker stores (eu.polymaker.com, uk.polymaker.com, ca.polymaker.com) for actual prices. These stores show prices in their native currencies (EUR, GBP, CAD).

- Store results in the legacy `price_eur`, `price_gbp` etc. columns on the `filaments` table
- OR use the normalized `filament_prices` table with proper `store_id` references
- Run periodically (daily or weekly)

**Approach B: Populate filament_prices from existing regional column data**

For brands that already have regional price columns populated (Bambu Lab has all 4 currencies), ensure these are also reflected in the `filament_prices` table for the RPC to return them.

### Phase 3: Clear "Converted vs Actual" UI Indicators

**File: `src/components/FilamentCard.tsx`**

- When price is converted: show `~EUR16.92/kg` (tilde prefix, already implemented)
- When price is from actual regional data: show `EUR22.99/kg` (no tilde)
- Add a tooltip: "Estimated from $19.99 USD" for converted prices

**File: `src/hooks/useUnifiedRegionalPricing.ts`**

- Already correctly sets `isConverted = true` when falling back to USD conversion
- Already uses `showApproximate: true` in `formatPrice` call -- this is working

### Phase 4: Handle "No Price Available" Edge Case

**File: `src/components/FilamentCard.tsx`**

- When no price can be determined even after conversion attempts, show "Check price at store" instead of showing nothing or a confusing number
- Link to the regional store URL from `brand_regional_stores`

---

## Implementation Order

| Step | File | Change | Priority |
|------|------|--------|----------|
| 1 | `src/contexts/RegionContext.tsx` | Add `hasRates` flag, prevent unconverted price display | Critical |
| 2 | `src/hooks/useRegionalPrice.ts` | Return loading state when rates unavailable | Critical |
| 3 | `src/components/FilamentCard.tsx` | Show price skeleton while rates load | Critical |
| 4 | `src/hooks/useUnifiedRegionalPricing.ts` | Same loading guard for detail pages | Critical |
| 5 | Edge Function (new/update) | Scrape regional store prices | Important |
| 6 | `src/components/FilamentCard.tsx` | "Check price at store" fallback | Nice to have |

---

## Data Summary

```text
Current regional price coverage:

Brand           | USD | CAD | EUR | GBP | AUD | filament_prices
----------------|-----|-----|-----|-----|-----|----------------
Polymaker       | 573 | 561 |   0 |   0 |   0 | 3 (US only)
Bambu Lab       | 227 | 227 | 227 | 227 | 227 | 0
Fillamentum     | 194 |   0 | 194 |   0 |   0 | 0
Fiberlogy       | 274 |   0 | 274 |   0 |   0 | 0
Anycubic        | 685 |   0 |   0 |   0 |   0 | 0
FormFutura      | 460 |   0 |   0 |   0 |   0 | 0
eSun            | 360 |   0 |   0 |   0 |   0 | 0
All others      |~4K  |   0 |   0 |   0 |   0 | 0

Exchange rates: Last updated Feb 3, 2026 (3 days ago)
Rates stored: USD->EUR 0.846, USD->GBP 0.732, USD->CAD 1.367, USD->AUD 1.439
```

## Key Insight

The "same number, different symbol" issue is almost certainly caused by the exchange rates not being loaded when prices first render. The `convertPrice` function silently returns the unconverted amount (rate defaults to 1) rather than indicating the rates aren't ready yet. Phase 1 fixes this by making the system aware of its own data readiness state.

