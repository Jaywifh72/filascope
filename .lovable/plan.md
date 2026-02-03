
# Plan: TypeScript Types and React Hooks for Regional Pricing Tables

## Summary

This plan creates TypeScript type definitions and React hooks for the regional pricing infrastructure created in Phases 1-3. The types will map to the actual database schema, and the hooks will follow existing patterns in the codebase.

---

## Current State Analysis

| Component | Status |
|-----------|--------|
| `src/types/regional.ts` | Exists with legacy types (BrandRegionalStore, CurrencyExchangeRate) |
| `src/config/currencies.ts` | Exists with `formatPrice()` utility |
| `src/hooks/useExchangeRateRefresh.ts` | Exists (Phase 3) |
| `src/hooks/useFilamentListings.ts` | Example hook pattern for listings with joins |
| `src/hooks/useRegionalMutations.ts` | Example mutation pattern |

### Actual Database Schema (from Phase 1)

| Table | Key Fields |
|-------|------------|
| `stores` | id, name, slug, store_type, region, country_code, currency_code, base_url, ships_from[], ships_to[], is_active |
| `filament_prices` | id, filament_id, store_id, price_cents, currency_code, product_url, affiliate_url, in_stock |
| `exchange_rates` | currency_code (PK), currency_name, currency_symbol, rate_to_usd, updated_at |
| `region_config` | region_code (PK), region_name, currency_code, flag_emoji, default_store_priority[], amazon_domain, is_active |

Note: User requested `store_listings` and `scrape_imports` tables, but these don't exist in the database. Will create types for actual tables and note the discrepancy.

---

## Implementation Steps

### Step 1: Extend `src/types/regional.ts` with New Table Types

Add interfaces that map directly to the Phase 1 database tables:

```typescript
// New interfaces to add:

/** Maps to: stores table (Phase 1) */
export interface Store {
  id: string;
  name: string;
  slug: string;
  store_type: 'marketplace' | 'brand_direct' | 'retailer';
  region: string;
  country_code: string | null;
  currency_code: string | null;
  base_url: string;
  affiliate_tag: string | null;
  affiliate_network: string | null;
  ships_from: string[] | null;
  ships_to: string[] | null;
  logo_url: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Maps to: filament_prices table (Phase 1) */
export interface FilamentPrice {
  id: string;
  filament_id: string;
  store_id: string;
  price_cents: number;
  currency_code: string;
  product_url: string | null;
  affiliate_url: string | null;
  in_stock: boolean;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  store?: Store;
}

/** Maps to: exchange_rates table (Phase 1) */
export interface ExchangeRate {
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  rate_to_usd: number;
  updated_at: string | null;
}

/** Maps to: region_config table (Phase 1) */
export interface RegionConfigDb {
  region_code: string;
  region_name: string;
  currency_code: string | null;
  flag_emoji: string | null;
  default_store_priority: string[] | null;
  amazon_domain: string | null;
  is_active: boolean;
}

/** Joined result for filament price display */
export interface FilamentPriceWithStore extends FilamentPrice {
  store: Store;
  price_display: number; // price_cents / 100
  price_local: number; // Converted to user's currency
  is_local_store: boolean;
  ships_to_user: boolean;
}
```

### Step 2: Create `src/hooks/useStores.ts`

Query and mutation hooks for the stores table:

```typescript
// useStores() - Get all active stores
// useStore(id) - Get single store by ID
// useStoreBySlug(slug) - Get store by slug
// useStoresByRegion(region) - Get stores for a region
// useCreateStore() - Admin mutation
// useUpdateStore() - Admin mutation
// useDeleteStore() - Admin mutation
```

Features:
- Filter by `region`, `store_type`, `is_active`
- Order by `name`
- 30-minute stale time for list queries
- Query cache invalidation on mutations

### Step 3: Create `src/hooks/useFilamentPrices.ts`

Query hooks for the filament_prices table:

```typescript
// useFilamentPrices(filamentId, options) - Get all prices for a filament
// useFilamentBestPrice(filamentId, userRegion) - Get best price using RPC
// useFilamentRegionalPrices(filamentId, userRegion) - Use get_filament_regional_prices RPC
```

Features:
- Join with `stores` table for complete data
- Use Phase 2 RPC functions for smart regional pricing
- Filter by `in_stock`
- Convert price_cents to display price

### Step 4: Create `src/hooks/useExchangeRates.ts`

Query hooks for exchange rates:

```typescript
// useExchangeRates() - Get all rates from exchange_rates table
// useExchangeRateStatus() - Get from exchange_rate_status view
// useConvertPrice(amount, fromCurrency, toCurrency) - Client-side conversion
// useShouldRefreshRates() - Check if rates need refresh
```

Features:
- Use `exchange_rate_status` view for freshness info
- 1-hour stale time (rates don't change often)
- Provide conversion helper that uses cached rates

### Step 5: Create `src/hooks/useRegionConfig.ts`

Query hook for region configuration:

```typescript
// useRegionConfigs() - Get all active region configs
// useRegionConfig(regionCode) - Get single region config
```

Features:
- Filter by `is_active`
- Use for populating region dropdowns
- Includes default store priority array

### Step 6: Create/Update `src/utils/formatPrice.ts`

Enhanced price formatting utilities:

```typescript
// Currency configuration with locale support
const currencyConfig: Record<string, CurrencyFormatConfig> = {
  USD: { symbol: '$', locale: 'en-US', decimals: 2 },
  CAD: { symbol: 'C$', locale: 'en-CA', decimals: 2 },
  EUR: { symbol: '€', locale: 'de-DE', decimals: 2 },
  GBP: { symbol: '£', locale: 'en-GB', decimals: 2 },
  AUD: { symbol: 'A$', locale: 'en-AU', decimals: 2 },
  JPY: { symbol: '¥', locale: 'ja-JP', decimals: 0 },
  CNY: { symbol: '¥', locale: 'zh-CN', decimals: 2 },
};

// formatPrice(amount, currency) - Format with symbol
// formatCents(cents, currency) - Convert cents to formatted price
// convertPrice(amount, fromRate, toRate) - Currency conversion
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/types/regional.ts` | Modify | Add Store, FilamentPrice, ExchangeRate, RegionConfigDb types |
| `src/hooks/useStores.ts` | Create | CRUD hooks for stores table |
| `src/hooks/useFilamentPrices.ts` | Create | Query hooks for filament_prices with RPC |
| `src/hooks/useExchangeRates.ts` | Create | Query hooks for exchange rates |
| `src/hooks/useRegionConfig.ts` | Create | Query hooks for region_config |
| `src/utils/formatPrice.ts` | Create | Enhanced price formatting utilities |

---

## Technical Notes

### Type Strategy

The types will:
1. Use the Supabase-generated types from `src/integrations/supabase/types.ts` as the source of truth
2. Create convenient wrapper types in `src/types/regional.ts` for easier use
3. Add computed/joined types for complex queries

### Hook Patterns

Following existing patterns:
- Use `@tanstack/react-query` for all data fetching
- Use `supabase` client from `@/integrations/supabase/client`
- Return `{ data, isLoading, error }` structure
- Use `useQueryClient` for cache invalidation
- Mutations return promises and show toasts

### RPC Integration

The hooks will leverage the Phase 2 RPC functions:
- `get_filament_regional_prices(filament_id, user_region)` - Returns sorted, converted prices
- `get_filament_best_price(filament_id, user_region)` - Returns single best price
- `should_refresh_exchange_rates()` - Returns boolean for refresh check

### Query Keys

Consistent naming:
- `['stores']` - All stores
- `['stores', storeId]` - Single store
- `['stores', 'region', regionCode]` - Stores by region
- `['filament-prices', filamentId]` - Prices for filament
- `['filament-prices', 'regional', filamentId, region]` - Regional prices
- `['exchange-rates']` - All rates
- `['exchange-rate-status']` - Rate status view
- `['region-config']` - All region configs

---

## Note on Requested Tables

The user requested types for `store_listings` and `scrape_imports` tables. These tables don't exist in the current database schema. The actual Phase 1 tables are:
- `stores` (not `store_listings`)
- `filament_prices` (contains listing-like data)
- `exchange_rates` (simple currency lookup)
- `region_config` (region settings)

The implementation will use the actual table structures. If `store_listings` or `scrape_imports` tables are needed, they should be created first via database migration.

---

## Example Usage

After implementation:

```typescript
// Get all stores for a region
const { data: stores } = useStores({ region: 'US' });

// Get regional prices for a filament
const { data: prices } = useFilamentRegionalPrices(filamentId, 'CA');

// Get exchange rates
const { data: rates } = useExchangeRates();

// Format a price from cents
const display = formatCents(2499, 'USD'); // "$24.99"

// Convert price between currencies
const converted = convertPrice(24.99, rates['USD'], rates['CAD']);
```
