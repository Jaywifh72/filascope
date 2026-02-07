
# Fix Data Inconsistency Between Brands Directory and Brand Detail Pages

## Bug Analysis

### Bug 1: Brand Card Shows Different Count Than Brand Detail Page

**Root Cause:** The brand card on `/brands` shows raw **variant count** (every individual filament row), while the brand detail page shows **unique product line count** (grouped by `product_line_id`).

- Brands page query (`Brands.tsx` line 130): Counts every filament row per vendor. For Spectrum Filaments, this gives 623.
- Brand detail page (`BrandDetail.tsx` line 578): Shows `groupedProducts.length` which groups by `product_line_id`, giving 68 product lines.
- The brand card label says "X filaments" but the detail page says "68 (623 variants)".

**The Fix:** Make the brand card show the same "X products (Y variants)" format as the detail page. This requires computing the product line count per brand on the Brands directory page.

Two approaches:
- **Option A (Preferred):** Fetch product line counts per vendor from the database in a single query. This avoids client-side grouping logic and is consistent with how the detail page works.
- **Option B:** Use the existing `automated_brands.product_count` column -- but this currently stores variant count, not product line count. It would require updating the `update_brand_product_counts()` DB function to also compute a `product_line_count`.

I recommend a hybrid: add a `product_line_count` column to `automated_brands` (and update the `update_brand_product_counts()` function), then expose it via `v_public_brands`. On the Brands page, use this column for the card count, with `product_count` as the variant count for the "(X variants)" display.

### Bug 2: Brands Page Shows "147 Products" While Homepage Shows "962+ Products"

**Root Cause:** The `catalogCounts` query in `Brands.tsx` (lines 195-202) fetches `product_line_id` values to count unique product lines but **hits the Supabase 1000-row default limit**. It fetches only 1000 rows, then deduplicates them client-side to ~147 unique values. The actual number of unique product lines is 1,073.

```text
Brands page:   SELECT product_line_id FROM filaments WHERE product_line_id IS NOT NULL
               --> Gets 1000 rows (capped) --> Set.size = ~147 (wrong!)

Homepage:      Groups all filaments client-side after paginated fetch --> 962 groups (correct)
```

**The Fix:** Replace the client-side deduplication with a server-side count. Use `count: 'exact'` with `head: true` for the overall count, or use a simple aggregate query. Since all filaments now have `product_line_id` assigned (`noLineCount = 0`), we can use:

```sql
SELECT COUNT(DISTINCT product_line_id) FROM filaments
```

This can't be done directly via the Supabase JS client's `select` method for `COUNT(DISTINCT ...)`, so we either:
1. Fetch ALL product_line_id values by paginating (similar to `fetchAllFilaments`), or
2. Use the `automated_brands` product_line_count column (once we add it in Bug 1 fix) and sum across all brands, or
3. Add a simple RPC function that returns the count.

I recommend option 3 -- a lightweight RPC function `get_catalog_counts()` that returns both `product_count` (unique product lines) and `variant_count` (total rows) in one call, eliminating the 1000-row limit problem entirely.

### Bug 3: Brand Detail Pages Show "Avg Price: --" Even When Pricing Data Exists

**Root Cause Investigation:** After checking the database, brands without `variant_price` data (Spectrum Filaments, NinjaTek, VoxelPLA) also have zero rows in `filament_listings` and `filament_prices`. The "Avg Price: --" is **actually correct** for these brands -- they genuinely have no pricing data.

However, the current avg price calculation only looks at `variant_price` on the filaments table. For brands that have pricing in the `filament_prices` (store pricing) table but not in `variant_price`, it would still show "--". Additionally, the label "Avg Price" with a min-max range like "$11-$169" is misleading -- it shows a range, not an average.

**The Fix:** Expand the price aggregation to also check `filament_listings` and `filament_prices` tables for brands where `variant_price` is null. Also rename the label from "Avg Price" to "Price Range" since it shows min-max, not an average.

---

## Implementation Plan

### Step 1: Database Migration -- Add Product Line Count Column and RPC

Add a `product_line_count` column to `automated_brands`, update the `update_brand_product_counts()` function to populate it, add a `get_catalog_counts()` RPC, and update the `v_public_brands` view.

```sql
-- Add product_line_count column
ALTER TABLE automated_brands 
  ADD COLUMN IF NOT EXISTS product_line_count integer DEFAULT 0;

-- Update the count function to also compute product line count
CREATE OR REPLACE FUNCTION update_brand_product_counts(p_brand_slug text DEFAULT NULL)
  -- ... (updated to include product_line_count via COUNT(DISTINCT product_line_id))

-- Add catalog-wide counts RPC
CREATE OR REPLACE FUNCTION get_catalog_counts()
  RETURNS TABLE(product_count bigint, variant_count bigint)
  -- Uses COUNT(DISTINCT product_line_id) + nulls for products, COUNT(*) for variants

-- Update v_public_brands view to include product_line_count
```

Run `update_brand_product_counts(NULL)` to backfill all brands.

### Step 2: Update Brand Card Display (`BrandCard.tsx`)

- Change the `count` prop to accept both `productLineCount` and `variantCount`
- Display: "68 products (623 variants)" instead of "623 filaments"
- If `productLineCount` equals `variantCount`, just show "68 products"

### Step 3: Update Brands Page Data Flow (`Brands.tsx`)

- Replace the buggy `catalogCounts` query with the new `get_catalog_counts()` RPC call
- In the `mergedBrands` logic, use `product_line_count` from `v_public_brands` for the product count, and `product_count` for the variant count
- Pass both values to `BrandCard`
- Update BrandsHeroSection text to show consistent numbers

### Step 4: Update Brand Detail Hero (`BrandHeroSection.tsx`)

- Rename "Avg Price" label to "Price Range"
- No count changes needed -- the detail page already correctly shows "68 (623 variants)"

### Step 5: Expand Average Price Calculation (`BrandDetail.tsx`)

- Keep the existing `variant_price` aggregation as primary
- Add a fallback that checks `filament_listings.current_price` if no `variant_price` data exists
- Add a second fallback to `filament_prices.price_cents` if neither has data
- This ensures brands with pricing in any table show a price range

## Files to Create/Modify

| File | Action | Purpose |
|---|---|---|
| Database migration | CREATE | Add `product_line_count` column, `get_catalog_counts()` RPC, update view |
| `src/components/brands/BrandCard.tsx` | MODIFY | Show "X products (Y variants)" format |
| `src/pages/Brands.tsx` | MODIFY | Use RPC for catalog counts, pass product_line_count to cards |
| `src/components/brands/BrandHeroSection.tsx` | MODIFY | Rename "Avg Price" to "Price Range" |
| `src/pages/BrandDetail.tsx` | MODIFY | Expand price aggregation with fallbacks |
| `src/components/BrandsHeroSection.tsx` | MINOR | No changes needed -- already receives correct props |

## Validation Criteria

1. Spectrum Filaments card shows "68 products (623 variants)" matching the detail page
2. Brands page hero shows ~1,073 products (matching the real count), not 147
3. Homepage "962+ products" and Brands page product count are in the same ballpark (difference due to homepage applying filters like net_weight_g >= 300)
4. Brands with pricing data show a price range; brands without show "--"
5. The "Avg Price" label is renamed to "Price Range" for clarity
