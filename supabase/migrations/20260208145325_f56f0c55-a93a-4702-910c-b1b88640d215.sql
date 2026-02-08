
-- Create a view that joins automated_brands with live filament counts
-- This eliminates count drift between the brand directory and detail pages
CREATE OR REPLACE VIEW public.v_brand_directory AS
SELECT
  ab.id,
  ab.brand_name,
  ab.brand_slug,
  ab.display_name,
  ab.description,
  ab.logo_url,
  ab.website_url,
  ab.featured,
  ab.display_order,
  ab.is_visible,
  ab.color_primary,
  ab.color_secondary,
  ab.active_product_count,
  COALESCE(stats.variant_count, 0)::bigint AS variant_count,
  COALESCE(stats.product_line_count, 0)::bigint AS product_line_count
FROM automated_brands ab
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS variant_count,
    COUNT(DISTINCT product_line_id) AS product_line_count
  FROM filaments f
  WHERE (LOWER(f.vendor) = LOWER(ab.brand_name) 
         OR LOWER(f.vendor) = LOWER(ab.display_name))
    AND (f.net_weight_g IS NULL OR f.net_weight_g >= 300)
) stats ON true
WHERE ab.is_visible = true;

-- Grant access to the view
GRANT SELECT ON public.v_brand_directory TO anon, authenticated;
