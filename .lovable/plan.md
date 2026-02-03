
# Plan: Migrate Amazon Links & Create Regional Pricing RPC Functions

## Summary

This plan implements Phase 2 of the regional pricing infrastructure:
1. An Edge Function to migrate existing Amazon links from the `filaments` table to the new normalized `filament_prices` table
2. Two PostgreSQL RPC functions for regional price lookups with currency conversion

## Current State

| Metric | Value |
|--------|-------|
| Filaments with US Amazon links | 115 |
| Filaments with UK Amazon links | 3 |
| Filaments with DE Amazon links | 1 |
| Records in `filament_prices` | 0 (empty, ready for migration) |
| Stores table | 17 stores seeded (includes all Amazon regions) |

---

## Implementation Steps

### Step 1: Create `migrate-amazon-links` Edge Function

**File**: `supabase/functions/migrate-amazon-links/index.ts`

This function will:
- Query all filaments with non-null Amazon links (US, UK, DE columns exist)
- Map each link to the corresponding store in the `stores` table
- Insert/upsert records into `filament_prices` with proper foreign keys
- Log results to `sync_logs` table

**Key adjustments from provided code**:
- Only 3 Amazon link columns exist: `amazon_link_us`, `amazon_link_uk`, `amazon_link_de`
- Use the existing `sync_logs` table schema (different from user's example - no `error_details` field)
- Add CORS headers for web access

```text
Edge Function Flow:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Query stores   │────>│ Query filaments │────>│ Upsert to       │
│  for ID mapping │     │ with amazon_*   │     │ filament_prices │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │ Log to sync_logs│
                                                └─────────────────┘
```

### Step 2: Create `get_filament_regional_prices` RPC Function

**Database Migration**: SQL function that:
- Accepts a `filament_id` and `user_region` parameter
- Joins `filament_prices` → `stores` → `exchange_rates`
- Converts all prices to user's local currency
- Returns prices sorted by: local stores first, ships-to-user second, lowest price third
- Includes formatted display strings with currency symbols

**Return columns**:
- `store_name`, `store_slug`, `store_type`
- `region`, `country_code`
- `price_cents` (original), `price_local` (converted), `price_display` (formatted)
- `currency_code`, `currency_symbol`
- `product_url`
- `is_local_store`, `ships_to_user`, `ships_from[]`
- `converted_price` (boolean flag)

### Step 3: Create `get_filament_best_price` Helper Function

A simple wrapper that calls `get_filament_regional_prices` and returns only the first (best) result.

---

## Database Changes

### Migration 1: Regional Pricing RPC Functions

```sql
-- Main function: Get all regional prices for a filament
CREATE OR REPLACE FUNCTION get_filament_regional_prices(
  p_filament_id UUID,
  p_user_region TEXT DEFAULT 'US'
)
RETURNS TABLE (
  store_name TEXT,
  store_slug TEXT,
  store_type TEXT,
  region TEXT,
  country_code TEXT,
  price_cents INTEGER,
  price_local NUMERIC,
  price_display TEXT,
  currency_code TEXT,
  currency_symbol TEXT,
  product_url TEXT,
  is_local_store BOOLEAN,
  ships_to_user BOOLEAN,
  ships_from TEXT[],
  converted_price BOOLEAN
) 
LANGUAGE plpgsql
AS $$
-- Implementation with currency conversion logic
$$;

-- Helper function: Get single best price
CREATE OR REPLACE FUNCTION get_filament_best_price(
  p_filament_id UUID,
  p_user_region TEXT DEFAULT 'US'
)
RETURNS TABLE (...)
LANGUAGE sql
AS $$
  SELECT ... FROM get_filament_regional_prices(...) LIMIT 1;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_filament_regional_prices TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_filament_best_price TO anon, authenticated;
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/migrate-amazon-links/index.ts` | Create | Edge function for data migration |
| `supabase/config.toml` | Modify | Add config for new edge function |
| Database migration | Create | SQL for RPC functions |

---

## Edge Function Configuration

Add to `supabase/config.toml`:
```toml
[functions.migrate-amazon-links]
verify_jwt = true  # Admin-only migration
```

---

## Technical Notes

### Amazon Link Column Mapping

| Column | Store Slug | Currency |
|--------|------------|----------|
| `amazon_link_us` | `amazon-us` | USD |
| `amazon_link_uk` | `amazon-uk` | GBP |
| `amazon_link_de` | `amazon-de` | EUR |

Note: The original request included CA, FR, ES, IT, AU, JP columns, but these don't exist in the current schema. Only US, UK, DE links are present.

### Price Handling

- `amazon_price_usd` (only 3 records have this) will be used as the default USD price
- For UK/DE links, `price_cents` will be set to 0 initially (needs separate price scraping)
- The `in_stock` field defaults to `true`

### sync_logs Schema Adaptation

The existing `sync_logs` table uses:
- `records_updated` instead of a generic counter
- `success_details` (JSONB) for additional info
- `error_message` (TEXT) instead of `error_details` (JSONB)

---

## Post-Implementation Steps

1. Deploy edge function
2. Run migration once: `POST /functions/v1/migrate-amazon-links`
3. Verify data in `filament_prices` table
4. Test RPC functions with sample queries

---

## Testing Queries

After implementation:
```sql
-- Check migrated data
SELECT COUNT(*) FROM filament_prices;

-- Test regional pricing function
SELECT * FROM get_filament_regional_prices(
  '00000000-0000-0000-0000-000000000000'::uuid,  -- replace with real ID
  'US'
);

-- Test best price function
SELECT * FROM get_filament_best_price(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'EU'
);
```
