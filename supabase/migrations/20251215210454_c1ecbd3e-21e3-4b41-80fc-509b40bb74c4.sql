-- ============================================================================
-- COMPLETE DATABASE SCHEMA FOR AUTOMATED BRAND SCRAPING
-- ============================================================================

-- ============================================================================
-- 1. ADD MISSING COLUMNS TO AUTOMATED_BRANDS TABLE
-- ============================================================================

-- Discovery & API settings
ALTER TABLE public.automated_brands ADD COLUMN IF NOT EXISTS products_url text;
ALTER TABLE public.automated_brands ADD COLUMN IF NOT EXISTS auto_create_products boolean DEFAULT true;
ALTER TABLE public.automated_brands ADD COLUMN IF NOT EXISTS scrape_schedule text DEFAULT 'daily';
ALTER TABLE public.automated_brands ADD COLUMN IF NOT EXISTS api_endpoint text;
ALTER TABLE public.automated_brands ADD COLUMN IF NOT EXISTS auth_type text;
ALTER TABLE public.automated_brands ADD COLUMN IF NOT EXISTS batch_size integer DEFAULT 50;

-- Additional selectors for scraping
ALTER TABLE public.automated_brands ADD COLUMN IF NOT EXISTS material_selectors jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.automated_brands ADD COLUMN IF NOT EXISTS color_selectors jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.automated_brands ADD COLUMN IF NOT EXISTS weight_selectors jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.automated_brands ADD COLUMN IF NOT EXISTS diameter_selectors jsonb DEFAULT '[]'::jsonb;

-- Product discovery settings
ALTER TABLE public.automated_brands ADD COLUMN IF NOT EXISTS product_url_pattern text;
ALTER TABLE public.automated_brands ADD COLUMN IF NOT EXISTS product_list_selector text;
ALTER TABLE public.automated_brands ADD COLUMN IF NOT EXISTS pagination_enabled boolean DEFAULT false;
ALTER TABLE public.automated_brands ADD COLUMN IF NOT EXISTS max_pages integer DEFAULT 10;

-- Enhanced statistics
ALTER TABLE public.automated_brands ADD COLUMN IF NOT EXISTS products_with_prices integer DEFAULT 0;
ALTER TABLE public.automated_brands ADD COLUMN IF NOT EXISTS products_created integer DEFAULT 0;
ALTER TABLE public.automated_brands ADD COLUMN IF NOT EXISTS products_updated integer DEFAULT 0;

-- ============================================================================
-- 2. CREATE BRAND_SYNC_LOGS TABLE (Enhanced sync history)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.brand_sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid REFERENCES public.automated_brands(id) ON DELETE CASCADE,
  brand_slug text NOT NULL,
  
  -- Sync Details
  sync_type text NOT NULL CHECK (sync_type IN ('full_scrape', 'update_only', 'discovery', 'manual')),
  status text NOT NULL CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  started_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  duration_seconds numeric,
  
  -- Results
  products_discovered integer DEFAULT 0,
  products_created integer DEFAULT 0,
  products_updated integer DEFAULT 0,
  products_failed integer DEFAULT 0,
  price_changes integer DEFAULT 0,
  
  -- Details
  success_details jsonb,
  error_details jsonb,
  products_processed jsonb,
  
  -- Metadata
  triggered_by text,
  triggered_by_user uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on brand_sync_logs
ALTER TABLE public.brand_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brand_sync_logs
CREATE POLICY "Admins can manage brand sync logs"
ON public.brand_sync_logs
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Brand sync logs publicly readable"
ON public.brand_sync_logs
FOR SELECT
USING (true);

-- Indexes for brand_sync_logs
CREATE INDEX IF NOT EXISTS idx_brand_sync_logs_brand ON public.brand_sync_logs(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_sync_logs_slug ON public.brand_sync_logs(brand_slug);
CREATE INDEX IF NOT EXISTS idx_brand_sync_logs_started ON public.brand_sync_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_brand_sync_logs_status ON public.brand_sync_logs(status);

-- ============================================================================
-- 3. CREATE PRODUCT_DISCOVERY_QUEUE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_discovery_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid REFERENCES public.automated_brands(id) ON DELETE CASCADE,
  brand_slug text NOT NULL,
  
  -- Product Info
  product_url text NOT NULL,
  product_handle text,
  product_title text,
  
  -- Discovery
  discovered_at timestamptz DEFAULT now(),
  discovery_method text,
  
  -- Processing Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  priority integer DEFAULT 5,
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  last_attempt_at timestamptz,
  next_attempt_at timestamptz,
  
  -- Results
  filament_id text,
  error_message text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_discovery_product_url UNIQUE(product_url)
);

-- Enable RLS on product_discovery_queue
ALTER TABLE public.product_discovery_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_discovery_queue (admin only)
CREATE POLICY "Admins can manage discovery queue"
ON public.product_discovery_queue
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes for product_discovery_queue
CREATE INDEX IF NOT EXISTS idx_discovery_queue_brand ON public.product_discovery_queue(brand_id);
CREATE INDEX IF NOT EXISTS idx_discovery_queue_status ON public.product_discovery_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_discovery_queue_next_attempt ON public.product_discovery_queue(next_attempt_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_discovery_queue_brand_slug ON public.product_discovery_queue(brand_slug);

-- ============================================================================
-- 4. ADD MISSING COLUMNS TO FILAMENTS TABLE
-- ============================================================================

-- Brand linkage
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.automated_brands(id);

-- Scraping metadata
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS auto_created boolean DEFAULT false;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS auto_updated boolean DEFAULT false;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS last_scraped_at timestamptz;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS scrape_frequency_hours integer DEFAULT 24;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS next_scrape_at timestamptz;

-- Indexes for filaments brand columns
CREATE INDEX IF NOT EXISTS idx_filaments_brand_id ON public.filaments(brand_id);
CREATE INDEX IF NOT EXISTS idx_filaments_auto_created ON public.filaments(auto_created) WHERE auto_created = true;
CREATE INDEX IF NOT EXISTS idx_filaments_next_scrape ON public.filaments(next_scrape_at) WHERE next_scrape_at IS NOT NULL;

-- ============================================================================
-- 5. FUNCTIONS FOR BRAND AUTOMATION
-- ============================================================================

-- Function: Link existing filaments to brands by vendor name
CREATE OR REPLACE FUNCTION public.link_filaments_to_brands()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE filaments f
  SET brand_id = ab.id
  FROM automated_brands ab
  WHERE LOWER(f.vendor) = LOWER(ab.brand_name)
    AND f.brand_id IS NULL;
END;
$$;

-- Function: Complete brand scrape with full stats
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
SET search_path = public
AS $$
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
  
  -- Update brand statistics
  UPDATE automated_brands
  SET 
    scraping_active = false,
    last_scrape_at = NOW(),
    next_scrape_at = NOW() + (scrape_frequency_hours || ' hours')::interval,
    total_scrapes = total_scrapes + 1,
    successful_scrapes = CASE WHEN p_success THEN successful_scrapes + 1 ELSE successful_scrapes END,
    failed_scrapes = CASE WHEN NOT p_success THEN failed_scrapes + 1 ELSE failed_scrapes END,
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
$$;

-- Function: Update brand product counts (enhanced with prices)
CREATE OR REPLACE FUNCTION public.update_brand_product_counts(p_brand_slug text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_brand_slug IS NOT NULL THEN
    UPDATE automated_brands ab
    SET 
      product_count = counts.total,
      active_product_count = counts.active,
      products_with_urls = counts.with_urls,
      products_with_prices = counts.with_prices
    FROM (
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN variant_available = true THEN 1 END) as active,
        COUNT(CASE WHEN product_url IS NOT NULL THEN 1 END) as with_urls,
        COUNT(CASE WHEN variant_price IS NOT NULL THEN 1 END) as with_prices
      FROM filaments
      WHERE LOWER(vendor) = LOWER((SELECT brand_name FROM automated_brands WHERE brand_slug = p_brand_slug))
    ) counts
    WHERE ab.brand_slug = p_brand_slug;
  ELSE
    UPDATE automated_brands ab
    SET 
      product_count = COALESCE(counts.total, 0),
      active_product_count = COALESCE(counts.active, 0),
      products_with_urls = COALESCE(counts.with_urls, 0),
      products_with_prices = COALESCE(counts.with_prices, 0)
    FROM (
      SELECT 
        ab2.id,
        COUNT(f.*) as total,
        COUNT(CASE WHEN f.variant_available = true THEN 1 END) as active,
        COUNT(CASE WHEN f.product_url IS NOT NULL THEN 1 END) as with_urls,
        COUNT(CASE WHEN f.variant_price IS NOT NULL THEN 1 END) as with_prices
      FROM automated_brands ab2
      LEFT JOIN filaments f ON LOWER(f.vendor) = LOWER(ab2.brand_name)
      GROUP BY ab2.id
    ) counts
    WHERE ab.id = counts.id;
  END IF;
END;
$$;

-- Function: Create sync log entry
CREATE OR REPLACE FUNCTION public.create_brand_sync_log(
  p_brand_slug text,
  p_sync_type text DEFAULT 'full_scrape',
  p_triggered_by text DEFAULT 'manual'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_sync_log_id uuid;
BEGIN
  -- Get brand ID
  SELECT id INTO v_brand_id
  FROM automated_brands
  WHERE brand_slug = p_brand_slug;
  
  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Brand not found: %', p_brand_slug;
  END IF;
  
  -- Mark brand as scraping
  UPDATE automated_brands
  SET scraping_active = true
  WHERE brand_slug = p_brand_slug;
  
  -- Create sync log entry
  INSERT INTO brand_sync_logs (brand_id, brand_slug, sync_type, status, triggered_by)
  VALUES (v_brand_id, p_brand_slug, p_sync_type, 'running', p_triggered_by)
  RETURNING id INTO v_sync_log_id;
  
  RETURN v_sync_log_id;
END;
$$;

-- ============================================================================
-- 6. VIEWS FOR MONITORING
-- ============================================================================

-- View: Active brands with stats overview
CREATE OR REPLACE VIEW public.v_brands_overview AS
SELECT 
  ab.id,
  ab.brand_slug,
  ab.brand_name,
  ab.display_name,
  ab.platform_type,
  ab.scraping_enabled,
  ab.scraping_active,
  ab.auto_create_products,
  ab.product_count,
  ab.active_product_count,
  ab.products_with_urls,
  ab.products_with_prices,
  ab.last_scrape_at,
  ab.next_scrape_at,
  ab.total_scrapes,
  ab.successful_scrapes,
  ab.failed_scrapes,
  CASE 
    WHEN ab.total_scrapes > 0 THEN ROUND((ab.successful_scrapes::numeric / ab.total_scrapes) * 100, 1)
    ELSE 0
  END as success_rate_percent,
  ab.products_created,
  ab.products_updated,
  ab.avg_scrape_duration_seconds,
  ab.last_error,
  ab.last_error_at
FROM automated_brands ab
WHERE ab.is_visible = true
ORDER BY ab.display_order, ab.brand_name;

-- View: Recent sync activity
CREATE OR REPLACE VIEW public.v_recent_syncs AS
SELECT 
  bsl.id,
  bsl.brand_slug,
  ab.display_name,
  ab.platform_type,
  bsl.sync_type,
  bsl.status,
  bsl.started_at,
  bsl.completed_at,
  bsl.duration_seconds,
  bsl.products_discovered,
  bsl.products_created,
  bsl.products_updated,
  bsl.products_failed,
  bsl.price_changes,
  bsl.triggered_by,
  bsl.error_details
FROM brand_sync_logs bsl
LEFT JOIN automated_brands ab ON bsl.brand_id = ab.id
ORDER BY bsl.started_at DESC
LIMIT 100;

-- View: Pending discovery queue items
CREATE OR REPLACE VIEW public.v_pending_discoveries AS
SELECT 
  pdq.id,
  pdq.brand_slug,
  ab.display_name as brand_display_name,
  pdq.product_url,
  pdq.product_title,
  pdq.status,
  pdq.priority,
  pdq.attempts,
  pdq.discovered_at,
  pdq.last_attempt_at,
  pdq.error_message
FROM product_discovery_queue pdq
LEFT JOIN automated_brands ab ON pdq.brand_id = ab.id
WHERE pdq.status = 'pending'
ORDER BY pdq.priority DESC, pdq.discovered_at ASC;