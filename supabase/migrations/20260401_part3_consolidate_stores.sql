-- =====================================================
-- MIGRATION: Part 3 - Consolidate Regional Store Tables
-- Created: 2026-04-01
-- Purpose: Merge brand_regional_stores into stores
-- =====================================================

-- 1. Add brand_id column to stores if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stores' AND column_name = 'brand_id'
    ) THEN
        ALTER TABLE stores ADD COLUMN brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Add active and regional columns if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stores' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE stores ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stores' AND column_name = 'is_regional'
    ) THEN
        ALTER TABLE stores ADD COLUMN is_regional BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stores' AND column_name = 'currency_code'
    ) THEN
        ALTER TABLE stores ADD COLUMN currency_code VARCHAR(3) DEFAULT 'USD';
    END IF;
END $$;

-- 3. Migrate data from brand_regional_stores to stores
INSERT INTO stores (name, store_url, base_url, currency_code, is_regional, is_active, brand_id, created_at, updated_at)
SELECT 
    CONCAT(b.name, ' - ', brs.region) as name,
    brs.store_url as store_url,
    brs.base_url as base_url,
    UPPER(brs.region) as currency_code,
    TRUE as is_regional,
    TRUE as is_active,
    b.id as brand_id,
    NOW() as created_at,
    NOW() as updated_at
FROM brand_regional_stores brs
JOIN brands b ON b.slug = brs.brand_slug
ON CONFLICT (store_url) DO NOTHING;

-- 4. Update existing stores to link to brands
UPDATE stores s
SET brand_id = b.id
FROM brands b
WHERE s.name = b.name
AND s.brand_id IS NULL;

-- 5. Verify migration
SELECT 'Stores consolidated' as status,
       COUNT(*) as total_stores,
       COUNT(CASE WHEN is_regional THEN 1 END) as regional_stores,
       COUNT(DISTINCT brand_id) as brands_with_stores
FROM stores;

-- 6. Rename old table (keep as backup)
ALTER TABLE brand_regional_stores RENAME TO brand_regional_stores_backup_20260401;

-- 7. Add indexes for fast store lookups
CREATE INDEX IF NOT EXISTS idx_stores_brand_id ON stores(brand_id);
CREATE INDEX IF NOT EXISTS idx_stores_active_regional ON stores(is_active, is_regional);
CREATE INDEX IF NOT EXISTS idx_stores_currency ON stores(currency_code);

-- 8. Add comments
COMMENT ON TABLE stores IS 'Unified store table (replaces brand_regional_stores). Supports both primary and regional stores with multi-currency pricing.';

COMMENT ON COLUMN stores.is_regional IS 'TRUE if this is a regional store (e.g., Bambu Lab EU, Polymaker Canada)';
