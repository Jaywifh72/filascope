

## Plan: Add CN (China) Region Support

### Step 1: Database Migration
Create a single migration adding 4 columns:
- `filaments.price_cny` (numeric, NULL)
- `filaments.product_url_cn` (text, NULL)
- `brand_sync_items.price_cny` (numeric, NULL)
- `brand_sync_items.product_url_cn` (text, NULL)

All use `ADD COLUMN IF NOT EXISTS`. No drops, no RLS changes.

### Step 2: Update `supabase/functions/import-synced-filaments/index.ts`
Four targeted insertions following the existing JP pattern:

1. **Line ~170** (priceUpdate block): Add `if (merged.price_cny != null) priceUpdate.price_cny = merged.price_cny;`
2. **Line ~220** (INSERT object): Add `price_cny: merged.price_cny,` and `product_url_cn: merged.product_url_cn,`
3. **Line ~279** (regionMap): Add `{ field: "price_cny", altField: "price_cny", region: "CN" },`
4. **Line ~319** (urlFields): Add `"product_url_cn"` to the array

No other logic changes.

### Step 3: Region Config — Already Done
`src/config/regions.ts` already has CN entry. `src/types/regional.ts` already includes CN in `RegionCode` union and `REGION_CONFIGS`. `src/config/currencies.ts` already has CNY. No changes needed here.

### Files to edit
1. New migration SQL file (1 file created)
2. `supabase/functions/import-synced-filaments/index.ts` (4 line-level edits)
3. `src/integrations/supabase/types.ts` (auto-updated after migration)

