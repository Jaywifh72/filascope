
# Performance Optimization: Reduce Homepage Fetch Requests

## Problem Summary

The homepage currently makes ~86-128 fetch requests during initial load, transferring ~32MB of data. This is caused by five major issues, listed by impact.

## Root Cause Breakdown

```text
Source                        Requests    Data Size    Notes
--------------------------    --------    ---------    -----
Filament data (paginated)     7-8         ~28 MB       select * from 7,000+ rows
Brand filament counts (N+1)   ~48         ~50 KB       One COUNT(*) per brand
Live price scraping/card      ~16         ~100 KB      Edge function call per card
Deals count (paginated)       2-3         ~2 MB        Paginates entire table
Misc (auth, rates, etc.)      ~15         ~500 KB      Exchange rates, reviews, etc.
--------------------------    --------    ---------
TOTAL                         ~86-128     ~32 MB
```

## Optimization Plan (6 changes)

### Change 1: Only fetch columns needed for listing cards (BIGGEST WIN)

**Current**: `select("*")` fetches ALL ~120 columns per filament row, including TDS URLs, sync metadata, admin notes, scrape configs, etc. Most columns are null and never used on cards.

**Fix**: Replace `select("*")` with an explicit column list containing only the ~25 fields cards actually use:
- id, product_title, product_handle, vendor, material, color_hex, color_family, variant_price, variant_compare_at_price, net_weight_g, pack_quantity, featured_image, variant_available, product_line_id, finish_type, is_nozzle_abrasive, high_speed_capable, carbon_fiber_percentage, glass_fiber_percentage, wood_powder_percentage, product_url, product_url_ca/uk/eu/au/jp, price_cad/gbp/eur/aud/jpy, last_scraped_at, transmission_distance, nozzle_temp_min_c, nozzle_temp_max_c, bed_temp_min_c, bed_temp_max_c, tensile_strength_xy_mpa, density_g_cm3, ease_of_printing_score, strength_index, printability_index, value_score, amazon_price_usd

**Impact**: Each row drops from ~3.5KB to ~800 bytes. Total payload drops from ~28MB to ~6MB. Pagination still needed but each page transfers 4x less.

**Files**: `src/pages/Finder.tsx` (the main filaments query), `src/lib/supabaseHelpers.ts`

### Change 2: Eliminate the N+1 brand count query

**Current**: Lines 749-774 in `Finder.tsx` loop through ~48 brand names and fire a separate `SELECT count(*) FROM filaments WHERE vendor ILIKE brandName` for each one. This creates ~48 sequential requests.

**Fix**: Replace the loop with a single aggregate query:
```sql
SELECT vendor, count(*) as cnt 
FROM filaments 
WHERE vendor IN ('brand1', 'brand2', ...)
GROUP BY vendor
```
This uses a single `.in()` filter with `.select('vendor')` and client-side grouping, or better yet, a single RPC call.

**Impact**: 48 requests reduced to 1.

**Files**: `src/pages/Finder.tsx` (the `brand-filament-counts` query)

### Change 3: Disable live price scraping on listing cards

**Current**: `LabReadoutCard` calls `useCurrentPrice()` which invokes the `get-current-price` edge function for each visible card. With 16 cards visible, that's 16 edge function calls that each scrape an external website.

**Fix**: Remove the `useCurrentPrice` call from `LabReadoutCard`. The database already has `variant_price`, `price_cad`, etc. Live price scraping should only happen on the detail page where a single product is in view. The card should use `useResolvedPrice` (same as `FilamentCard`) for consistent, database-sourced pricing.

**Impact**: 16 edge function calls eliminated per page load. Also reduces external scraping load and improves card render time.

**Files**: `src/components/LabReadoutCard.tsx`

### Change 4: Replace deals count pagination with a single count query

**Current**: `useDealsCount` paginates through the entire filaments table to count deals client-side, fetching full rows across 2-3 paginated requests.

**Fix**: Replace with a single `SELECT count(*) FROM filaments WHERE variant_compare_at_price IS NOT NULL AND variant_price IS NOT NULL AND variant_compare_at_price > variant_price` using `.select('*', { count: 'exact', head: true })` with the appropriate filters. For the "unique products" count, use a lightweight RPC or accept the variant count for the hero badge.

**Impact**: 2-3 large requests reduced to 1 lightweight HEAD request.

**Files**: `src/hooks/useDealsCount.ts`

### Change 5: Cache exchange rates in localStorage with 1-hour TTL

**Current**: Exchange rates are fetched from the database on every page load via `RegionContext`.

**Fix**: Add a localStorage cache layer (similar to the hero stats cache already in `HeroSection.tsx`):
1. On fetch, store rates + timestamp in localStorage
2. On load, read from localStorage if < 1 hour old
3. Still fetch in background to keep fresh, but display cached rates immediately

This eliminates the blocking exchange rate fetch that delays price rendering.

**Impact**: Eliminates 1 blocking request on repeat visits. Prices render instantly from cache.

**Files**: `src/contexts/RegionContext.tsx`

### Change 6: Use `select("material")` for the materials filter query

**Current**: The materials query (line 578-706) fetches all material values to build the filter sidebar. It uses `select("material")` which is already good, but can be made a head-only distinct query.

**Fix**: This is already reasonably efficient. No change needed.

## Expected Results

```text
Metric                Before      After       Reduction
--------------------  ----------  ----------  ---------
Total fetch requests  86-128      ~12-15      ~85%
Total payload size    ~32 MB      ~6-7 MB     ~80%
Time to interactive   8-12s       2-4s        ~70%
```

## What stays the same

- Pagination approach for the main filament query (still needed for 7,000+ rows)
- 16 items per page with "Load More"
- All existing client-side filtering and sorting logic
- VirtualizedProductGrid thresholds
- React Query caching configuration
- Exchange rate refresh hooks for admin

## Implementation sequence

1. ✅ Change 2 (brand counts N+1) — replaced 48 queries with 1 single `.in()` query
2. ✅ Change 3 (remove live price scraping from cards) — removed `useCurrentPrice` from LabReadoutCard
3. ✅ Change 1 (slim column selection) — explicit ~40 column select instead of `select("*")`
4. ✅ Change 4 (deals count optimization) — single HEAD request with `count: 'exact'`
5. ✅ Change 5 (localStorage exchange rate cache) — 1-hour TTL with stale-while-revalidate
