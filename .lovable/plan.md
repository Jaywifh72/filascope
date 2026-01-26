

# Regional Database Schema - Part 1 Implementation Plan

## Overview
This migration adds normalized regional URL and pricing tables to support multi-region e-commerce, replacing/augmenting the current denormalized column-based approach.

## Current State Analysis

### Already Exists
| Component | Status |
|-----------|--------|
| `brand_regional_stores` | Complete - stores brand-level regional config |
| `product_regional_slugs` | Exists for filaments only |
| Filaments: `product_url_*` columns | 5 regional URL columns exist |
| Filaments: `price_*` columns | 5 regional price columns exist |
| Filaments: `available_regions` | Array column exists |
| Printers: `official_store_url_*` | 5 regional URL columns exist |
| Printers: regional price columns | 12 regional price columns exist (store + Amazon) |
| `brand_sync_logs` | Sync tracking (no `price_sync_runs` table) |

### What This Migration Adds
- **Normalized tables** for flexible multi-store per region support
- **Tracking columns** for verification and sync status
- **Helper views** for easy querying with regional data included

---

## Database Migration Steps

### Step 1: Create `product_regional_urls` Table

```sql
CREATE TABLE public.product_regional_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  product_type text NOT NULL,
  region_code text NOT NULL,
  store_url text NOT NULL,
  store_name text,
  currency_code text NOT NULL DEFAULT 'USD',
  is_primary boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  last_verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT product_regional_urls_type_check 
    CHECK (product_type IN ('filament', 'printer')),
  CONSTRAINT product_regional_urls_region_check 
    CHECK (region_code IN ('US', 'CA', 'UK', 'EU', 'AU', 'JP', 'CN')),
  CONSTRAINT product_regional_urls_unique 
    UNIQUE (product_id, product_type, region_code, store_url)
);
```

**Indexes:**
- `(product_id, product_type)` - Primary lookup
- `(region_code)` - Filter by region
- `(is_verified)` - Find unverified URLs

### Step 2: Create `product_regional_prices` Table

```sql
CREATE TABLE public.product_regional_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  product_type text NOT NULL,
  region_code text NOT NULL,
  currency_code text NOT NULL,
  current_price numeric,
  compare_at_price numeric,
  msrp numeric,
  price_source text,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_error text,
  store_url_id uuid REFERENCES product_regional_urls(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT product_regional_prices_type_check 
    CHECK (product_type IN ('filament', 'printer')),
  CONSTRAINT product_regional_prices_region_check 
    CHECK (region_code IN ('US', 'CA', 'UK', 'EU', 'AU', 'JP', 'CN')),
  CONSTRAINT product_regional_prices_unique 
    UNIQUE (product_id, product_type, region_code)
);
```

### Step 3: Add Columns to `filaments` Table

```sql
ALTER TABLE filaments 
  ADD COLUMN IF NOT EXISTS primary_region text DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS has_regional_urls boolean DEFAULT false;
-- Note: available_regions already exists as text[]
```

### Step 4: Add Columns to `printers` Table

```sql
ALTER TABLE printers 
  ADD COLUMN IF NOT EXISTS primary_region text DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS has_regional_urls boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS regional_availability text[];
```

### Step 5: Add Regional Columns to `brand_sync_logs`

```sql
ALTER TABLE brand_sync_logs
  ADD COLUMN IF NOT EXISTS region_code text,
  ADD COLUMN IF NOT EXISTS regions_synced text[];
```

### Step 6: Create Helper View for Filaments

```sql
CREATE OR REPLACE VIEW filaments_with_regional AS
SELECT 
  f.*,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'region', pru.region_code,
      'url', pru.store_url,
      'storeName', pru.store_name,
      'isVerified', pru.is_verified,
      'isPrimary', pru.is_primary
    ))
    FROM product_regional_urls pru 
    WHERE pru.product_id = f.id AND pru.product_type = 'filament'),
    '[]'::jsonb
  ) as regional_urls,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'region', prp.region_code,
      'price', prp.current_price,
      'currency', prp.currency_code,
      'lastSync', prp.last_sync_at,
      'status', prp.last_sync_status
    ))
    FROM product_regional_prices prp 
    WHERE prp.product_id = f.id AND prp.product_type = 'filament'),
    '[]'::jsonb
  ) as regional_prices
FROM filaments f;
```

### Step 7: Create Helper View for Printers

```sql
CREATE OR REPLACE VIEW printers_with_regional AS
SELECT 
  p.*,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'region', pru.region_code,
      'url', pru.store_url,
      'storeName', pru.store_name,
      'isVerified', pru.is_verified,
      'isPrimary', pru.is_primary
    ))
    FROM product_regional_urls pru 
    WHERE pru.product_id = p.id AND pru.product_type = 'printer'),
    '[]'::jsonb
  ) as regional_urls,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'region', prp.region_code,
      'price', prp.current_price,
      'currency', prp.currency_code,
      'lastSync', prp.last_sync_at,
      'status', prp.last_sync_status
    ))
    FROM product_regional_prices prp 
    WHERE prp.product_id = p.id AND prp.product_type = 'printer'),
    '[]'::jsonb
  ) as regional_prices
FROM printers p;
```

### Step 8: RLS Policies

```sql
-- product_regional_urls
ALTER TABLE product_regional_urls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read regional URLs"
  ON product_regional_urls FOR SELECT USING (true);

CREATE POLICY "Service role manages regional URLs"
  ON product_regional_urls FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- product_regional_prices
ALTER TABLE product_regional_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read regional prices"
  ON product_regional_prices FOR SELECT USING (true);

CREATE POLICY "Service role manages regional prices"
  ON product_regional_prices FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

### Step 9: Auto-Update Trigger

```sql
CREATE OR REPLACE FUNCTION update_regional_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_regional_urls_timestamp
  BEFORE UPDATE ON product_regional_urls
  FOR EACH ROW EXECUTE FUNCTION update_regional_timestamp();

CREATE TRIGGER update_product_regional_prices_timestamp
  BEFORE UPDATE ON product_regional_prices
  FOR EACH ROW EXECUTE FUNCTION update_regional_timestamp();
```

---

## TypeScript Types Update

After migration, the generated types will include:

```typescript
interface ProductRegionalUrl {
  id: string;
  product_id: string;
  product_type: 'filament' | 'printer';
  region_code: 'US' | 'CA' | 'UK' | 'EU' | 'AU' | 'JP' | 'CN';
  store_url: string;
  store_name: string | null;
  currency_code: string;
  is_primary: boolean;
  is_verified: boolean;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ProductRegionalPrice {
  id: string;
  product_id: string;
  product_type: 'filament' | 'printer';
  region_code: string;
  currency_code: string;
  current_price: number | null;
  compare_at_price: number | null;
  msrp: number | null;
  price_source: string | null;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  store_url_id: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## Migration Considerations

### Existing Data Compatibility
- The new tables will coexist with existing denormalized columns
- Existing `product_url_*` and `price_*` columns remain functional
- Future migration can populate new tables from existing columns

### Relationship to `product_regional_slugs`
- Existing table handles slug-to-region mapping for URL construction
- New `product_regional_urls` stores full URLs directly
- Both can coexist - slugs for URL generation, URLs for direct storage

### Sync Tracking Enhancement
- Adding `region_code` to `brand_sync_logs` enables per-region sync tracking
- `regions_synced` array captures which regions were updated in a sync run

---

## Technical Details

### Table Relationships
```text
filaments (id) ----< product_regional_urls (product_id)
                         |
                         v
                    product_regional_prices (store_url_id)
```

### Supported Regions and Currencies
| Region | Currency | Notes |
|--------|----------|-------|
| US | USD | Primary/default region |
| CA | CAD | Canada |
| UK | GBP | United Kingdom |
| EU | EUR | European Union |
| AU | AUD | Australia |
| JP | JPY | Japan |
| CN | CNY | China (new addition) |

---

## Verification After Migration

- [ ] `product_regional_urls` table exists with correct constraints
- [ ] `product_regional_prices` table exists with correct constraints  
- [ ] `filaments` has `primary_region` and `has_regional_urls` columns
- [ ] `printers` has `primary_region`, `has_regional_urls`, and `regional_availability` columns
- [ ] `brand_sync_logs` has `region_code` and `regions_synced` columns
- [ ] Views `filaments_with_regional` and `printers_with_regional` work
- [ ] RLS policies allow public read, service role write
- [ ] Supabase types regenerated successfully

