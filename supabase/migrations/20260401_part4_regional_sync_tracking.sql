-- =====================================================
-- MIGRATION: Part 4 - Add Regional Sync Tracking
-- Created: 2026-04-01
-- Purpose: Track sync success per region for each brand
-- =====================================================

-- 1. Create regional_sync_log table
CREATE TABLE IF NOT EXISTS regional_sync_log (
    id BIGSERIAL PRIMARY KEY,
    sync_log_id BIGINT REFERENCES brand_sync_logs(id) ON DELETE CASCADE,
    brand_slug VARCHAR(100) NOT NULL,
    region VARCHAR(3) NOT NULL, -- USD, EUR, CAD, GBP, AUD, JPY
    store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'skipped')),
    products_fetched INTEGER DEFAULT 0,
    prices_updated INTEGER DEFAULT 0,
    errors_updated INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add indexes
CREATE INDEX idx_regional_sync_log_sync_log_id ON regional_sync_log(sync_log_id);
CREATE INDEX idx_regional_sync_log_brand_region ON regional_sync_log(brand_slug, region);
CREATE INDEX idx_regional_sync_log_status ON regional_sync_log(status);
CREATE INDEX idx_regional_sync_log_started_at ON regional_sync_log(started_at DESC);

-- 3. Add synced_regions column to brand_sync_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'brand_sync_logs' AND column_name = 'synced_regions'
    ) THEN
        ALTER TABLE brand_sync_logs ADD COLUMN synced_regions JSONB DEFAULT '{}';
        COMMENT ON COLUMN brand_sync_logs.synced_regions IS 'JSONB object tracking which regions were synced: {"USD": true, "EUR": false, "CAD": true}';
    END IF;
END $$;

-- 4. Add circuit breaker columns to brand_sync_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'brand_sync_logs' AND column_name = 'circuit_breaker_triggered'
    ) THEN
        ALTER TABLE brand_sync_logs ADD COLUMN circuit_breaker_triggered BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'brand_sync_logs' AND column_name = 'circuit_breaker_reason'
    ) THEN
        ALTER TABLE brand_sync_logs ADD COLUMN circuit_breaker_reason TEXT;
    END IF;
END $$;

-- 5. Create sync_circuit_breaker table for circuit breaker state
CREATE TABLE IF NOT EXISTS sync_circuit_breaker (
    brand_slug VARCHAR(100) PRIMARY KEY,
    is_open BOOLEAN DEFAULT FALSE, -- FALSE = closed (allow syncs), TRUE = open (block syncs)
    failure_count INTEGER DEFAULT 0,
    last_failure_at TIMESTAMP WITH TIME ZONE,
    last_success_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    reason TEXT,
    reset_after INTEGER DEFAULT 3600, -- Reset after 1 hour (in seconds)
    max_failures INTEGER DEFAULT 3, -- Open after 3 consecutive failures
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Add indexes for circuit breaker
CREATE INDEX idx_sync_circuit_breaker_is_open ON sync_circuit_breaker(is_open);
CREATE INDEX idx_sync_circuit_breaker_last_failure ON sync_circuit_breaker(last_failure_at DESC);

-- 7. Add update timestamp trigger for sync_circuit_breaker
CREATE OR REPLACE FUNCTION update_sync_circuit_breaker_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sync_circuit_breaker_timestamp ON sync_circuit_breaker;
CREATE TRIGGER trigger_update_sync_circuit_breaker_timestamp
BEFORE UPDATE ON sync_circuit_breaker
FOR EACH ROW
EXECUTE FUNCTION update_sync_circuit_breaker_timestamp();

-- 8. Add comments
COMMENT ON TABLE regional_sync_log IS 'Tracks sync operations per brand per region. Enables granular monitoring of multi-regional syncs.';

COMMENT ON TABLE sync_circuit_breaker IS 'Circuit breaker state for brand syncs. Prevents cascading failures by temporarily blocking syncs for failing brands.';
