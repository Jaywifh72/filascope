

# Fix: Bambu Lab Variant Selection Picks Wrong Size

## Root Cause

The `scoreVariant()` function in `price-extract-bambulab.ts` (line 64-77) awards bonus points for "1kg" (+10) and "refill" (+15), causing it to always select the **largest/most expensive variant**. For specialty filaments that have multiple sizes (0.5kg and 1kg), this picks the 1kg price instead of the standard consumer size.

**Evidence:**
- PA6-CF page says "From $42.99 USD" (0.5kg) but extractor returns $79.99 (1kg)
- The page offers two sizes: "0.5kg" and "1kg"
- The scoring: 1kg variant scores ~40 (InStock+1kg+price>0) vs 0.5kg scores ~25 (InStock+price>0)

## Affected Products (10 filaments with sub-1kg standard weight)

| Product | DB Weight | Current Price | Likely Correct |
|---------|-----------|---------------|----------------|
| PA6-CF | 500g | $79.99 | ~$42.99 |
| PAHT-CF | 500g | $94.99 | ~$49.99 |
| PET-CF | 500g | $84.99 | ~$44.99 |
| PPA-CF | 750g | $149.99 | needs verification |
| PPS-CF | 750g | $129.99 | needs verification |
| PVA | 500g | $39.99 | needs verification |
| Support for ABS | 500g | $14.99 | likely correct (may only have one size) |
| Support for PA/PET | 500g | $39.99 | needs verification |
| Support for PLA (New Version) | 500g | $22.99 | needs verification |
| Support for PLA/PETG | 500g | $34.99 | needs verification |

## The Fix

### Change 1: Use `targetWeightGrams` in variant scoring (price-extract-bambulab.ts)

The `extractBambuLabPrice` function already receives `targetWeightGrams` but ignores it (parameter named `_targetWeightGrams`). The fix:

1. **Rename** `_targetWeightGrams` to `targetWeightGrams` and pass it to `extractPriceFromJsonLd`
2. **Add weight-aware scoring** to `scoreVariant`: if `targetWeightGrams` is provided, give a large bonus (+50) to variants whose name contains a matching weight (e.g., "0.5kg" matches 500g target)
3. **Fallback behavior** (no targetWeight): pick the **cheapest in-stock variant** instead of the most-scored one. This matches the "From $X" price shown on the product page, which is the most natural comparison price.

### Change 2: Pass `net_weight_g` from the database during syncs

The `get-current-price-v2` router already receives and passes `targetWeightGrams`. The calling code (frontend `priceEndpointRouter`, manual refresh buttons) needs to pass the filament's `net_weight_g` value. This is already happening via the `targetWeightGrams` body parameter -- the sync system sends it.

No changes needed in the router.

### Technical Implementation in `price-extract-bambulab.ts`

**`scoreVariant` modification:** Add a `targetWeightGrams` parameter. When provided, variants matching the target weight get +50 bonus. Parse weight from variant name using patterns like "0.5kg", "500g", "1kg", "750g".

**`extractPriceFromJsonLd` modification:** Accept optional `targetWeightGrams`. When no target weight is given, sort candidates by price ascending (cheapest first) among in-stock variants, instead of by score descending.

**`extractBambuLabPrice` signature:** Change `_targetWeightGrams` to `targetWeightGrams` and thread it through to `extractPriceFromJsonLd`.

### Data Correction

After deploying the fix, a price re-sync for all Bambu Lab filaments will automatically correct the stored prices across all regions, since the extractor will now select the correct variant.

