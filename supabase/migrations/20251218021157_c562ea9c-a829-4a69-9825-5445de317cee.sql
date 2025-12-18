-- ============================================
-- SCRAPER DATA INTEGRITY MIGRATION
-- Adds CHECK constraints and concurrency controls
-- ============================================

-- ============================================
-- PILLAR 1: CONCURRENCY LOCKING
-- Add timeout tracking for scrape locks
-- ============================================

-- Add scrape timeout column for auto-release
ALTER TABLE automated_brands 
ADD COLUMN IF NOT EXISTS scrape_timeout_at TIMESTAMP WITH TIME ZONE;

-- Update start_brand_scrape to include timeout-based lock release
CREATE OR REPLACE FUNCTION public.start_brand_scrape(p_brand_slug text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_already_active boolean;
  v_timed_out boolean;
BEGIN
  -- Check if already active AND whether it has timed out
  SELECT 
    scraping_active,
    (scrape_timeout_at IS NOT NULL AND scrape_timeout_at < NOW())
  INTO v_already_active, v_timed_out
  FROM automated_brands
  WHERE brand_slug = p_brand_slug AND scraping_enabled = true;
  
  -- If record not found
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- If active and NOT timed out, reject
  IF v_already_active AND NOT COALESCE(v_timed_out, false) THEN
    RAISE NOTICE 'Brand % is already being scraped (lock active)', p_brand_slug;
    RETURN false;
  END IF;
  
  -- Acquire lock with 15-minute timeout
  UPDATE automated_brands
  SET 
    scraping_active = true,
    scrape_timeout_at = NOW() + INTERVAL '15 minutes'
  WHERE brand_slug = p_brand_slug AND scraping_enabled = true;
  
  RETURN true;
END;
$function$;

-- Update complete_brand_scrape to clear timeout
CREATE OR REPLACE FUNCTION public.complete_brand_scrape(
  p_sync_log_id uuid, 
  p_success boolean, 
  p_products_discovered integer DEFAULT 0, 
  p_products_created integer DEFAULT 0, 
  p_products_updated integer DEFAULT 0, 
  p_products_failed integer DEFAULT 0, 
  p_price_changes integer DEFAULT 0, 
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_slug text;
  v_brand_id uuid;
  v_duration numeric;
BEGIN
  -- Get brand info and calculate duration
  SELECT 
    brand_slug, 
    brand_id,
    EXTRACT(EPOCH FROM (NOW() - started_at))
  INTO v_brand_slug, v_brand_id, v_duration
  FROM brand_sync_logs
  WHERE id = p_sync_log_id;
  
  -- Update sync log
  UPDATE brand_sync_logs
  SET 
    status = CASE WHEN p_success THEN 'completed' ELSE 'failed' END,
    completed_at = NOW(),
    duration_seconds = v_duration,
    products_discovered = p_products_discovered,
    products_created = p_products_created,
    products_updated = p_products_updated,
    products_failed = p_products_failed,
    price_changes = p_price_changes,
    error_details = CASE WHEN p_error_message IS NOT NULL 
                    THEN jsonb_build_object('error', p_error_message)
                    ELSE NULL END
  WHERE id = p_sync_log_id;
  
  -- Release lock and update brand statistics
  UPDATE automated_brands
  SET 
    scraping_active = false,
    scrape_timeout_at = NULL,  -- Clear timeout
    last_scrape_at = NOW(),
    next_scrape_at = NOW() + (scrape_frequency_hours || ' hours')::interval,
    total_scrapes = COALESCE(total_scrapes, 0) + 1,
    successful_scrapes = CASE WHEN p_success THEN COALESCE(successful_scrapes, 0) + 1 ELSE COALESCE(successful_scrapes, 0) END,
    failed_scrapes = CASE WHEN NOT p_success THEN COALESCE(failed_scrapes, 0) + 1 ELSE COALESCE(failed_scrapes, 0) END,
    products_created = COALESCE(products_created, 0) + p_products_created,
    products_updated = COALESCE(products_updated, 0) + p_products_updated,
    last_error = CASE WHEN NOT p_success THEN p_error_message ELSE NULL END,
    last_error_at = CASE WHEN NOT p_success THEN NOW() ELSE last_error_at END,
    avg_scrape_duration_seconds = CASE 
      WHEN avg_scrape_duration_seconds IS NULL THEN v_duration
      ELSE (avg_scrape_duration_seconds + v_duration) / 2
    END
  WHERE brand_slug = v_brand_slug;
  
  -- Update product counts for this brand
  PERFORM update_brand_product_counts(v_brand_slug);
END;
$function$;

-- ============================================
-- PILLAR 2: BATCH UPSERT RPC (Atomic Transactions)
-- Single function to upsert filaments atomically
-- ============================================

CREATE OR REPLACE FUNCTION public.batch_upsert_filaments(
  p_products JSONB,
  p_vendor TEXT,
  p_brand_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_product JSONB;
  v_result JSONB := '{"created": 0, "updated": 0, "errors": 0, "error_details": []}'::JSONB;
  v_filament_id UUID;
  v_existing_id UUID;
  v_error_msg TEXT;
BEGIN
  -- Process all products in a single transaction
  FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
  LOOP
    BEGIN
      -- Check if filament already exists
      SELECT id INTO v_existing_id
      FROM filaments
      WHERE product_id = v_product->>'productId'
        AND LOWER(vendor) = LOWER(p_vendor)
      LIMIT 1;
      
      IF v_existing_id IS NOT NULL THEN
        -- UPDATE existing filament
        UPDATE filaments
        SET
          product_title = COALESCE(v_product->>'title', product_title),
          variant_price = COALESCE((v_product->>'price')::NUMERIC, variant_price),
          variant_compare_at_price = COALESCE((v_product->>'compareAtPrice')::NUMERIC, variant_compare_at_price),
          variant_available = COALESCE((v_product->>'available')::BOOLEAN, variant_available),
          product_url = COALESCE(v_product->>'url', product_url),
          featured_image = COALESCE(NULLIF(v_product->>'imageUrl', ''), featured_image),
          mpn = COALESCE(NULLIF(v_product->>'mpn', ''), mpn),
          tds_url = COALESCE(NULLIF(v_product->>'tdsUrl', ''), tds_url),
          color_hex = COALESCE(NULLIF(v_product->>'colorHex', ''), color_hex),
          nozzle_temp_min_c = COALESCE((v_product->>'nozzleTempMin')::INTEGER, nozzle_temp_min_c),
          nozzle_temp_max_c = COALESCE((v_product->>'nozzleTempMax')::INTEGER, nozzle_temp_max_c),
          bed_temp_min_c = COALESCE((v_product->>'bedTempMin')::INTEGER, bed_temp_min_c),
          bed_temp_max_c = COALESCE((v_product->>'bedTempMax')::INTEGER, bed_temp_max_c),
          last_scraped_at = NOW(),
          updated_at = NOW(),
          sync_status = 'synced',
          auto_updated = true
        WHERE id = v_existing_id;
        
        v_result := jsonb_set(v_result, '{updated}', to_jsonb((v_result->>'updated')::INT + 1));
      ELSE
        -- INSERT new filament
        INSERT INTO filaments (
          product_id, product_title, vendor, brand_id,
          variant_price, variant_compare_at_price, variant_available,
          product_url, featured_image, mpn, tds_url, color_hex,
          nozzle_temp_min_c, nozzle_temp_max_c, bed_temp_min_c, bed_temp_max_c,
          diameter_nominal_mm, auto_created, auto_updated, last_scraped_at, sync_status
        ) VALUES (
          v_product->>'productId',
          v_product->>'title',
          p_vendor,
          p_brand_id,
          (v_product->>'price')::NUMERIC,
          (v_product->>'compareAtPrice')::NUMERIC,
          COALESCE((v_product->>'available')::BOOLEAN, true),
          v_product->>'url',
          NULLIF(v_product->>'imageUrl', ''),
          NULLIF(v_product->>'mpn', ''),
          NULLIF(v_product->>'tdsUrl', ''),
          NULLIF(v_product->>'colorHex', ''),
          (v_product->>'nozzleTempMin')::INTEGER,
          (v_product->>'nozzleTempMax')::INTEGER,
          (v_product->>'bedTempMin')::INTEGER,
          (v_product->>'bedTempMax')::INTEGER,
          COALESCE((v_product->>'diameterMm')::NUMERIC, 1.75),
          true,
          true,
          NOW(),
          'synced'
        )
        RETURNING id INTO v_filament_id;
        
        v_result := jsonb_set(v_result, '{created}', to_jsonb((v_result->>'created')::INT + 1));
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
      v_result := jsonb_set(v_result, '{errors}', to_jsonb((v_result->>'errors')::INT + 1));
      v_result := jsonb_set(
        v_result, 
        '{error_details}', 
        (v_result->'error_details') || jsonb_build_array(
          jsonb_build_object('productId', v_product->>'productId', 'error', v_error_msg)
        )
      );
    END;
  END LOOP;
  
  RETURN v_result;
END;
$function$;

-- ============================================
-- PILLAR 4: SQL CHECK CONSTRAINTS
-- Database-level data integrity rules
-- ============================================

-- Price constraints on filaments table
DO $$ 
BEGIN
  -- Drop existing constraints if they exist (to allow re-running)
  ALTER TABLE filaments DROP CONSTRAINT IF EXISTS chk_filaments_price_positive;
  ALTER TABLE filaments DROP CONSTRAINT IF EXISTS chk_filaments_compare_price_positive;
  ALTER TABLE filaments DROP CONSTRAINT IF EXISTS chk_filaments_diameter_valid;
  ALTER TABLE filaments DROP CONSTRAINT IF EXISTS chk_filaments_nozzle_temp_range;
  ALTER TABLE filaments DROP CONSTRAINT IF EXISTS chk_filaments_bed_temp_range;
  ALTER TABLE filaments DROP CONSTRAINT IF EXISTS chk_filaments_weight_positive;
  
  -- Price must be positive and under $10,000
  ALTER TABLE filaments
  ADD CONSTRAINT chk_filaments_price_positive 
  CHECK (variant_price IS NULL OR (variant_price > 0 AND variant_price < 10000));

  ALTER TABLE filaments
  ADD CONSTRAINT chk_filaments_compare_price_positive 
  CHECK (variant_compare_at_price IS NULL OR (variant_compare_at_price > 0 AND variant_compare_at_price < 10000));

  -- Diameter must be a standard filament size
  ALTER TABLE filaments
  ADD CONSTRAINT chk_filaments_diameter_valid 
  CHECK (diameter_nominal_mm IS NULL OR diameter_nominal_mm IN (1.75, 2.85, 3.0));

  -- Nozzle temperature range must be logical (min <= max, within bounds)
  ALTER TABLE filaments
  ADD CONSTRAINT chk_filaments_nozzle_temp_range 
  CHECK (
    (nozzle_temp_min_c IS NULL AND nozzle_temp_max_c IS NULL) OR
    (nozzle_temp_min_c IS NULL) OR
    (nozzle_temp_max_c IS NULL) OR
    (nozzle_temp_min_c <= nozzle_temp_max_c AND
     nozzle_temp_min_c >= 100 AND nozzle_temp_max_c <= 500)
  );

  -- Bed temperature range must be logical
  ALTER TABLE filaments
  ADD CONSTRAINT chk_filaments_bed_temp_range 
  CHECK (
    (bed_temp_min_c IS NULL AND bed_temp_max_c IS NULL) OR
    (bed_temp_min_c IS NULL) OR
    (bed_temp_max_c IS NULL) OR
    (bed_temp_min_c <= bed_temp_max_c AND
     bed_temp_min_c >= 0 AND bed_temp_max_c <= 200)
  );

  -- Weight must be reasonable (1g to 50kg)
  ALTER TABLE filaments
  ADD CONSTRAINT chk_filaments_weight_positive 
  CHECK (net_weight_g IS NULL OR (net_weight_g > 0 AND net_weight_g <= 50000));
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Some constraints may already exist or data violates constraints: %', SQLERRM;
END $$;

-- Price history constraints
DO $$ 
BEGIN
  ALTER TABLE price_history DROP CONSTRAINT IF EXISTS chk_price_history_price_positive;
  ALTER TABLE price_history DROP CONSTRAINT IF EXISTS chk_price_history_compare_positive;
  
  -- Price history must have positive prices
  ALTER TABLE price_history
  ADD CONSTRAINT chk_price_history_price_positive 
  CHECK (price > 0 AND price < 10000);

  -- Compare-at price if present must be positive
  ALTER TABLE price_history
  ADD CONSTRAINT chk_price_history_compare_positive 
  CHECK (compare_at_price IS NULL OR (compare_at_price > 0 AND compare_at_price < 10000));
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Price history constraints issue: %', SQLERRM;
END $$;

-- ============================================
-- HELPER: Cleanup stuck scrapes (enhanced)
-- ============================================

CREATE OR REPLACE FUNCTION public.cleanup_stuck_scrapes()
RETURNS TABLE(brands_reset integer, logs_fixed integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_brands_reset integer;
  v_logs_fixed integer;
BEGIN
  -- Reset brands with expired timeouts OR stuck for over 15 minutes
  UPDATE automated_brands 
  SET 
    scraping_active = false,
    scrape_timeout_at = NULL
  WHERE scraping_active = true
    AND (
      scrape_timeout_at IS NOT NULL AND scrape_timeout_at < NOW()
      OR last_scrape_at IS NULL 
      OR last_scrape_at < NOW() - INTERVAL '15 minutes'
    );
  GET DIAGNOSTICS v_brands_reset = ROW_COUNT;
  
  -- Mark stuck sync logs as failed
  UPDATE brand_sync_logs 
  SET 
    status = 'failed',
    completed_at = NOW(),
    error_details = jsonb_build_object('error', 'Timeout - auto-cleaned by cleanup_stuck_scrapes')
  WHERE status = 'running' 
    AND started_at < NOW() - INTERVAL '15 minutes';
  GET DIAGNOSTICS v_logs_fixed = ROW_COUNT;
  
  RETURN QUERY SELECT v_brands_reset, v_logs_fixed;
END;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.batch_upsert_filaments(JSONB, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.batch_upsert_filaments(JSONB, TEXT, UUID) TO service_role;