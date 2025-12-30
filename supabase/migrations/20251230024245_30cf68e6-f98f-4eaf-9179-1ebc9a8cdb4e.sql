-- =============================================
-- PHASE 1: Create filament_listings table
-- =============================================

-- Marketplace listings: one filament can have many retailer listings
CREATE TABLE public.filament_listings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys
    filament_id uuid NOT NULL REFERENCES public.filaments(id) ON DELETE CASCADE,
    retailer_id uuid NOT NULL REFERENCES public.retailers(id) ON DELETE CASCADE,
    
    -- Listing details
    product_url text NOT NULL,
    affiliate_url text,
    sku text,
    
    -- Pricing
    current_price numeric(10,2),
    compare_at_price numeric(10,2),
    currency text NOT NULL DEFAULT 'USD',
    region text NOT NULL DEFAULT 'US',
    
    -- Availability
    available boolean DEFAULT true,
    stock_level text,
    ships_from text,
    
    -- Scraping metadata
    last_scraped_at timestamptz,
    scrape_source text,
    scrape_status text DEFAULT 'pending',
    
    -- Priority & display
    is_primary boolean DEFAULT false,
    display_order integer DEFAULT 100,
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Constraints
    UNIQUE(filament_id, retailer_id, region)
);

-- Indexes for common queries
CREATE INDEX idx_listings_filament ON filament_listings(filament_id);
CREATE INDEX idx_listings_retailer ON filament_listings(retailer_id);
CREATE INDEX idx_listings_available ON filament_listings(available) WHERE available = true;
CREATE INDEX idx_listings_price ON filament_listings(current_price) WHERE current_price IS NOT NULL;
CREATE INDEX idx_listings_region ON filament_listings(region);

-- =============================================
-- PHASE 2: Create listing_price_history table
-- =============================================

CREATE TABLE public.listing_price_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid NOT NULL REFERENCES public.filament_listings(id) ON DELETE CASCADE,
    
    price numeric(10,2) NOT NULL,
    compare_at_price numeric(10,2),
    available boolean,
    currency text NOT NULL DEFAULT 'USD',
    
    recorded_at timestamptz DEFAULT now(),
    source text
);

CREATE INDEX idx_listing_history_listing ON listing_price_history(listing_id);
CREATE INDEX idx_listing_history_date ON listing_price_history(recorded_at DESC);

-- =============================================
-- PHASE 3: Enable RLS and create policies
-- =============================================

ALTER TABLE public.filament_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_price_history ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Listings publicly readable"
ON public.filament_listings
FOR SELECT
USING (true);

CREATE POLICY "Listing history publicly readable"
ON public.listing_price_history
FOR SELECT
USING (true);

-- Admin-only write access for filament_listings
CREATE POLICY "Admins can insert listings"
ON public.filament_listings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update listings"
ON public.filament_listings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete listings"
ON public.filament_listings
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only insert for price history
CREATE POLICY "Admins can insert listing history"
ON public.listing_price_history
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PHASE 4: Create triggers and functions
-- =============================================

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_listing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_listing_updated
BEFORE UPDATE ON filament_listings
FOR EACH ROW EXECUTE FUNCTION update_listing_timestamp();

-- Auto-log price changes
CREATE OR REPLACE FUNCTION log_listing_price_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.current_price IS DISTINCT FROM NEW.current_price 
       OR OLD.available IS DISTINCT FROM NEW.available THEN
        INSERT INTO listing_price_history (
            listing_id, price, compare_at_price, available, currency, source
        ) VALUES (
            NEW.id, 
            COALESCE(NEW.current_price, 0),
            NEW.compare_at_price,
            NEW.available,
            NEW.currency,
            COALESCE(NEW.scrape_source, 'system')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_log_listing_price
AFTER UPDATE ON filament_listings
FOR EACH ROW EXECUTE FUNCTION log_listing_price_change();

-- Get best price function
CREATE OR REPLACE FUNCTION get_best_listing(
    _filament_id uuid,
    _region text DEFAULT 'US',
    _currency text DEFAULT 'USD'
)
RETURNS TABLE (
    listing_id uuid,
    retailer_name text,
    retailer_slug text,
    current_price numeric,
    product_url text,
    available boolean
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        fl.id,
        r.name,
        r.slug,
        fl.current_price,
        fl.product_url,
        fl.available
    FROM filament_listings fl
    JOIN retailers r ON r.id = fl.retailer_id
    WHERE fl.filament_id = _filament_id
      AND fl.region = _region
      AND fl.currency = _currency
      AND fl.available = true
      AND fl.current_price IS NOT NULL
    ORDER BY fl.current_price ASC
    LIMIT 1;
$$;

-- =============================================
-- PHASE 5: Create denormalized view
-- =============================================

CREATE OR REPLACE VIEW v_filament_listings AS
SELECT 
    fl.id AS listing_id,
    fl.filament_id,
    f.product_title,
    f.vendor AS brand,
    f.material,
    f.color_hex,
    f.transmission_distance,
    f.net_weight_g,
    
    -- Retailer info
    fl.retailer_id,
    r.name AS retailer_name,
    r.slug AS retailer_slug,
    r.logo_url AS retailer_logo,
    r.trust_score AS retailer_trust_score,
    
    -- Pricing
    fl.current_price,
    fl.compare_at_price,
    fl.currency,
    fl.region,
    fl.available,
    fl.stock_level,
    
    -- URLs
    fl.product_url,
    fl.affiliate_url,
    
    -- Computed: price per kg
    CASE 
        WHEN f.net_weight_g > 0 THEN 
            ROUND((fl.current_price / f.net_weight_g) * 1000, 2)
        ELSE NULL
    END AS price_per_kg,
    
    -- Metadata
    fl.is_primary,
    fl.last_scraped_at,
    fl.scrape_status
    
FROM filament_listings fl
JOIN filaments f ON f.id = fl.filament_id
JOIN retailers r ON r.id = fl.retailer_id;