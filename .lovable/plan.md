

# Fix Pricing Inconsistency Across All Views

## Problem Summary

The same product shows wildly different prices across card, table, detail sidebar, Best Prices section, and sticky bar views. The root cause is that **6 different price calculation paths** exist independently, each with their own data source, conversion logic, and formatting.

## Root Causes Identified

### 1. Six Independent Price Pipelines
Each view computes prices differently:

| View | Price Source | Conversion Method | Per-Kg Calculation |
|------|------------|-------------------|-------------------|
| Card | `useRegionalPrice` + `useCurrentPrice` (live) | `useRegion().convertPrice` | Inline: `price / (weightKg * packQty)` |
| Table | Inline `getRegionalPrice()` function | `useRegion().convertPrice` | Inline: `price / (weightKg * packQty)` |
| Detail Sidebar | `useUnifiedRegionalPricing` + `useFilamentStorePricing` + `useCurrentPrice` (live again!) | Mix of `useRegion` and manual conversion | Recalculates from `displayPrice / effectiveWeightKg` |
| Best Prices | `useFilamentListings` hardcoded to US/USD | `useCurrency().formatRegionalPrice` (no actual conversion!) | Not computed (shows spool price only) |
| Sticky Bar | Props from parent (sidebarPricePerKg) | `useCurrency().formatPrice` or `formatRegionalPrice` | Received as prop |
| Mobile Bar | Props from parent (sidebarPricePerKg) | Passed through | Received as prop |

### 2. Two Competing Currency Systems
- **`useCurrency()`** (older): Uses hardcoded fallback rates, has `formatPrice` that converts from USD, and `formatRegionalPrice` that skips conversion entirely.
- **`useRegion()`** (newer): Uses live exchange rates from the database, has `formatPrice` with `showApproximate` option and proper conversion.

Components mix these two systems, causing different numbers.

### 3. BestPricesSection is Hardcoded to USD
The `BestPricesSection` component always fetches listings with `region: 'US'` and `currency: 'USD'`, then formats with `useCurrency().formatRegionalPrice` which simply prepends the local currency symbol without converting the value. A Canadian user sees "$54.99" (USD) with no conversion.

### 4. Sidebar Does Its Own Live Price Fetch
The sidebar (`FilamentPurchaseSidebar`) receives a `pricePerKg` from the parent but then runs its own `useCurrentPrice` call (line 106), potentially getting a different price from the live scraper, then recalculates per-kg price using different weight data.

## Implementation Plan

### Phase 1: Create a Single Price Resolution Utility

Create a new shared utility `src/lib/resolveFilamentPrice.ts` that consolidates all price resolution logic into one deterministic function:

```text
resolveFilamentPrice(filament, userCurrency, exchangeRates)
  -> { spoolPrice, pricePerKg, currency, isConverted, source, storeName }
```

**Resolution priority:**
1. Direct regional price column (e.g., `price_cad` for CAD users) -- native price, no conversion
2. Nearby region conversion (e.g., `price_eur` converted to CHF)
3. USD (`variant_price`) converted to user's currency
4. null (no price available)

**Per-kg calculation:**
```text
pricePerKg = spoolPrice / ((net_weight_g / 1000) * pack_quantity)
```

This function is pure (no hooks, no side effects) so it can be used in any context.

### Phase 2: Create a Shared Hook Wrapper

Create `src/hooks/useResolvedPrice.ts` -- a thin hook that calls the utility with data from `useRegion()`:

```text
useResolvedPrice(filament) -> {
  spoolPrice, pricePerKg, formattedSpoolPrice, formattedPricePerKg,
  isConverted, source, currency
}
```

This replaces the inline price calculations in card, table, and detail views.

### Phase 3: Fix Each View to Use the Shared Source

**3a. FilamentCard.tsx**
- Replace the inline `effectivePrice` / `pricePerKg` calculation with `useResolvedPrice(filament)`
- Remove the `useCurrentPrice` live-scraping call (this is what causes the sidebar to show different prices; live scraping is unreliable and adds latency)
- Keep `useRegionalPrice` only for URL resolution (not price)

**3b. FilamentTableView.tsx**
- Replace the inline `getRegionalPrice` function with `useResolvedPrice` (called per-row via the shared utility, since the hook can't be called in a loop)
- Instead, use the pure `resolveFilamentPrice()` utility directly inside the `.map()` loop with the region context values passed in

**3c. FilamentDetail.tsx (Sidebar Price)**
- Replace the complex `sidebarBest` logic with the same `resolveFilamentPrice` for the base product price
- If `useFilamentStorePricing` returns a better local store price, use that -- but convert it through the same utility for consistency
- Pass the resolved price to `FilamentPurchaseSidebar` and mark it as final (no further recalculation)

**3d. FilamentPurchaseSidebar.tsx**
- Remove the independent `useCurrentPrice` call (line 106) -- the sidebar should display whatever the parent tells it, not re-fetch
- Use the `pricePerKg` prop directly as the display value
- Format using `useRegion().formatPrice` exclusively (not `useCurrency`)

**3e. BestPricesSection.tsx** (Critical fix)
- Change from hardcoded `region: 'US', currency: 'USD'` to use the user's actual region and currency from `useRegion()`
- Replace `useCurrency().formatRegionalPrice` with `useRegion().formatPrice`
- If prices come back in a different currency than the user's, convert them using `useRegion().convertPrice`

**3f. StickyBuyBar.tsx**
- Replace `useCurrency()` formatting with `useRegion().formatPrice`
- Accept `isConverted` as a prop and pass `showApproximate: isConverted` to the formatter

### Phase 4: Deprecate useCurrency for Price Display

- Add a deprecation comment to `useCurrency.tsx` stating all price formatting should use `useRegion().formatPrice`
- The `useCurrency` hook has hardcoded fallback rates that diverge from the live DB rates in `RegionContext`, causing subtle differences

### Phase 5: Document the Price/True Cost Distinction

Add inline documentation clarifying:
- **"Price"** column = spool price (what you pay for one spool), calculated as `resolvedPrice / pack_quantity`
- **"True Cost"** column = per-kg normalized price, calculated as `resolvedPrice / ((net_weight_g / 1000) * pack_quantity)`

## Technical Details

### resolveFilamentPrice Utility Signature

```text
Input:
  filament: { variant_price, price_cad, price_eur, price_gbp, price_aud, price_jpy,
              net_weight_g, pack_quantity }
  userCurrency: CurrencyCode
  convertFromUSD: (amount: number) => number | null
  hasRates: boolean

Output:
  {
    spoolPrice: number | null      -- total price for the package
    pricePerSpool: number | null   -- price per individual spool (spoolPrice / packQty)
    pricePerKg: number | null      -- normalized per-kg cost
    currency: CurrencyCode
    isConverted: boolean           -- true if price was converted (show ~ prefix)
    source: 'regional' | 'converted' | 'unavailable'
  }
```

### Column-to-Currency Mapping (reused from existing code)
```text
USD -> variant_price
CAD -> price_cad
EUR -> price_eur
GBP -> price_gbp
AUD -> price_aud
JPY -> price_jpy
```

### Files to Create
- `src/lib/resolveFilamentPrice.ts` -- pure utility function
- `src/hooks/useResolvedPrice.ts` -- React hook wrapper

### Files to Modify
- `src/components/FilamentCard.tsx` -- use shared price, remove live fetch
- `src/components/FilamentTableView.tsx` -- use shared utility
- `src/pages/FilamentDetail.tsx` -- simplify sidebarBest, pass resolved price
- `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx` -- remove independent live fetch
- `src/components/filament/BestPricesSection.tsx` -- use user's region, convert prices
- `src/components/filament/StickyBuyBar.tsx` -- use `useRegion` formatting
- `src/hooks/useCurrency.tsx` -- add deprecation notice

### Risk Mitigation
- The `useCurrentPrice` live-scraping hook will be removed from card and sidebar views. This means prices shown are from the database only. This is actually more reliable since live scraping often returns wrong prices due to geo-redirects (documented in the regional-scraper-constraints memory).
- The `useFilamentStorePricing` hook (RPC-based) will remain as an additional price source on the detail page, but its output will be normalized through the same formatting pipeline.
- Exchange rate loading guards (`hasRates`) will be preserved to prevent 1:1 conversion display.

