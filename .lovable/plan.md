

# Admin Inventory Management - Part 1: Database Foundation

## Current State Assessment

After thorough analysis of the existing database schema, here's what already exists vs. what needs to be added:

### Existing Infrastructure

| Table/Feature | Status | Details |
|---------------|--------|---------|
| `filaments` table | ✅ Exists | 122+ columns, comprehensive filament data |
| `printers` table | ✅ Exists | 122 printers, includes MSRP and price columns |
| `automated_brands` table | ✅ Exists | Brand sync configs with all required fields |
| `brand_sync_logs` table | ✅ Exists | Sync run tracking with full metrics |
| `price_extraction_logs` table | ✅ Exists | Individual extraction logging |

### Filaments Table - Column Analysis

| Requested Column | Status | Existing Equivalent |
|------------------|--------|---------------------|
| `display_name` | ❌ Missing | None - needs adding |
| `msrp` | ❌ Missing | None - needs adding |
| `sync_enabled` | ❌ Missing | None - needs adding |
| `last_sync_at` | ⚠️ Partial | `last_scraped_at` exists for price updates |
| `last_sync_status` | ⚠️ Partial | `sync_status` exists (synced/pending/error) |
| `last_sync_error` | ❌ Missing | None - needs adding |
| `admin_notes` | ❌ Missing | None - needs adding |

### Printers Table - Column Analysis

| Requested Column | Status | Existing Equivalent |
|------------------|--------|---------------------|
| `display_name` | ❌ Missing | None - needs adding |
| `msrp` | ✅ Exists | `msrp_usd`, `msrp_eur`, `msrp_cad` |
| `current_price` | ✅ Exists | Multi-currency columns (usd_store, usd_amazon, etc.) |
| `compare_at_price` | ❌ Missing | None - needs adding |
| `sync_enabled` | ❌ Missing | None - needs adding |
| `last_sync_at` | ⚠️ Partial | `prices_last_updated_at` exists |
| `last_sync_status` | ❌ Missing | None - needs adding |
| `last_sync_error` | ❌ Missing | None - needs adding |
| `admin_notes` | ❌ Missing | None - needs adding |

### Sync Tables Analysis

| Requested Table | Status | Recommendation |
|-----------------|--------|----------------|
| `price_sync_runs` | ❌ Missing | **Not needed** - `brand_sync_logs` already tracks sync runs with all required fields |
| `brand_sync_configs` | ❌ Duplicate | **Not needed** - `automated_brands` already has all config fields |

---

## Recommended Schema Changes

Based on the analysis, I recommend a streamlined approach that extends existing tables rather than creating duplicates.

### Migration 1: Add Admin Columns to Filaments

```text
+------------------+-------------+----------------------------------+
| Column           | Type        | Purpose                          |
+------------------+-------------+----------------------------------+
| display_name     | text        | Admin-editable override name     |
| msrp             | numeric     | Manufacturer suggested price     |
| sync_enabled     | boolean     | Include in automated syncs       |
| last_sync_error  | text        | Error message from last sync     |
| admin_notes      | text        | Internal admin notes             |
+------------------+-------------+----------------------------------+
```

Note: `last_sync_at` → Use existing `last_scraped_at`
Note: `last_sync_status` → Use existing `sync_status`

### Migration 2: Add Admin Columns to Printers

```text
+------------------------+-------------+----------------------------------+
| Column                 | Type        | Purpose                          |
+------------------------+-------------+----------------------------------+
| display_name           | text        | Admin-editable override name     |
| compare_at_price_usd   | numeric     | Compare-at price for USD         |
| sync_enabled           | boolean     | Include in automated syncs       |
| last_sync_status       | text        | success/failed/pending           |
| last_sync_error        | text        | Error message from last sync     |
| admin_notes            | text        | Internal admin notes             |
+------------------------+-------------+----------------------------------+
```

Note: `last_sync_at` → Use existing `prices_last_updated_at`
Note: MSRPs → Already exist as `msrp_usd`, `msrp_eur`, `msrp_cad`

### No New Tables Required

The requested `price_sync_runs` and `brand_sync_configs` tables are **already covered** by:

- **`brand_sync_logs`**: Tracks all sync runs with status, timing, success/failure counts, error details, and trigger source
- **`automated_brands`**: Has comprehensive sync configuration including:
  - `scraping_enabled` (sync on/off)
  - `platform_type` (firecrawl/shopify/api)
  - `rate_limit_ms` (rate limiting)
  - `price_selectors` (JSONB extraction config)
  - `last_scrape_at` / `next_scrape_at` (scheduling)
  - Success/failure tracking metrics

Brands already seeded: Creality, Bambu Lab, Polymaker, eSun, Elegoo, Hatchbox, Overture, Sunlu (8 of 9 requested)

---

## Implementation Steps

### Step 1: Database Migration - Filaments Admin Columns

SQL to execute:

```sql
-- Add admin management columns to filaments table
ALTER TABLE filaments 
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS msrp numeric,
  ADD COLUMN IF NOT EXISTS sync_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_sync_error text,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- Add comments for documentation
COMMENT ON COLUMN filaments.display_name IS 'Admin-editable display name that overrides product_title';
COMMENT ON COLUMN filaments.msrp IS 'Manufacturer Suggested Retail Price';
COMMENT ON COLUMN filaments.sync_enabled IS 'Whether to include in automated price syncs';
COMMENT ON COLUMN filaments.last_sync_error IS 'Error message from the last sync attempt';
COMMENT ON COLUMN filaments.admin_notes IS 'Internal notes for admin use only';

-- Create index for sync filtering
CREATE INDEX IF NOT EXISTS idx_filaments_sync_enabled ON filaments(sync_enabled) WHERE sync_enabled = true;
```

### Step 2: Database Migration - Printers Admin Columns

SQL to execute:

```sql
-- Add admin management columns to printers table
ALTER TABLE printers 
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS compare_at_price_usd numeric,
  ADD COLUMN IF NOT EXISTS sync_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_sync_status text,
  ADD COLUMN IF NOT EXISTS last_sync_error text,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- Add comments for documentation
COMMENT ON COLUMN printers.display_name IS 'Admin-editable display name that overrides model_name';
COMMENT ON COLUMN printers.compare_at_price_usd IS 'Compare-at/strikethrough price in USD';
COMMENT ON COLUMN printers.sync_enabled IS 'Whether to include in automated price syncs';
COMMENT ON COLUMN printers.last_sync_status IS 'Status of last sync: success, failed, or pending';
COMMENT ON COLUMN printers.last_sync_error IS 'Error message from the last sync attempt';
COMMENT ON COLUMN printers.admin_notes IS 'Internal notes for admin use only';

-- Create index for sync filtering
CREATE INDEX IF NOT EXISTS idx_printers_sync_enabled ON printers(sync_enabled) WHERE sync_enabled = true;
```

### Step 3: Add Missing Brand (Prusa)

SQL to execute:

```sql
-- Add Prusa if not already present
INSERT INTO automated_brands (brand_name, brand_slug, platform_type, scraping_enabled, rate_limit_ms)
VALUES ('Prusa', 'prusa', 'shopify', true, 2000)
ON CONFLICT (brand_slug) DO NOTHING;
```

### Step 4: TypeScript Types Regeneration

After migrations complete, the Supabase types will automatically regenerate in `src/integrations/supabase/types.ts`.

---

## Verification Queries

After implementation, run these verification queries:

```sql
-- Verify filaments columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'filaments' 
AND column_name IN ('display_name', 'msrp', 'sync_enabled', 'last_sync_error', 'admin_notes');
-- Expected: 5 rows

-- Verify printers columns  
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'printers' 
AND column_name IN ('display_name', 'compare_at_price_usd', 'sync_enabled', 'last_sync_status', 'last_sync_error', 'admin_notes');
-- Expected: 6 rows

-- Verify Prusa brand exists
SELECT brand_name, brand_slug, platform_type FROM automated_brands WHERE brand_slug = 'prusa';
-- Expected: 1 row
```

---

## Technical Notes

### Why Not Create `price_sync_runs`?

The existing `brand_sync_logs` table already provides:
- `sync_type` (full_scrape, price_update, etc.)
- `status` (running, completed, failed)
- `started_at` / `completed_at` / `duration_seconds`
- `products_discovered`, `products_created`, `products_updated`, `products_failed`
- `price_changes` count
- `error_details` (JSONB)
- `triggered_by` (admin, scheduler, etc.)

### Why Not Create `brand_sync_configs`?

The existing `automated_brands` table already provides:
- `scraping_enabled` → sync on/off toggle
- `platform_type` → sync method (shopify, firecrawl, api)
- `rate_limit_ms` → rate limiting
- `price_selectors` → JSONB extraction config
- `last_scrape_at` / `next_scrape_at` → scheduling
- `successful_scrapes` / `failed_scrapes` → success rate tracking

---

## Files to be Modified

| File | Action |
|------|--------|
| New migration SQL | Create via migration tool |
| `src/integrations/supabase/types.ts` | Auto-regenerated after migration |

