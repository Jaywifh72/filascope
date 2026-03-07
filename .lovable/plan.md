

## Plan: Canonical Price Source of Truth

### Overview

Create a materialized view that establishes a single source of truth for filament prices across 4 overlapping tables, plus an admin UI component to audit price conflicts.

### Step 1: Database Migration

Create materialized view `v_canonical_prices` using a priority waterfall via `DISTINCT ON (filament_id, region_code)` with `UNION ALL` and a priority column for ordering.

**Sources in priority order:**
1. `filament_listings` — join on `filament_id`, map `region` to region_code, `current_price`, `currency`, `product_url`, `updated_at`
2. `product_regional_prices` — where `product_type = 'filament'`, use `product_id` as filament_id, `region_code`, `current_price`, `currency_code`
3. `filament_prices` — join `stores` on `store_id` to get `region`, convert `price_cents / 100` to price, use `currency_code`
4. `filaments` flat columns — UNION 6 rows per filament: `variant_price`/US, `price_cad`/CA, `price_eur`/EU, `price_gbp`/UK, `price_aud`/AU, `price_jpy`/JP

The view uses `DISTINCT ON` after ordering by priority to pick the highest-priority non-null price per filament+region.

**Additional objects:**
- Unique index on `(filament_id, region_code)` for concurrent refresh
- `refresh_canonical_prices()` function (SECURITY DEFINER, admin-gated) that calls `REFRESH MATERIALIZED VIEW CONCURRENTLY`

**Note:** `filament_id` column will be `uuid` type (matching filaments.id), not text. The user spec said text but the actual FK is uuid throughout.

### Step 2: New Component `src/components/admin/data-integrity/PriceSourceAudit.tsx`

Queries the `v_canonical_prices` view to find conflicts:
- Fetches all canonical prices, then for each filament+region, compares canonical price against the flat column price. If difference > 5%, it's a conflict.
- Actually, a simpler approach: query filaments flat prices and join against `v_canonical_prices` where `price_source != 'filaments_flat'` and check if the prices differ > 5%.

**Implementation approach:** Use a raw SQL RPC or multiple queries:
1. Summary card: count of filament+region pairs with >5% price difference between canonical and flat
2. Table of top 50 conflicts showing filament name, region, prices from each source, % diff
3. "Refresh Canonical Prices" button calling `supabase.rpc('refresh_canonical_prices')`

Since we can't do complex joins via the Supabase JS client easily, we'll create a helper RPC `get_price_conflicts(p_limit int)` that returns the top N conflicts directly. This keeps the component simple.

**Component structure:** React Query hook with `queryKey: ['price-source-audit']`, Card/Table/Badge/Button from shadcn, loading/error states matching DataIntegrity patterns.

### Step 3: Integration into DataIntegrity.tsx

Import `PriceSourceAudit` and insert it between the Price Consistency section (Section 2, ends ~line 571) and Orphan Detection section (Section 3, starts ~line 573).

### Files Changed

| File | Action |
|------|--------|
| Migration SQL | New — materialized view, unique index, `refresh_canonical_prices()`, `get_price_conflicts()` RPC |
| `src/components/admin/data-integrity/PriceSourceAudit.tsx` | New component |
| `src/pages/admin/DataIntegrity.tsx` | Add import + render new section |

### Technical Details

**Migration SQL outline:**
```sql
-- Materialized view with priority waterfall
CREATE MATERIALIZED VIEW v_canonical_prices AS
WITH ranked AS (
  -- Source 1: filament_listings (priority 1)
  SELECT filament_id::text, region AS region_code, current_price, currency, 
         'filament_listings' AS price_source, id::text AS source_row_id,
         product_url, updated_at::timestamptz AS last_updated_at, 1 AS priority
  FROM filament_listings WHERE current_price IS NOT NULL
  UNION ALL
  -- Source 2: product_regional_prices (priority 2)  
  SELECT product_id, region_code, current_price, currency_code,
         'product_regional_prices', id::text, NULL, updated_at, 2
  FROM product_regional_prices WHERE product_type='filament' AND current_price IS NOT NULL
  UNION ALL
  -- Source 3: filament_prices via stores (priority 3)
  SELECT fp.filament_id::text, s.region, fp.price_cents/100.0, fp.currency_code,
         'filament_prices', fp.id::text, fp.product_url, fp.updated_at, 3
  FROM filament_prices fp JOIN stores s ON s.id = fp.store_id
  WHERE fp.price_cents > 0
  UNION ALL
  -- Source 4: filaments flat columns (priority 4) — 6 UNIONs
  SELECT id::text, 'US', variant_price, 'USD', 'filaments_flat', id::text, product_url, updated_at, 4
  FROM filaments WHERE variant_price IS NOT NULL
  UNION ALL ... (CA/EUR/UK/AU/JP)
)
SELECT DISTINCT ON (filament_id, region_code)
  filament_id, region_code, current_price AS canonical_price,
  currency AS currency_code, price_source, source_row_id, product_url, last_updated_at
FROM ranked
ORDER BY filament_id, region_code, priority;

-- Unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_canonical_prices_pk ON v_canonical_prices (filament_id, region_code);

-- Refresh function (admin-only)
CREATE OR REPLACE FUNCTION refresh_canonical_prices() ...

-- Conflict detection RPC
CREATE OR REPLACE FUNCTION get_price_conflicts(p_limit int DEFAULT 50) ...
```

The `get_price_conflicts` function compares each canonical price against the filaments flat column for the same region. Returns rows where `ABS(canonical - flat) / NULLIF(flat, 0) > 0.05`.

