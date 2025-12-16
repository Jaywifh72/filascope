-- Add enrichment tracking columns to automated_brands
ALTER TABLE public.automated_brands 
ADD COLUMN IF NOT EXISTS products_with_images integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS products_with_tds integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS products_with_mpn integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS products_with_codes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS products_with_color_hex integer DEFAULT 0;

-- Create function to update enrichment counts for a brand
CREATE OR REPLACE FUNCTION public.update_brand_enrichment_counts(p_brand_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_brand_name text;
BEGIN
  -- Get the brand name from slug
  SELECT brand_name INTO v_brand_name
  FROM automated_brands
  WHERE brand_slug = p_brand_slug;

  IF v_brand_name IS NULL THEN
    RAISE NOTICE 'Brand not found for slug: %', p_brand_slug;
    RETURN;
  END IF;

  -- Update the enrichment counts
  UPDATE automated_brands
  SET 
    products_with_images = (
      SELECT COUNT(*) FROM filaments 
      WHERE LOWER(vendor) = LOWER(v_brand_name) 
      AND featured_image IS NOT NULL
    ),
    products_with_tds = (
      SELECT COUNT(*) FROM filaments 
      WHERE LOWER(vendor) = LOWER(v_brand_name) 
      AND tds_url IS NOT NULL
    ),
    products_with_mpn = (
      SELECT COUNT(*) FROM filaments 
      WHERE LOWER(vendor) = LOWER(v_brand_name) 
      AND mpn IS NOT NULL
    ),
    products_with_codes = (
      SELECT COUNT(*) FROM filaments 
      WHERE LOWER(vendor) = LOWER(v_brand_name) 
      AND (upc IS NOT NULL OR ean IS NOT NULL OR gtin IS NOT NULL)
    ),
    products_with_color_hex = (
      SELECT COUNT(*) FROM filaments 
      WHERE LOWER(vendor) = LOWER(v_brand_name) 
      AND color_hex IS NOT NULL
    )
  WHERE brand_slug = p_brand_slug;
END;
$$;

-- Populate initial enrichment counts for all brands
UPDATE automated_brands ab
SET 
  products_with_images = COALESCE(counts.with_images, 0),
  products_with_tds = COALESCE(counts.with_tds, 0),
  products_with_mpn = COALESCE(counts.with_mpn, 0),
  products_with_codes = COALESCE(counts.with_codes, 0),
  products_with_color_hex = COALESCE(counts.with_color_hex, 0)
FROM (
  SELECT 
    LOWER(vendor) as vendor_lower,
    COUNT(CASE WHEN featured_image IS NOT NULL THEN 1 END) as with_images,
    COUNT(CASE WHEN tds_url IS NOT NULL THEN 1 END) as with_tds,
    COUNT(CASE WHEN mpn IS NOT NULL THEN 1 END) as with_mpn,
    COUNT(CASE WHEN upc IS NOT NULL OR ean IS NOT NULL OR gtin IS NOT NULL THEN 1 END) as with_codes,
    COUNT(CASE WHEN color_hex IS NOT NULL THEN 1 END) as with_color_hex
  FROM filaments 
  GROUP BY LOWER(vendor)
) counts
WHERE LOWER(ab.brand_name) = counts.vendor_lower;