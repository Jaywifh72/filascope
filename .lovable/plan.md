

# Finder Page Performance Optimization

## Problem Summary

The Finder page (homepage) currently fetches **all 8,001 filament rows** from the database before rendering anything. This requires **9 sequential paginated API calls** (1000 rows each), followed by heavy client-side processing:

1. **Regional filtering** -- iterates all 8,001 rows
2. **Filter counts** -- iterates all rows multiple times per filter category
3. **Client-side filtering** -- 20+ filter predicates on every row
4. **Unified score calculation** -- computed per-filament during sort (expensive math)
5. **Brand diversity interleaving** -- another full pass
6. **Product grouping** -- groups ~8,001 variants into ~1,048 product lines

Users see a loading spinner with "Loading 500 of 8000 products..." for several seconds before any cards appear.

## Root Cause Analysis

```text
  [User opens homepage]
         |
         v
  [Query 1: fetch rows 0-999]       ~200ms
  [Query 2: fetch rows 1000-1999]   ~200ms
  [Query 3: fetch rows 2000-2999]   ~200ms
  ... (9 total queries)             ~1.8s total network
         |
         v
  [Regional filter: 8001 items]     ~50ms
  [Filter counts: 8001 x N]         ~200ms
  [Client filter + sort: 8001]      ~300ms (score calc on each)
  [Group by product: 8001 -> 1048]  ~100ms
  [Render 16 cards]                 ~50ms
         |
         v
  [First meaningful paint]          ~2.5-3s total
```

The fundamental issue: we fetch and process **100% of the catalog** to display **16 cards**.

## Optimization Plan

### Phase 1: Pre-Compute FilaScope Score in Database (High Impact)

Currently, `calculateUnifiedScore()` runs on every filament during every sort operation. Since the score inputs only change when product data is updated (not on every page load), we can pre-compute it.

**Changes:**
- Add a `filascope_score NUMERIC(3,1)` column to the `filaments` table
- Create a Postgres trigger function that recalculates the score on INSERT/UPDATE of relevant fields
- Backfill all existing rows with a one-time migration
- Update `Finder.tsx` sorting to use the database column instead of calling `calculateUnifiedScore()` per item
- Keep the client-side `calculateUnifiedScore()` for detail pages, tooltips, and hover cards where factor breakdowns are needed

**Impact:** Eliminates ~8,000 score calculations per page load, and enables server-side sorting.

### Phase 2: Server-Side Paginated Query with Filtering (Critical Path)

Replace `fetchAllFilaments()` with a single, targeted database query that returns only the page of results needed.

**New Postgres Function: `search_filaments_paginated`**

```sql
CREATE FUNCTION search_filaments_paginated(
  p_region TEXT DEFAULT 'US',
  p_materials TEXT[] DEFAULT NULL,
  p_brands TEXT[] DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_sort TEXT DEFAULT 'scoring-desc',
  p_page_size INT DEFAULT 48,
  p_offset INT DEFAULT 0,
  -- Boolean filters
  p_high_speed BOOLEAN DEFAULT FALSE,
  p_brass_only BOOLEAN DEFAULT FALSE,
  p_ams_only BOOLEAN DEFAULT FALSE,
  p_carbon_fiber BOOLEAN DEFAULT FALSE,
  p_glass_fiber BOOLEAN DEFAULT FALSE,
  p_wood_filled BOOLEAN DEFAULT FALSE,
  p_has_td BOOLEAN DEFAULT FALSE,
  -- Price range
  p_price_min NUMERIC DEFAULT NULL,
  p_price_max NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  -- return grouped product data
  product_line_id TEXT,
  representative_id UUID,
  variant_count INT,
  total_count BIGINT,  -- total matching rows for pagination
  ...columns needed for cards
)
```

This function will:
- Apply all filters in SQL (material, brand, search, boolean flags)
- Handle regional filtering server-side (checking product_url fields)
- Sort by pre-computed `filascope_score` or price
- GROUP BY `product_line_id` to return product-level results (not individual variants)
- Return only the requested page (48 items) plus a total count
- Use a `LATERAL` subquery to pick representative filaments per group

**Impact:** Reduces data transfer from ~8,001 rows to ~48 rows. Eliminates 9 sequential API calls.

### Phase 3: Separate Count Query for Filter Facets

Instead of computing filter counts client-side by iterating all 8,001 items, create a lightweight RPC function:

**New Postgres Function: `get_filter_counts`**

```sql
CREATE FUNCTION get_filter_counts(
  p_region TEXT DEFAULT 'US',
  p_materials TEXT[] DEFAULT NULL,
  p_brands TEXT[] DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS JSONB
```

This returns a JSON object with counts for each filter option (material counts, brand counts, finish type counts, etc.). It runs as a separate query that can be cached aggressively (5-minute staleTime).

**Impact:** Removes the expensive `filterCounts` useMemo that iterates all rows multiple times.

### Phase 4: Move Product Grouping to Database View

Since all 8,014 filaments have `product_line_id`, create a materialized view or indexed view:

**New View: `v_product_lines_summary`**

```sql
CREATE MATERIALIZED VIEW v_product_lines_summary AS
SELECT
  product_line_id,
  vendor,
  material,
  array_agg(DISTINCT color_hex) FILTER (WHERE color_hex IS NOT NULL) as colors,
  array_agg(DISTINCT net_weight_g) FILTER (WHERE net_weight_g IS NOT NULL) as weights,
  count(*) as variant_count,
  min(variant_price) as price_min,
  max(variant_price) as price_max,
  bool_or(variant_available) as any_in_stock,
  max(filascope_score) as best_score
FROM filaments
WHERE material IS NOT NULL
GROUP BY product_line_id, vendor, material;
```

This pre-groups the ~8,001 variants into ~1,048 product lines, eliminating `groupFilamentsByProduct()` on every render.

**Impact:** Eliminates client-side grouping entirely.

### Phase 5: Frontend Refactoring

**Finder.tsx Changes:**
- Replace the monolithic `useQuery` that fetches all filaments with a paginated `useQuery` calling `search_filaments_paginated`
- Replace the `filterCounts` useMemo with a separate `useQuery` calling `get_filter_counts`
- Replace the `groupFilamentsByProduct` call with data already grouped by the database
- Replace `displayCount` state + "Load More" with infinite scroll or cursor-based pagination
- Remove `fetchAllFilaments` import and the progress callback infrastructure
- Remove client-side `calculateUnifiedScore()` from sorting (use DB column)
- Keep `calculateUnifiedScore()` only in hover cards and detail pages

**Remove/simplify these heavy client-side operations:**
- `filteredAndSortedFilaments` useMemo (~200 lines of filter/sort logic) -- replaced by SQL
- `diversifiedFilaments` useMemo (brand interleaving) -- move to SQL with `ROW_NUMBER() OVER (PARTITION BY vendor)`
- `groupedFilaments` useMemo -- pre-grouped in DB
- `filterCounts` useMemo (~175 lines) -- replaced by `get_filter_counts` RPC
- `regionalFilaments` useMemo -- regional check moved to SQL

**Hook Refactoring:**
- Create a new `useFinderQuery` hook that encapsulates the paginated query, filter state, and pagination logic
- This hook manages `page`, `filters`, `sort`, and returns `{ products, totalCount, filterCounts, isLoading, loadMore }`

### Phase 6: Instant Skeleton Rendering

While the first page of results loads (now a single ~100ms query):
- Show skeleton cards immediately (already implemented as `FilamentCardSkeletonGrid`)
- Remove the `LoadingProgress` component with its "Loading 500 of 8000" counter (no longer needed since we only fetch one page)
- Use React Query's `placeholderData` to keep previous results visible during filter changes

## Expected Performance After Optimization

```text
  [User opens homepage]
         |
         v
  [Skeleton cards render]            ~0ms (instant)
  [Single DB query: 48 results]      ~80-120ms
  [Render 48 cards]                   ~30ms
         |
         v
  [First meaningful paint]           ~150ms (vs ~2.5-3s before)
  
  [Filter counts query (parallel)]   ~100ms (background)
```

## Technical Details

### Migration SQL Summary

1. `ALTER TABLE filaments ADD COLUMN filascope_score NUMERIC(3,1);`
2. Create trigger function to compute score on data change
3. Backfill existing rows
4. Create `search_filaments_paginated` RPC function
5. Create `get_filter_counts` RPC function
6. Create `v_product_lines_summary` materialized view
7. Add indexes: `CREATE INDEX idx_filaments_score ON filaments(filascope_score DESC NULLS LAST);`

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/xxx.sql` | Create | Database functions, column, view, indexes |
| `src/hooks/useFinderQuery.ts` | Create | New paginated query hook |
| `src/pages/Finder.tsx` | Major refactor | Replace fetch-all with paginated queries |
| `src/lib/supabaseHelpers.ts` | Remove `fetchAllFilaments` | No longer needed |
| `src/components/LoadingProgress.tsx` | Remove | No longer needed |

### What Stays the Same

- `FilamentCard` / `LabReadoutCard` rendering logic (unchanged)
- `calculateUnifiedScore()` for detail pages and tooltips
- URL filter sync and session filter persistence
- Color search, hex matching, and color distance calculations (moved to SQL WHERE clauses)
- Mobile filter sheet and horizontal filter bar UI components
- Brand diversity interleaving logic (moved to SQL)

### Risk Mitigation

- The materialized view refresh can be scheduled via a cron trigger (every 5 minutes) to keep data fresh
- Fallback: if the RPC fails, the existing client-side approach can be kept as a degraded mode
- Search quality: the SQL `ILIKE` approach already exists; multi-term matching will use `AND` chains of `ILIKE` on searchable columns
- Regional filtering logic in SQL must precisely mirror the TypeScript `isFilamentAvailableInRegion()` function -- this is the highest-risk area and needs thorough testing

