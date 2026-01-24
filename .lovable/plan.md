

# RegionContext System - Implementation Plan

## Overview

This plan creates a new `RegionContext` that provides unified region and currency management throughout FilaScope. It will coexist with the existing `useCurrency` hook initially (for backward compatibility) while offering enhanced features like database-backed exchange rates and regional store resolution.

## Current State Analysis

The codebase already has substantial regional infrastructure:

| Component | Location | Status |
|-----------|----------|--------|
| `CurrencyProvider` | `src/hooks/useCurrency.tsx` | Active - manages currency selection, persists to localStorage and profiles |
| `useRegionalPrice` | `src/hooks/useRegionalPrice.ts` | Active - resolves regional prices with fallback logic |
| `useRegionalStore` | `src/hooks/useRegionalStore.ts` | Active - transforms URLs to regional variants |
| `currency_exchange_rates` table | Database | Created - contains seed rates |
| `user_region_preferences` table | Database | Created - ready for use |
| Config files | `src/config/regions.ts`, `src/config/currencies.ts` | Created - ready for use |

**Key Insight**: The new `RegionContext` should enhance the existing system by:
1. Loading exchange rates from the database instead of hardcoded values
2. Adding explicit region tracking (separate from currency)
3. Providing a unified API that combines region + currency utilities

---

## Implementation Plan

### File 1: Create `src/contexts/RegionContext.tsx`

A new React Context that provides:
- **State**: `region` (RegionCode) and `currency` (CurrencyCode)
- **Persistence**: localStorage + database (user_region_preferences)
- **Auto-detection**: Browser locale on first visit
- **Exchange rates**: Loaded from `currency_exchange_rates` table
- **Utility functions**: Price conversion, formatting, fallback regions

**Key Features**:
- `setRegion(region)` - also updates currency to region's default
- `setCurrency(currency)` - can override region's default currency
- `convertPrice(amount, fromCurrency)` - database-backed conversion
- `getConversionRate(from, to)` - direct rate lookup
- `getFallbackRegions()` - ordered fallback list for current region
- `formatPrice(amount, options)` - formatted in current currency

### File 2: Create `src/hooks/useRegionalPriceV2.ts`

An enhanced version of the existing hook that uses the new RegionContext and database stores:
- Queries `brand_regional_stores` for store configuration
- Falls back through regions using `REGION_FALLBACK_ORDER`
- Returns `RegionalPriceResult` with store metadata
- Maintains backward compatibility with existing `FilamentWithRegionalPrices` interface

### File 3: Update `src/App.tsx`

Wrap the application with `RegionProvider`:
- Position it inside `QueryClientProvider` but outside route content
- Place alongside existing `CurrencyProvider` initially (for gradual migration)

---

## Technical Details

### RegionContext State Management

```text
Initial Load Flow:
1. Check localStorage for 'filascope_region_prefs'
2. If found and < 30 days old → use stored values
3. Else → detect from navigator.language
4. Load exchange rates from currency_exchange_rates table
5. Set isLoading = false

Persistence Flow:
1. User changes region/currency
2. Update React state immediately
3. Save to localStorage
4. If authenticated → save to user_region_preferences table
```

### Exchange Rate Loading

```text
Rate Storage in Map:
- "USD_CAD" → 1.36
- "CAD_USD" → 0.735 (inverse)
- "USD_USD" → 1 (identity)

Conversion Logic:
- Direct: rates.get("USD_CAD")
- Via USD: rates.get("GBP_USD") * rates.get("USD_CAD")
```

### Provider Nesting Order

```text
<ErrorBoundary>
  <HelmetProvider>
    <QueryClientProvider>
      <RegionProvider>        ← NEW (fetch rates from DB)
        <CurrencyProvider>    ← KEEP (for backward compat)
          <CompatibleCountProvider>
            ... rest of app
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/contexts/RegionContext.tsx` | Create | New context with region + currency + DB rates |
| `src/hooks/useRegionalPriceV2.ts` | Create | Enhanced hook using brand_regional_stores |
| `src/App.tsx` | Modify | Wrap with RegionProvider |

---

## Backward Compatibility

The existing `useCurrency` hook and `useRegionalPrice` hook will continue to work unchanged. The new `useRegion` context provides an enhanced API that can be adopted gradually:

- Components can import `useRegion` for new features (DB-backed rates, region tracking)
- Components using `useCurrency` continue working with hardcoded rates
- Migration can happen incrementally over time

---

## Migration Path

**Phase 1** (this implementation):
- Create RegionContext with DB-backed exchange rates
- Add useRegionalPriceV2 for stores from brand_regional_stores
- Both old and new systems coexist

**Phase 2** (future):
- Migrate components from useCurrency to useRegion
- Populate brand_regional_stores with existing BRAND_REGIONAL_STORES config
- Deprecate hardcoded rates in useCurrency

**Phase 3** (future):
- Remove CurrencyProvider once all components migrated
- Remove hardcoded BRAND_REGIONAL_STORES config

