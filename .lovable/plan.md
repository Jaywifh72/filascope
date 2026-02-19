
## Root Cause Analysis

The bad data in the database is confirmed:

| Product | Current Price | Compare-At Price | Discount |
|---|---|---|---|
| Bambu Lab PETG HF | $19.99 | **$3,400** | 99.4% |
| Kingroon HS-PETG | $14.99 | **$149** | 89.9% |
| Creality Hyper ABS | $17.99 | **$107.94** | 83.3% |

The `$3,400` compare-at for Bambu PETG HF is almost certainly a JPY price (¥3,400) that was incorrectly written to the USD `variant_compare_at_price` column. When the user is in Canada, `RegionalPricePair` converts it: $3,400 USD × ~1.367 = CA$4,648 — exactly the reported figure.

**No double-conversion is happening** — the pipeline is working correctly; the source data itself is corrupted.

## What Will NOT Be Changed

- `variant_price` (current/sale prices) — these are correct
- `RegionalPricePair` conversion logic — working correctly
- Any DB schema or existing data directly (data corruption stays in DB but is filtered client-side)

## Changes

### 1. `src/hooks/useDealsWithFilters.ts` — Add sanity filter in processing step

After the existing `onSaleItems` filter (line 101-106), add a `sanitizedDeals` filter that excludes bad data:

```ts
// Sanity check: exclude bad compare_at_price data
// - compare_at_price > $200 USD for a single spool = almost certainly bad data
//   (highest legitimate MSRP for a 1kg spool is ~$150; $200 gives headroom)
// - discount > 75%: statistically implausible for commodity filament sales
// - discount < 5%: too small to surface as a "deal"
const sanitizedDeals = onSaleItems.filter((item) => {
  const cap = item.variant_compare_at_price!;
  const cur = item.variant_price!;
  const discountPct = ((cap - cur) / cap) * 100;
  // Reject: implausibly high compare_at for a single spool
  if (cap > 200) return false;
  // Reject: discount outside the 5%-75% credible window
  if (discountPct > 75 || discountPct < 5) return false;
  return true;
});
```

Then replace `onSaleItems.map(...)` with `sanitizedDeals.map(...)`.

### 2. `src/hooks/useDealsCount.ts` — Apply matching filters so count stays consistent

Add the same `lte("variant_compare_at_price", 200)` guard so the count badge doesn't show phantom deals:

```ts
.lte("variant_compare_at_price", 200)
```

Also note: The count hook doesn't filter by discount range (it can't compute that server-side without RPC), but the 200 cap removes the most egregious outliers.

## Why $200 cap is safe

The highest legitimate 1kg PLA/PETG MSRP in the dataset (from the DB query results) is around $115–$150 for premium brands (e.g., 3D-Fuel Pro PCTG at $115.95 per 4kg = legitimate). Setting the cap at $200 keeps all real discounts while rejecting the $3,400 and $149 bad values. Kingroon HS-PETG at $149 compare-at with $14.99 sale = 89.9% which would also be caught by the >75% discount rule.

## Impact

| Product | Before | After |
|---|---|---|
| Bambu Lab PETG HF ($3400 cap) | Shown as 99% off | Hidden (bad data) |
| Kingroon HS-PETG ($149 cap) | Shown as 89% off | Hidden (>75% rule) |
| Creality ABS ($107.94 cap) | Shown as 83% off | Hidden (>75% rule) |
| 3D-Fuel Pro PCTG ($115.95 cap, 74.2% off) | Shown | Still shown (within bounds) |
| All legitimate 5–75% deals | Shown | Still shown, unchanged |

## Technical Notes

- The `DealCard` component receives pre-computed `discount` from `useDealsWithFilters` and passes raw USD amounts to `RegionalPricePair` — no changes needed to either component
- The `RegionalPrice`/`RegionalPricePair` components are correct; they convert once from `sourceCurrency="USD"` to the user's currency
- `useDealsCount` uses a server-side count query that cannot compute discount percentages, so only the `lte(200)` cap is applied there; the total shown in the header will be slightly higher than the actual rendered count (acceptable trade-off vs. fetching all rows for count)
