-- =====================================================
-- MIGRATION: Part 5 - Price Validation and Anomaly Detection
-- Created: 2026-04-01
-- Purpose: Add price anomaly detection and validation
-- =====================================================

-- 1. Add validation columns to filament_prices
DO $$
BEGIN
    -- Add confidence score
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'filament_prices' AND column_name = 'confidence_score'
    ) THEN
        ALTER TABLE filament_prices ADD COLUMN confidence_score DECIMAL(3,2) DEFAULT 0.50;
        COMMENT ON COLUMN filament_prices.confidence_score IS 'Price source confidence: 1.00 = API (direct), 0.75 = scraped (medium), 0.50 = converted (low), 0.00 = legacy';
    END IF;

    -- Add validation status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'filament_prices' AND column_name = 'validation_status'
    ) THEN
        ALTER TABLE filament_prices ADD COLUMN validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'warning', 'invalid', 'anomaly'));
        COMMENT ON COLUMN filament_prices.validation_status IS 'Validation status: valid (within expected range), warning (slightly off), invalid (bad conversion), anomaly (extreme outlier)';
    END IF;

    -- Add last_validated timestamp
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'filament_prices' AND column_name = 'last_validated_at'
    ) THEN
        ALTER TABLE filament_prices ADD COLUMN last_validated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Create price_anomalies table
CREATE TABLE IF NOT EXISTS price_anomalies (
    id BIGSERIAL PRIMARY KEY,
    filament_price_id BIGINT REFERENCES filament_prices(id) ON DELETE CASCADE,
    filament_id INTEGER REFERENCES filaments(id) ON DELETE CASCADE,
    brand_slug VARCHAR(100),
    currency_code VARCHAR(3) NOT NULL,
    anomaly_type VARCHAR(30) NOT NULL CHECK (anomaly_type IN ('currency_mismatch', 'price_outlier', 'stale_price', 'extreme_conversion', 'negative_price', 'zero_price')),
    expected_price DECIMAL(10,2),
    actual_price DECIMAL(10,2),
    deviation_percent DECIMAL(10,2),
    severity VARCHAR(10) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMP WITH TIME ZONE,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add indexes for anomalies
CREATE INDEX idx_price_anomalies_filament_id ON price_anomalies(filament_id);
CREATE INDEX idx_price_anomalies_brand_currency ON price_anomalies(brand_slug, currency_code);
CREATE INDEX idx_price_anomalies_type_severity ON price_anomalies(anomaly_type, severity);
CREATE INDEX idx_price_anomalies_is_resolved ON price_anomalies(is_resolved);
CREATE INDEX idx_price_anomalies_detected_at ON price_anomalies(detected_at DESC);

-- 4. Create data_quality_metrics table
CREATE TABLE IF NOT EXISTS data_quality_metrics (
    id BIGSERIAL PRIMARY KEY,
    brand_slug VARCHAR(100),
    metric_date DATE DEFAULT CURRENT_DATE,
    total_products INTEGER DEFAULT 0,
    products_with_prices INTEGER DEFAULT 0,
    products_with_regional_prices INTEGER DEFAULT 0,
    price_coverage_percent DECIMAL(5,2),
    avg_price_freshness_hours DECIMAL(10,2),
    stale_prices_count INTEGER DEFAULT 0,
    anomaly_count INTEGER DEFAULT 0,
    validation_pass_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(brand_slug, metric_date)
);

-- 5. Add indexes for metrics
CREATE INDEX idx_data_quality_metrics_brand_date ON data_quality_metrics(brand_slug, metric_date DESC);
CREATE INDEX idx_data_quality_metrics_date ON data_quality_metrics(metric_date DESC);

-- 6. Create regional_sync_config table for per-brand/region settings
CREATE TABLE IF NOT EXISTS regional_sync_config (
    id SERIAL PRIMARY KEY,
    brand_slug VARCHAR(100) NOT NULL,
    region VARCHAR(3) NOT NULL, -- USD, EUR, CAD, GBP, AUD, JPY
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT TRUE,
    sync_priority INTEGER DEFAULT 100, -- Higher = more important
    price_anomaly_threshold_low DECIMAL(5,2) DEFAULT 0.50, -- Reject if < 50% of expected
    price_anomaly_threshold_high DECIMAL(5,2) DEFAULT 3.00, -- Reject if > 300% of expected
    max_price_age_hours INTEGER DEFAULT 72, -- Max age before considered stale
    requires_native_currency BOOLEAN DEFAULT FALSE, -- TRUE = must scrape native, FALSE = can convert
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(brand_slug, region)
);

-- 7. Add default regional configs for Tier 1 brands
INSERT INTO regional_sync_config (brand_slug, region, store_id, is_enabled, sync_priority, requires_native_currency)
SELECT 
    b.slug,
    'EUR',
    (SELECT id FROM stores WHERE brand_id = b.id AND currency_code = 'EUR' LIMIT 1),
    TRUE,
    100,
    TRUE -- Require native EUR prices for Tier 1
FROM brands b
WHERE b.slug IN ('bambu-lab', 'polymaker', 'elegoo', 'creality', 'anycubic')
ON CONFLICT (brand_slug, region) DO NOTHING;

-- Add USD configs for all Tier 1
INSERT INTO regional_sync_config (brand_slug, region, store_id, is_enabled, sync_priority, requires_native_currency)
SELECT 
    b.slug,
    'USD',
    (SELECT id FROM stores WHERE brand_id = b.id AND currency_code = 'USD' LIMIT 1),
    TRUE,
    100,
    TRUE
FROM brands b
WHERE b.slug IN ('bambu-lab', 'polymaker', 'elegoo', 'creality', 'anycubic')
ON CONFLICT (brand_slug, region) DO NOTHING;

-- 8. Add comments
COMMENT ON TABLE price_anomalies IS 'Detected price anomalies requiring review. Automatically flagged by validation system or manually reported.';

COMMENT ON TABLE data_quality_metrics IS 'Daily data quality metrics per brand. Tracks coverage, freshness, anomaly count, and validation pass rate.';

COMMENT ON TABLE regional_sync_config IS 'Per-brand/region sync configuration. Controls which regions are synced, anomaly thresholds, and native currency requirements.';

COMMENT ON COLUMN regional_sync_config.requires_native_currency IS 'TRUE = scrape native prices (recommended for Tier 1), FALSE = convert from USD (fallback for Tier 2/3)';
