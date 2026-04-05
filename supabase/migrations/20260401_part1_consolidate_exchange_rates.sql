-- =====================================================
-- MIGRATION: Part 1 - Consolidate Exchange Rate Tables
-- Created: 2026-04-01
-- Purpose: Merge currency_exchange_rates into exchange_rates
-- =====================================================

-- 1. Add exchange_rate_date column to exchange_rates if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'exchange_rates' AND column_name = 'exchange_rate_date'
    ) THEN
        ALTER TABLE exchange_rates ADD COLUMN exchange_rate_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. Migrate data from currency_exchange_rates to exchange_rates
-- Convert from base_currency/target_currency format to rate_to_usd format
-- Common conversion factors to USD:
-- EUR: ~1.04 USD per EUR (so rate_to_usd = 1.04)
-- GBP: ~1.26 USD per GBP
-- CAD: ~0.74 USD per CAD
-- AUD: ~0.66 USD per AUD
-- JPY: ~0.0066 USD per JPY

INSERT INTO exchange_rates (currency_code, rate_to_usd, exchange_rate_date)
SELECT 
    target_currency as currency_code,
    CASE target_currency
        WHEN 'EUR' THEN 1.0 / exchange_rate -- If exchange_rate is USD/EUR, invert
        WHEN 'GBP' THEN 1.0 / exchange_rate
        WHEN 'CAD' THEN 1.0 / exchange_rate
        WHEN 'AUD' THEN 1.0 / exchange_rate
        WHEN 'JPY' THEN 1.0 / exchange_rate
        ELSE 1.0 / exchange_rate -- Default inversion
    END as rate_to_usd,
    NOW() as exchange_rate_date
FROM currency_exchange_rates
WHERE target_currency != 'USD'
ON CONFLICT (currency_code) DO NOTHING;

-- 3. Verify migration
SELECT 'Exchange rates consolidated' as status,
       COUNT(*) as total_rates,
       STRING_AGG(currency_code, ', ' ORDER BY currency_code) as currencies
FROM exchange_rates;

-- 4. Rename old table (keep as backup)
ALTER TABLE currency_exchange_rates RENAME TO currency_exchange_rates_backup_20260401;

-- 5. Add comment to exchange_rates table
COMMENT ON TABLE exchange_rates IS 'Unified exchange rate table (replaces currency_exchange_rates). Stores USD conversion rates for all currencies. Updated every 4 hours.';

-- 6. Create index on exchange_rate_date for TTL queries
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(exchange_rate_date DESC);

COMMENT ON INDEX idx_exchange_rates_date IS 'Index for TTL-based exchange rate refresh queries';
