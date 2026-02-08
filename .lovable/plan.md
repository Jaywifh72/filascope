

# Fix Brand Data Inconsistency: Counts and Pricing

## Problem Summary

After investigating the database and component code, three root causes were identified:

### Bug 1: Brand Card Counts Can Drift from Reality
The `/brands` directory uses pre-stored `product_count` and `product_line_count` columns from the `automated_brands` table (exposed via `v_public_brands` view). These are static values that must be manually updated whenever products are added or removed. Currently they happen to match (e.g., Spectrum: 623 variants, 68 product lines), but they have drifted in the past (the "307" the user saw) and will drift again.

Meanwhile, the brand detail page computes counts live from the `filaments` table (`filaments.length` for variants, `groupedProducts.length` for product lines). This guarantees accuracy on the detail page but creates a mismatch with the directory whenever the stored values are stale.

### Bug 2: Brands Page Total Product Count
The brands hero section displays `totalProducts` from the `get_catalog_counts()` RPC, which counts ALL filaments in the catalog (1,073 product lines / 8,069 variants). This is the same source the homepage uses, so they should agree. The "147" figure the user observed was likely from a prior state. No code change is needed for this, but we should ensure the label language is consistent (both pages should say "products" meaning product lines, not variants).

### Bug 3: Average Price Shows "---" Despite Pricing Data Existing
The brand detail page computes `avgPriceRange` exclusively from `filaments.variant_price`. For brands like Spectrum Filaments, `variant_price` is NULL across all 623 rows, so the hero shows "---". However, some brands may have pricing data in regional price columns (`price_cad`, `price_eur`, `price_gbp`, `price_aud`, `price_jpy`) even when `variant_price` is empty. The calculation should cascade through these sources.

---

## Implementation Plan

### Step 1: Replace Static Counts with Live-Computed Counts

Create a database view that joins `automated_brands` with live filament counts, eliminating the staleness problem entirely.

**Database migration -- new view `v_brand_directory`:**
- Join `automated_brands` (for display_name, logo_url, slug, etc.) with a live aggregation from `filaments` (counting rows and distinct product_line_id values per vendor)
- Include the `net_weight_g IS NULL OR net_weight_g >= 300` filter to exclude sample spools (matching both pages)
- This replaces the static `product_count` / `product_line_count` columns as the source of truth for the directory

**Changes to `src/pages/Brands.tsx`:**
- Replace the `v_public_brands` query with the new `v_brand_directory` view
- Use the live `variant_count` and `product_line_count` from the view instead of the stored values
- Remove the separate filaments stats query (the view already provides counts, top materials can be kept as a lightweight client query or added to the view)

### Step 2: Ensure Both Pages Use the Same Count Logic

**`src/pages/BrandDetail.tsx`** (line 358-372):
- The detail page fetches filaments with `.or("net_weight_g.is.null,net_weight_g.gte.300")` -- this matches the filter used by the directory
- No changes needed here, but we verify the grouping logic produces numbers consistent with the view
- Pass `filaments.length` as `variantCount` and `groupedProducts.length` as `productLineCount` (already correct)

**`src/components/brands/BrandCard.tsx`:**
- The card already receives and displays `productLineCount` and `variantCount` correctly
- Format: `"{productLineCount} products ({variantCount} variants)"`
- No changes needed

### Step 3: Fix Average Price Calculation with Multi-Source Fallback

**Changes to `src/pages/BrandDetail.tsx`** (lines 595-608):

Replace the current `avgPriceRange` calculation that only checks `variant_price` with a cascading resolution:

1. First try `variant_price` (the primary USD spool price)
2. If fewer than 10% of products have `variant_price`, fall back to regional price columns (`price_cad`, `price_eur`, `price_gbp`, `price_aud`) using the user's region preference
3. If still no prices found, display "---" (genuinely no data)

This requires the filaments query to already include regional price columns, which it does since it fetches `SELECT *`.

The price range calculation will also be updated to use the region-aware `formatPrice()` from `useRegion()` (already imported) so the displayed range uses the user's local currency.

### Step 4: Align Terminology Across Pages

**`src/components/BrandsHeroSection.tsx`** (line 129-133):
- Currently shows: "{brandCount} filament brands tracked with {productCount} products ({variantCount} variants)"
- `productCount` comes from `get_catalog_counts()` = unique product lines (1,073)
- This is correct and matches the homepage

**`src/pages/Brands.tsx` footer** (lines 509-528):
- Line 512 shows `brands?.length` as "Total Brands" -- this is the count from the filaments stats query (unique vendor names), which may differ from `mergedBrands.length`
- Change to use `brandCount` (mergedBrands.length) for consistency
- Line 516 shows `totalProducts` as "Total Filaments" -- but `totalProducts` is product line count, not filament/variant count. Fix label to "Product Lines" or change to show `totalVariants`

---

## Technical Details

### New Database View

```sql
CREATE OR REPLACE VIEW v_brand_directory AS
SELECT
  ab.id,
  ab.brand_name,
  ab.brand_slug,
  ab.display_name,
  ab.description,
  ab.logo_url,
  ab.website_url,
  ab.featured,
  ab.display_order,
  ab.is_visible,
  COALESCE(stats.variant_count, 0) AS variant_count,
  COALESCE(stats.product_line_count, 0) AS product_line_count
FROM automated_brands ab
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS variant_count,
    COUNT(DISTINCT product_line_id) AS product_line_count
  FROM filaments f
  WHERE (LOWER(f.vendor) = LOWER(ab.brand_name) 
         OR LOWER(f.vendor) = LOWER(ab.display_name))
    AND (f.net_weight_g IS NULL OR f.net_weight_g >= 300)
) stats ON true
WHERE ab.is_visible = true;
```

### Files Modified

| File | Change |
|------|--------|
| `supabase/migrations/..._v_brand_directory.sql` | New view for live brand counts |
| `src/pages/Brands.tsx` | Use `v_brand_directory` view; fix footer labels |
| `src/pages/BrandDetail.tsx` | Multi-source avgPriceRange fallback |
| `src/components/BrandsHeroSection.tsx` | Minor: no structural changes needed |

### Expected Outcomes

1. Brand cards on `/brands` show the same product/variant counts as brand detail pages -- always in sync because both derive from the same `filaments` table
2. The brands page hero total matches the homepage because both use `get_catalog_counts()` RPC
3. Average price displays real values for brands that have pricing data in any column, and "---" only for brands with genuinely no pricing data
4. Footer stats use consistent terminology matching the hero section

