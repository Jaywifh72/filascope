-- =====================================================
-- MIGRATION: Part 6 - Fix complete_brand_scrape Bug
-- Created: 2026-04-01
-- Purpose: Replace broken complete_brand_scrape with proper trigger
-- =====================================================

-- 1. Create the sync_completion_trigger RPC function
CREATE OR REPLACE FUNCTION sync_completion_trigger(
    p_brand_slug VARCHAR(100),
    p_sync_log_id BIGINT,
    p_status VARCHAR(20),
    p_products_updated INTEGER DEFAULT 0,
    p_prices_updated INTEGER DEFAULT 0,
    p_images_updated INTEGER DEFAULT 0,
    p_errors_updated INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_brand_record RECORD;
    v_sync_record RECORD;
    v_tier VARCHAR(5);
    v_success_rate DECIMAL(5,2);
    v_failure_count INTEGER;
    v_should_open_circuit_breaker BOOLEAN;
    v_synced_regions JSONB;
BEGIN
    -- Get brand tier
    SELECT sync_tier INTO v_tier
    FROM automated_brands
    WHERE brand_slug = p_brand_slug;
    
    IF v_tier IS NULL THEN
        v_tier := 'T3'; -- Default to weekly if not configured
    END IF;
    
    -- Calculate success rate based on last 30 days
    SELECT 
        COUNT(*) FILTER (WHERE status = 'success')::DECIMAL / 
        NULLIF(COUNT(*), 0) * 100 as success_rate,
        COUNT(*) FILTER (WHERE status = 'failed' OR status = 'partial_failure') as failures
    INTO v_success_rate, v_failure_count
    FROM brand_sync_logs
    WHERE brand_slug = p_brand_slug
    AND started_at > NOW() - INTERVAL '30 days';
    
    -- Update circuit breaker state
    IF p_status = 'success' THEN
        -- Reset circuit breaker on success
        UPDATE sync_circuit_breaker
        SET 
            is_open = FALSE,
            failure_count = 0,
            last_success_at = NOW(),
            reason = NULL
        WHERE brand_slug = p_brand_slug;
    ELSIF p_status = 'failed' OR p_status = 'partial_failure' THEN
        -- Check if we should open circuit breaker
        SELECT 
            COALESCE(max_failures, 3),
            COALESCE(failure_count, 0) + 1
        INTO v_should_open_circuit_breaker, v_failure_count
        FROM sync_circuit_breaker
        WHERE brand_slug = p_brand_slug;
        
        -- Insert or update circuit breaker
        INSERT INTO sync_circuit_breaker (brand_slug, is_open, failure_count, last_failure_at, reason)
        VALUES (p_brand_slug, v_should_open_circuit_breaker, v_failure_count, NOW(), 'Consecutive failures')
        ON CONFLICT (brand_slug) DO UPDATE SET
            failure_count = EXCLUDED.failure_count,
            last_failure_at = EXCLUDED.last_failure_at,
            is_open = EXCLUDED.failure_count >= COALESCE(sync_circuit_breaker.max_failures, 3),
            reason = EXCLUDED.reason,
            opened_at = CASE 
                WHEN sync_circuit_breaker.failure_count + 1 >= COALESCE(sync_circuit_breaker.max_failures, 3)
                THEN NOW()
                ELSE sync_circuit_breaker.opened_at
            END;
    END IF;
    
    -- Get synced regions from regional_sync_log
    SELECT COALESCE(
        jsonb_object_agg(region, status = 'success'),
        '{}'::jsonb
    )
    INTO v_synced_regions
    FROM regional_sync_log
    WHERE sync_log_id = p_sync_log_id;
    
    -- Update the sync log with completion data
    UPDATE brand_sync_logs
    SET 
        synced_regions = v_synced_regions,
        circuit_breaker_triggered = (SELECT is_open FROM sync_circuit_breaker WHERE brand_slug = p_brand_slug),
        circuit_breaker_reason = (SELECT reason FROM sync_circuit_breaker WHERE brand_slug = p_brand_slug)
    WHERE id = p_sync_log_id;
    
    -- Build response
    RETURN jsonb_build_object(
        'status', 'completed',
        'brand_slug', p_brand_slug,
        'sync_log_id', p_sync_log_id,
        'sync_status', p_status,
        'tier', v_tier,
        'success_rate_30d', ROUND(COALESCE(v_success_rate, 0), 2),
        'circuit_breaker_open', (SELECT COALESCE(is_open, FALSE) FROM sync_circuit_breaker WHERE brand_slug = p_brand_slug),
        'synced_regions', v_synced_regions,
        'metrics', jsonb_build_object(
            'products_updated', p_products_updated,
            'prices_updated', p_prices_updated,
            'images_updated', p_images_updated,
            'errors_updated', p_errors_updated
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION sync_completion_trigger TO authenticated;
GRANT EXECUTE ON FUNCTION sync_completion_trigger TO anon;

-- 3. Create a helper function to check if circuit breaker is open
CREATE OR REPLACE FUNCTION is_circuit_breaker_open(p_brand_slug VARCHAR(100))
RETURNS BOOLEAN AS $$
DECLARE
    v_is_open BOOLEAN;
    v_reset_after INTEGER;
    v_last_failure_at TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT 
        COALESCE(is_open, FALSE),
        COALESCE(reset_after, 3600),
        last_failure_at
    INTO v_is_open, v_reset_after, v_last_failure_at
    FROM sync_circuit_breaker
    WHERE brand_slug = p_brand_slug;
    
    -- Auto-reset if timer expired
    IF v_is_open AND v_last_failure_at < NOW() - (v_reset_after || ' seconds')::INTERVAL THEN
        UPDATE sync_circuit_breaker
        SET 
            is_open = FALSE,
            failure_count = 0,
            reason = 'Auto-reset after timeout'
        WHERE brand_slug = p_brand_slug;
        
        RETURN FALSE;
    END IF;
    
    RETURN COALESCE(v_is_open, FALSE);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION is_circuit_breaker_open TO authenticated;

-- 4. Create view for circuit breaker status
CREATE OR REPLACE VIEW circuit_breaker_status AS
SELECT 
    scb.brand_slug,
    b.name as brand_name,
    scb.is_open,
    scb.failure_count,
    scb.last_success_at,
    scb.last_failure_at,
    scb.opened_at,
    scb.reason,
    scb.max_failures,
    scb.reset_after,
    EXTRACT(EPOCH FROM (NOW() - COALESCE(scb.last_failure_at, NOW())))::INTEGER as seconds_since_failure,
    CASE 
        WHEN scb.is_open THEN 'BLOCKED'
        ELSE 'ACTIVE'
    END as status
FROM sync_circuit_breaker scb
LEFT JOIN brands b ON b.slug = scb.brand_slug;

COMMENT ON VIEW circuit_breaker_status IS 'Current circuit breaker status for all brands. Use this to see which brands are blocked due to failures.';

-- 5. Create trigger to log regional sync completion
CREATE OR REPLACE FUNCTION log_regional_sync_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Update brand_sync_logs synced_regions JSONB when regional_sync_log is updated
    UPDATE brand_sync_logs
    SET synced_regions = jsonb_set(
        COALESCE(synced_regions, '{}'::jsonb),
        ARRAY[NEW.region],
        to_jsonb(NEW.status = 'success')
    )
    WHERE id = NEW.sync_log_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_regional_sync_completion ON regional_sync_log;
CREATE TRIGGER trigger_log_regional_sync_completion
AFTER INSERT OR UPDATE ON regional_sync_log
FOR EACH ROW
EXECUTE FUNCTION log_regional_sync_completion();

-- 6. Update brand_sync_logs table with new columns if missing
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
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'brand_sync_logs' AND column_name = 'synced_regions'
    ) THEN
        ALTER TABLE brand_sync_logs ADD COLUMN synced_regions JSONB DEFAULT '{}';
        COMMENT ON COLUMN brand_sync_logs.synced_regions IS 'JSONB object tracking which regions were synced: {"USD": true, "EUR": false}';
    END IF;
END $$;

-- 7. Add comments
COMMENT ON FUNCTION sync_completion_trigger IS 'RPC function to complete a brand sync and update circuit breaker state. Call this instead of complete_brand_scrape.';

COMMENT ON FUNCTION is_circuit_breaker_open IS 'Check if circuit breaker is open for a brand. Auto-resets if timer expired.';
