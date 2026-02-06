
# Fix: Regional Pricing Currency Mismatch Bug

## Root Cause Analysis

After investigating the database schema, stored data, and frontend price resolution logic, I identified **three interconnected bugs** in `src/hooks/useRegionalPrice.ts`:

### Bug 1: Currency-to-Column Mapping Treats Foreign Currencies as USD/EUR

The `CURRENCY_TO_PRICE_COLUMN` mapping (lines 33-50) maps currencies that lack dedicated database columns to **other currencies' columns**:

```text
CNY  --> 'variant_price' (USD column!) --> shows $19.99 as ¥19.99 CNY
KRW  --> 'variant_price' (USD column!) --> shows $19.99 as ₩19.99 KRW  
INR  --> 'variant_price' (USD column!) --> shows $19.99 as ₹19.99 INR
MXN  --> 'variant_price' (USD column!)
BRL  --> 'variant_price' (USD column!)
CHF  --> 'price_eur'     (EUR column!) --> shows €22.99 as Fr22.99 CHF
SEK  --> 'price_eur'     (EUR column!) --> shows €22.99 as 22.99 kr SEK
PLN  --> 'price_eur'     (EUR column!)
CZK  --> 'price_eur'     (EUR column!)
NZD  --> 'price_aud'     (AUD column!) --> shows A$34.99 as NZ$34.99
```

When the mapped column has data, Priority 1 (line 391) marks it as `isActualRegionalPrice: true` and returns the raw numeric value slapped with the wrong currency symbol. A $19.99 USD spool appears as ¥19.99 CNY (should be ~¥139 CNY).

### Bug 2: Priority 4 Fallback Uses Hardcoded Stale Exchange Rates

When Priority 4 (line 461-507) converts between regional prices, it uses:
```
const sourceRate = CURRENCIES[fallback.cur]?.rate || 1;
const targetRate = CURRENCIES[currency]?.rate || 1;
```

These `CURRENCIES[].rate` values come from `useCurrency.tsx` — **hardcoded static rates** (e.g., JPY: 149.50) rather than the database-loaded exchange rates in `RegionContext` (actual: 155.35). It also incorrectly sets `isActualRegionalPrice: true` for converted prices, hiding the `~` prefix.

### Bug 3: LabReadoutCard Missing Safety Guards

Unlike `FilamentCard`, the `LabReadoutCard` component:
- Does not destructure or check `isRatesLoading` from `useRegionalPrice`
- Does not guard `useCurrentPrice` calls with `shouldFetchLivePrice`
- Uses a simplistic `isConverted` check that misses the `priceSource === 'converted'` case

### Data Context

From the database:
- **7,336** filaments have `variant_price` (USD)
- **0** have `price_jpy` populated
- No `price_cny` column exists at all
- `currency_exchange_rates` table has correct live rates (USD to JPY = 155.35, USD to CNY = 6.95)

---

## Implementation Plan

### Phase 1: Fix the Currency-to-Column Mapping

**File: `src/hooks/useRegionalPrice.ts`**

Replace the `CURRENCY_TO_PRICE_COLUMN` mapping with a version that only maps currencies to columns that genuinely store prices in that currency. Currencies without dedicated columns will map to `null`.

Supported direct mappings (these have real DB columns):
- USD --> `variant_price`
- CAD --> `price_cad`
- GBP --> `price_gbp`
- EUR --> `price_eur`
- AUD --> `price_aud`
- JPY --> `price_jpy`

For all other currencies (CNY, KRW, INR, CHF, SEK, NZD, PLN, CZK, MXN, BRL): map to `null`.

Update the Priority 1 logic so when `priceColumn` is `null`, it skips directly to the conversion path (Priority 3), which correctly uses database exchange rates.

### Phase 2: Add "Nearby Region Conversion" Path

For currencies that are geographically close to a supported region, add a new priority between Priority 1 and Priority 3:

- CHF, SEK, PLN, CZK: check `price_eur` first, then convert EUR to target currency using `RegionContext.convertPrice`
- NZD: check `price_aud` first, then convert AUD to NZD

This gives better accuracy than converting from USD, since EUR-region prices are often more accurate for European users. These will be marked as `priceSource: 'converted'` and show the `~` prefix.

### Phase 3: Fix Priority 4 Conversion

Replace the hardcoded rate calculation:
```
// BEFORE (stale hardcoded rates)
const sourceRate = CURRENCIES[fallback.cur]?.rate || 1;
const targetRate = CURRENCIES[currency]?.rate || 1;
const convertedPrice = (fallback.price / sourceRate) * targetRate;
```

With RegionContext's database-backed conversion:
```
// AFTER (live exchange rates)
const convertedPrice = convertFromCurrency(fallback.price, fallback.cur);
```

Also fix the metadata:
- Set `isActualRegionalPrice: false` (it IS converted)
- Set `priceSource: 'converted'` (so UI shows `~` prefix)

### Phase 4: Fix LabReadoutCard Guards

**File: `src/components/LabReadoutCard.tsx`**

- Destructure `isRatesLoading`, `priceSource`, and add `shouldFetchLivePrice` guard matching `FilamentCard`
- Use `priceSource === 'converted'` for the `isConverted` flag instead of just currency comparison
- Show loading skeleton when `isRatesLoading` is true (prevents flash of unconverted prices)

### Phase 5: Fix Finder Page Sorting

**File: `src/pages/Finder.tsx`**

The `currencyToPriceColumn` mapping in the sort function (line 1383-1390) has the same problem -- it only lists USD, CAD, GBP, EUR, AUD, JPY. For other currencies it falls back to `variant_price` (USD). Fix this to apply exchange rate conversion for unsupported currency columns, matching the hook logic.

### Phase 6: Add Data Validation View

Create a database view `v_suspect_regional_prices` that flags products where:
- All populated regional price columns have identical numeric values (copy-paste error)
- Regional prices that are implausibly close to variant_price for high-rate currencies (e.g., JPY value < 100 when variant_price is ~20)

This helps catch data quality issues going forward.

---

## Technical Details

### Files Modified
1. `src/hooks/useRegionalPrice.ts` -- Core fix for column mapping, conversion logic, and Priority 4
2. `src/components/LabReadoutCard.tsx` -- Add rate-loading guards and fix conversion detection
3. `src/pages/Finder.tsx` -- Fix sort-time price resolution for unsupported currencies
4. New migration SQL -- Create `v_suspect_regional_prices` validation view

### Expected Behavior After Fix

| Currency | Before (broken) | After (fixed) |
|----------|-----------------|---------------|
| CNY | ¥19.99 | ~¥138.90 (converted from $19.99 USD) |
| JPY | ~¥2,990 or ¥19.99 | ~¥3,105 (converted from $19.99 USD) |
| CHF | Fr22.99 | ~Fr16.92 (converted from EUR22.99) |
| SEK | 22.99 kr | ~169.87 kr (converted from EUR22.99) |
| NZD | NZ$34.99 | ~NZ$37.79 (converted from A$34.99) |
| EUR | EUR22.99 (unchanged) | EUR22.99 (actual regional price) |
| GBP | GBP19.99 (unchanged) | GBP19.99 (actual regional price) |

All converted prices will display the `~` prefix and show properly converted amounts using live exchange rates from the database.
