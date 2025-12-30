-- Fix the view to use SECURITY INVOKER (default) explicitly
DROP VIEW IF EXISTS v_filament_listings;

CREATE VIEW v_filament_listings 
WITH (security_invoker = true)
AS
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