
# Phase 4: Pricing Data Deduplication by product_line_id

## Overview

Deduplicate the `/admin/pricing-data` page by grouping filaments by `product_line_id` instead of showing every color variant as a separate row. This reduces display from ~8,380 rows to ~1,080 product groups (87% reduction) and eliminates redundant API calls during link testing and price syncing.

## Confirmed Data

- 8,380 filament rows → 1,080 unique product_line_ids
- 472 product groups have identical prices across all color variants
- 362 groups vary by weight/pack only, NOT by color
- product_line_id has 100% coverage
- All color variants share the same base product URL per weight tier

---

## 1. Grouped Data Query

Replace the per-variant fetch with a grouped query:

- GROUP BY `product_line_id`
- Select one `representative_id` (MIN(id)) per group
- Strip color suffixes from product name via regex
- Strip `?variant=` / `?id=` params from URL to get base URL
- Aggregate: `COUNT(*)` as variant_count, `COUNT(DISTINCT color_hex)` as color_count
- Price: `MIN(variant_price)`, `MAX(variant_price)`, `has_price_range` boolean
- Regional URLs: `MIN(product_url_ca)`, `MIN(product_url_uk)`, etc.
- Collect `array_agg(id)` for fan-out updates

## 2. Table Layout

Each row = one product (grouped by product_line_id):

**Columns:**
- Checkbox (bulk selection)
- Product: Clean name without color suffix
- Brand
- Material
- Variants: Badge "15 colors"
- Price: "$19.99" or "$19.99 – $29.99" if range
- Status: Link health
- Last Checked
- Actions: Test / Sync / View

**Expandable row shows:**
- Regional store rows (one per region with flag, price, currency, status)
- Color swatches
- Price breakdown if variants differ by weight tier

## 3. Link Testing Deduplication

When testing a product's link:
1. Strip variant params (`?id=`, `?variant=`, `?sku=`) from URL
2. Make ONE request to base URL per region
3. Apply result to ALL filament rows sharing that `product_line_id`
4. Toast: "Tested 1 URL → updated 15 variants"

```typescript
// Fan-out update
await supabase
  .from('filaments')
  .update({ link_status: result.status, last_link_check: now })
  .eq('product_line_id', productLineId)
```

## 4. Price Sync Deduplication

When syncing a product's price:
1. Fetch product page ONCE per region
2. If all variants same price → update all rows
3. If prices vary (weight tiers) → extract from JSON-LD, update each accordingly
4. Toast: "Synced 1 page → updated 15 variants"

## 5. Bulk Operations

All bulk ops work on deduplicated product_line_ids:
- "Test All Stale": ~1,080 products, not 8,380 variants
- Progress: "Testing 50/1,080 products (covering 8,380 variants)"
- Batch size of 2 to respect rate limits

## 6. Stats Dashboard

Update stat cards:
- "1,080 Products (8,380 variants)"
- Active/Stale/Broken counts by unique product_line_id
- Sync time estimate based on deduplicated count

## 7. Filters

- Brand, Status, Search all work on grouped products
- Optional "Show individual variants" toggle (OFF by default)

---

## Technical Details

### Files Modified

1. **`src/pages/admin/PricingData.tsx`** — All changes:
   - Replace per-variant query with grouped query
   - New `ProductGroup` type with variant_count, all_ids, price range
   - Update table rendering to show grouped rows
   - Expandable row detail with regional stores + color swatches
   - Fan-out logic for test/sync results
   - Updated stats cards
   - Updated bulk operation counts

### No New Edge Functions

Existing `get-current-price` and `test-url` handle the actual requests. Only the frontend query and fan-out logic changes.

### No Database Schema Changes

- `product_line_id` already exists with 100% coverage
- All variant rows preserved in `filaments` table
- Frontend site unaffected

### Performance Impact

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Rows rendered | 8,380 | 1,080 | 87% |
| Link tests (5 regions) | 41,900 | 5,400 | 87% |
| Price syncs | 8,380 | 1,080 | 87% |
| Page load | Slow | Fast | Significant |

---

## Deferred

- Per-row expandable price history chart
- "Show individual variants" toggle view
- Mixed availability badge ("12/15 in stock")
