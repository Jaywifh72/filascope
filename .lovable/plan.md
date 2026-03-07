

## Cross-Region Deduplication for Brand Sync Pipeline

### Problem
When `sync-brand-products` processes products from different regional stores (US, CA, UK, EU, etc.), the same filament can get inserted as separate rows if the `product_id` differs across regions. This creates duplicates.

### Implementation

**File 1: `supabase/functions/_shared/cross-region-dedup.ts`** (new)

Export `findCrossRegionMatch(supabase, brandId, productTitle, material, colorHex, vendor)`:
- Query `filaments` matching on `brand_id` + `material` + (`color_hex = colorHex` OR `product_title ILIKE productTitle`)
- If exactly 1 match → return its ID
- If multiple → pick the one with most regional prices filled (count non-null among `variant_price`, `price_cad`, `price_eur`, `price_gbp`, `price_aud`, `price_jpy`) as a quality proxy
- If none → return null

**File 2: `supabase/functions/sync-brand-products/index.ts`** (edit ~line 621)

In the `else` branch (no existing product found by `product_id`), before the INSERT block:
- Call `findCrossRegionMatch()` with the product's brand_id, title, material, colorHex, vendor
- If match found: treat as UPDATE (use existing update logic with `getRegionalFieldMapping` to merge the new region's price/URL), log the cross-region match, append region to `cross_region_source` array, increment `summary.updated`
- If no match: proceed with existing INSERT as-is, setting `cross_region_source` to `[productRegion]`

**File 3: Database migration** (new)

```sql
ALTER TABLE public.filaments 
ADD COLUMN IF NOT EXISTS cross_region_source text[] DEFAULT NULL;
```

### What stays unchanged
- Existing `product_id` matching (line 591-596) — still the primary dedup
- Existing INSERT logic for genuinely new products
- All RLS policies
- The `buildUpdateData` helper function logic

