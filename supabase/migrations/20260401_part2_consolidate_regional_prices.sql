-- =====================================================
-- MIGRATION: Part 2 - Consolidate Regional Price Tables
-- Created: 2026-04-01
-- Purpose: Merge product_regional_prices into filament_prices
-- =====================================================

-- 1. Add foreign key constraints to filament_prices if not exists
DO $$
BEGIN
    -- Check if filament table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'filament_prices') THEN
        -- Add filament_id FK if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name = 'filament_prices' 
            AND constraint_name = 'filament_prices_filament_id_fkey'
        ) THEN
            ALTER TABLE filament_prices 
            ADD CONSTRAINT filament_prices_filament_id_fkey 
            FOREIGN KEY (filament_id) REFERENCES filaments(id) ON DELETE CASCADE;
        END IF;

        -- Add store_id FK if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name = 'filament_prices' 
            AND constraint_name = 'filament_prices_store_id_fkey'
        ) THEN
            ALTER TABLE filament_prices 
            ADD CONSTRAINT filament_prices_store_id_fkey 
            FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 2. Migrate data from product_regional_prices to filament_prices
INSERT INTO filament_prices (filament_id, store_id, price, currency_code, source, last_updated)
SELECT 
    prp.product_id as filament_id,
    (SELECT id FROM stores WHERE store_url = prp.store_url LIMIT 1) as store_id,
    prp.price,
    prp.currency,
    'legacy_migration' as source,
    COALESCE(prp.updated_at, NOW()) as last_updated
FROM product_regional_prices prp
WHERE EXISTS (SELECT 1 FROM filaments f WHERE f.id = prp.product_id)
ON CONFLICT (filament_id, store_id) DO NOTHING;

-- 3. Verify migration
SELECT 'Regional prices consolidated' as status,
       COUNT(*) as total_prices,
       COUNT(DISTINCT currency) as currencies
FROM filament_prices;

-- 4. Rename old table (keep as backup)
ALTER TABLE product_regional_prices RENAME TO product_regional_prices_backup_20260401;

-- 5. Add check constraint for price values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        JOIN pg_namespace ON pg_namespace.oid = pg_constraint.connamespace
        WHERE conname = 'filament_prices_price_positive'
        AND nspname = 'public'
    ) THEN
        ALTER TABLE filament_prices
        ADD CONSTRAINT filament_prices_price_positive
        CHECK (price > 0);
    END IF;
END $$;

-- 6. Add index for fast regional price lookups
CREATE INDEX IF NOT EXISTS idx_filament_prices_filament_currency 
ON filament_prices(filament_id, currency_code);

CREATE INDEX IF NOT EXISTS idx_filament_prices_store_currency 
ON filament_prices(store_id, currency_code);

-- 7. Add comments
COMMENT ON TABLE filament_prices IS 'Unified regional price table (replaces product_regional_prices). Stores prices per filament per store per currency. Includes source tracking for confidence scoring.';

COMMENT ON COLUMN filament_prices.source IS 'Price source: api (high confidence), scraped (medium), converted (low), legacy_migration';
