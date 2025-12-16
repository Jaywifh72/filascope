-- Step 1: Immediate cleanup - Reset all brands stuck in scraping mode
UPDATE automated_brands 
SET scraping_active = false 
WHERE scraping_active = true;

-- Step 2: Mark all stuck "running" sync logs as failed (older than 10 min)
UPDATE brand_sync_logs 
SET 
  status = 'failed',
  completed_at = NOW(),
  error_details = jsonb_build_object('error', 'Edge function timeout - auto-cleaned')
WHERE status = 'running' 
  AND started_at < NOW() - INTERVAL '10 minutes';

-- Step 3: Create auto-cleanup function for future use
CREATE OR REPLACE FUNCTION cleanup_stuck_scrapes()
RETURNS TABLE(brands_reset integer, logs_fixed integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_brands_reset integer;
  v_logs_fixed integer;
BEGIN
  -- Reset brands stuck in scraping mode for over 10 minutes
  UPDATE automated_brands 
  SET scraping_active = false 
  WHERE scraping_active = true
    AND (
      last_scrape_at IS NULL 
      OR last_scrape_at < NOW() - INTERVAL '10 minutes'
    );
  GET DIAGNOSTICS v_brands_reset = ROW_COUNT;
  
  -- Mark stuck sync logs as failed
  UPDATE brand_sync_logs 
  SET 
    status = 'failed',
    completed_at = NOW(),
    error_details = jsonb_build_object('error', 'Timeout - auto-cleaned by cleanup_stuck_scrapes')
  WHERE status = 'running' 
    AND started_at < NOW() - INTERVAL '10 minutes';
  GET DIAGNOSTICS v_logs_fixed = ROW_COUNT;
  
  RETURN QUERY SELECT v_brands_reset, v_logs_fixed;
END;
$$;