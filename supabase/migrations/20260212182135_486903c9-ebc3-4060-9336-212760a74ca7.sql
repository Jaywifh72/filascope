
CREATE OR REPLACE FUNCTION public.get_filter_counts(
  p_search text DEFAULT NULL,
  p_region text DEFAULT 'US',
  p_materials text[] DEFAULT NULL,
  p_brands text[] DEFAULT NULL,
  p_price_min numeric DEFAULT NULL,
  p_price_max numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  WITH base_filtered AS (
    SELECT f.*
    FROM filaments f
    WHERE f.material IS NOT NULL
      AND (f.net_weight_g IS NULL OR f.net_weight_g >= 300)
      AND (p_search IS NULL OR p_search = '' OR (
        f.product_title ILIKE '%' || p_search || '%' OR f.vendor ILIKE '%' || p_search || '%'
        OR f.material ILIKE '%' || p_search || '%'))
      AND (p_price_min IS NULL OR f.variant_price >= p_price_min)
      AND (p_price_max IS NULL OR f.variant_price <= p_price_max)
      -- Regional filtering REMOVED: all products visible regardless of region
  ),
  material_counts AS (
    SELECT f.material, COUNT(*)::int as cnt FROM base_filtered f
    WHERE f.material IS NOT NULL AND (p_brands IS NULL OR f.vendor = ANY(p_brands))
    GROUP BY f.material
  ),
  brand_counts AS (
    SELECT f.vendor, COUNT(*)::int as cnt FROM base_filtered f
    WHERE f.vendor IS NOT NULL AND (p_materials IS NULL OR f.material = ANY(p_materials))
    GROUP BY f.vendor
  ),
  full_filtered AS (
    SELECT f.* FROM base_filtered f
    WHERE (p_materials IS NULL OR f.material = ANY(p_materials))
      AND (p_brands IS NULL OR f.vendor = ANY(p_brands))
  ),
  bool_counts AS (
    SELECT
      COUNT(*) FILTER (WHERE LOWER(finish_type) = 'matte' OR product_title ILIKE '%matte%')::int as matte,
      COUNT(*) FILTER (WHERE finish_type ILIKE '%silk%' OR finish_type ILIKE '%shimmer%' OR product_title ILIKE '%silk%')::int as silk,
      COUNT(*) FILTER (WHERE finish_type ILIKE '%metallic%' OR finish_type ILIKE '%metal%' OR product_title ILIKE '%metallic%')::int as metallic,
      COUNT(*) FILTER (WHERE finish_type ILIKE '%sparkle%' OR finish_type ILIKE '%glitter%' OR finish_type ILIKE '%galaxy%' OR product_title ILIKE '%sparkle%' OR product_title ILIKE '%glitter%')::int as sparkle,
      COUNT(*) FILTER (WHERE finish_type ILIKE '%translucent%' OR finish_type ILIKE '%transparent%' OR product_title ILIKE '%translucent%')::int as translucent,
      COUNT(*) FILTER (WHERE material ILIKE '%glow%' OR product_title ILIKE '%glow%')::int as glow,
      COUNT(*) FILTER (WHERE finish_type = 'Carbon' OR (carbon_fiber_percentage IS NOT NULL AND carbon_fiber_percentage > 0))::int as carbon_fiber,
      COUNT(*) FILTER (WHERE finish_type ILIKE '%glass%' OR (glass_fiber_percentage IS NOT NULL AND glass_fiber_percentage > 0))::int as glass_fiber,
      COUNT(*) FILTER (WHERE finish_type = 'Wood' OR (wood_powder_percentage IS NOT NULL AND wood_powder_percentage > 0))::int as wood_filled,
      COUNT(*) FILTER (WHERE high_speed_capable = true OR product_title ILIKE '%high speed%')::int as high_speed,
      COUNT(*) FILTER (WHERE is_nozzle_abrasive = false)::int as brass_only,
      COUNT(*) FILTER (WHERE material IS NOT NULL AND (
        UPPER(material) LIKE '%PLA%' OR UPPER(material) LIKE '%PETG%' OR UPPER(material) LIKE '%ABS%'
        OR UPPER(material) LIKE '%ASA%' OR UPPER(material) LIKE '%TPU%' OR UPPER(material) LIKE '%HIPS%')
        AND UPPER(material) NOT LIKE '%PEEK%' AND UPPER(material) NOT LIKE '%PPS%')::int as ams_only,
      COUNT(*) FILTER (WHERE net_weight_g IS NOT NULL AND net_weight_g >= 1000)::int as large_spools,
      COUNT(*) FILTER (WHERE transmission_distance IS NOT NULL)::int as has_td_data,
      COUNT(*)::int as total
    FROM full_filtered
  )
  SELECT jsonb_build_object(
    'materials', COALESCE((SELECT jsonb_object_agg(material, cnt) FROM material_counts), '{}'::jsonb),
    'brands', COALESCE((SELECT jsonb_object_agg(vendor, cnt) FROM brand_counts), '{}'::jsonb),
    'filters', (SELECT row_to_json(bool_counts.*)::jsonb FROM bool_counts),
    'total', (SELECT total FROM bool_counts)
  ) INTO v_result;
  RETURN v_result;
END;
$function$;
