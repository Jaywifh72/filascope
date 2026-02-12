CREATE OR REPLACE FUNCTION public.get_catalog_counts_by_brand()
RETURNS TABLE(vendor_lower text, variant_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    LOWER(REPLACE(REPLACE(vendor, ' ', '-'), '''', '')) AS vendor_lower,
    COUNT(*) AS variant_count
  FROM filaments
  WHERE vendor IS NOT NULL
  GROUP BY vendor;
$$;