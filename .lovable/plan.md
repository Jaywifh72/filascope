
# Fix Extrudr EUR-Only Pricing Architecture

## Problem
Extrudr is an Austrian manufacturer that only sells in EUR. However, the current system stores Extrudr prices in `variant_price` (the USD column) without any currency indicator, creating a mismatch. The legacy sync path passes no currency context, so downstream consumers assume USD.

## Current State (from DB investigation)
- `variant_price` = 29.74 (a EUR-to-USD converted value using the hardcoded 1.08 exchange rate)
- `price_eur` = 34.9 (the actual EUR price from the store)
- No `product_regional_urls` or `product_regional_prices` entries exist for Extrudr
- `sync-extrudr-products` sets both `variant_price` and `price_eur` to the same default EUR price
- `price-regional.ts` already correctly maps all Extrudr regions to EUR

## Solution (Option A: EUR-only, accurate)

### 1. Database Update: Fix existing Extrudr `variant_price` values
Set `variant_price = NULL` for all Extrudr products since there is no USD price. The EUR price lives in `price_eur`. This prevents the UI from showing a fake "USD" price that's actually EUR.

```sql
UPDATE filaments
SET variant_price = NULL
WHERE LOWER(vendor) = 'extrudr';
```

### 2. Update `sync-extrudr-products` to stop setting `variant_price`
In `supabase/functions/sync-extrudr-products/index.ts`, change:
- `variant_price: defaultPrice` to `variant_price: null` (no USD price exists)
- Keep `price_eur: defaultPrice` as-is

### 3. Update `sync-prices` legacy fallback for Extrudr
In `supabase/functions/sync-prices/index.ts`, when the legacy (non-regional-URL) flow processes an Extrudr product, it should:
- Pass `currency: 'EUR'` to the extraction call
- Write the result to `price_eur` instead of `variant_price`

Add a vendor-aware currency override in the legacy sync path (around line 530-560):
```typescript
// For EUR-only brands like Extrudr, override currency and target column
const isEurOnlyBrand = vendor.toLowerCase() === 'extrudr';
const legacyCurrency = isEurOnlyBrand ? 'EUR' : null;
const legacyPriceColumn = isEurOnlyBrand ? 'price_eur' : priceColumn;
```

### 4. No changes needed to `price-regional.ts`
Already correctly configured with `currency: "EUR"` for all Extrudr regions.

### 5. Redeploy affected edge functions
- `sync-prices`
- `sync-extrudr-products`

### 6. Re-run Extrudr sync
After deployment, trigger a brand sync for Extrudr to populate correct EUR prices in `price_eur`.

## Technical Details

### Files to modify:
1. **`supabase/functions/sync-extrudr-products/index.ts`** -- Set `variant_price: null` instead of `defaultPrice`
2. **`supabase/functions/sync-prices/index.ts`** -- Add EUR-only brand detection in legacy sync path, write to `price_eur` column
3. **Database migration** -- `UPDATE filaments SET variant_price = NULL WHERE LOWER(vendor) = 'extrudr'`

### Impact
- Extrudr products will show EUR prices everywhere (accurate)
- US/CA/UK/AU users see the same EUR price (which is what Extrudr actually charges)
- The `useFilamentStorePricing` hook already handles currency conversion via exchange rates, so converted display prices will still work
- No impact on other brands
