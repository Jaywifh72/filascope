

## Plan: Server-side brand filament grouping

### Summary
Replace ~300 lines of client-side product grouping logic in `BrandDetail.tsx` with a server-side RPC and a new hook. The RPC mirrors the existing `search_filaments_paginated` grouping pattern (using `product_line_id`), but is optimized for the brand detail page use case.

### Architecture

```text
Before:
  BrandDetail.tsx → SELECT * FROM filaments WHERE vendor ILIKE X
                  → client-side grouping (COLOR_WORDS, getBaseProductName, etc.)

After:
  BrandDetail.tsx → useBrandFilaments(brandSlug, region, material)
                  → RPC get_brand_filaments_grouped(p_brand_name, p_region, p_material)
                  → returns pre-grouped JSON with representative filament data
```

### Changes

#### 1. Migration: `get_brand_filaments_grouped` RPC

SQL function following the same CTE pattern as `search_filaments_paginated`:

- **`filtered`** CTE: selects from `filaments` where `vendor ILIKE p_brand_name`, optionally filtered by `p_material`, excludes small samples (`net_weight_g IS NULL OR net_weight_g >= 300`)
- **`grouped`** CTE: groups by `COALESCE(product_line_id, vendor || '::' || id::text)`, computes: variant_count, group_colors array, group_weights array, price_min/max, representative_id (first with image, then by score)
- **`final`** CTE: joins representative_id back to `filaments` to get full filament row data for each group representative
- Returns JSONB: `{ total, items: [ { group_key, product_line_id, base_name, material, variant_count, colors, weights, price_min, price_max, representative: { full filament object }, variant_ids: [...] } ] }`
- Orders by material ASC, then display_name/first_title ASC
- No pagination needed (brand pages show all products)

#### 2. New hook: `src/hooks/useBrandFilaments.ts`

- Calls `supabase.rpc('get_brand_filaments_grouped', { p_brand_name, p_region, p_material })`
- Transforms RPC response into `GroupedProduct[]` compatible with existing child components
- For the `variants` array: does a **second query** fetching full filament rows for variant IDs (needed by BrandProductsTab for color filtering). This query uses `.in('id', allVariantIds)` in batches.
- Alternatively, to avoid the second query: the RPC can return all variant data inline (array of filament objects per group). This is more data but eliminates the need for a second round-trip. **Preferred approach**: return variant arrays inline since brand pages typically have <500 total variants per brand.

#### 3. Simplify `BrandDetail.tsx`

**Remove** (~300 lines):
- `COLOR_WORDS` array (lines 170-222)
- `getBaseProductName()` function (lines 225-310)
- `getColorFromTitle()` function (lines 313-351)
- `getPrusamentProductLine()` function (lines 92-129)
- `deduplicateVariantsByColor()` function (lines 438-464)
- `groupedProducts` useMemo block (lines 467-574)
- The raw filaments query (lines 410-424) — replaced by the hook

**Keep**:
- `getCategoryUrl()` (generates external URLs, not DB-dependent)
- `availableMaterials` useMemo (derived from hook results)
- `brandPriceRange`, `topRetailers`, `regionsCovered` useMemos (derived from raw filaments, but can be adapted to use grouped data)
- All brand info queries, tab navigation, SEO, UI components
- `AdminFiberlogySync` component

**Replace**:
- `const { data: filaments, isLoading, ... } = useQuery(...)` → `const { groupedProducts, filaments, isLoading, ... } = useBrandFilaments(brandSlug, region, selectedMaterial)`

The hook will also expose `filaments` (flat array) so `BrandProductsTab`, `BrandFAQSection`, and other consumers that need variant-level data still work.

### Files

| File | Action |
|------|--------|
| New migration | Create `get_brand_filaments_grouped` RPC |
| `src/hooks/useBrandFilaments.ts` | New hook wrapping the RPC |
| `src/pages/BrandDetail.tsx` | Remove ~300 lines of grouping logic, use new hook |

### Not changed
- `BrandProductsTab.tsx`, `BrandOverviewTab.tsx` — same `GroupedProduct` interface, no changes needed
- `search_filaments_paginated` — untouched
- All admin components

