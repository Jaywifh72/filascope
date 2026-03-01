
CREATE OR REPLACE FUNCTION public.get_td_reference_match_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(row_data) INTO result
  FROM (
    SELECT jsonb_build_object(
      'ref_id', r.id,
      'matched_count', COALESCE(m.matched_count, 0),
      'brand_total', COALESCE(bt.brand_total, 0),
      'brand_with_td', COALESCE(bt.brand_with_td, 0)
    ) AS row_data
    FROM td_reference_values r
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS matched_count
      FROM filaments f
      WHERE LOWER(f.vendor) = LOWER(r.brand_name)
        AND f.transmission_distance = r.td_value
        AND LOWER(COALESCE(f.material, '')) = LOWER(r.material_type)
        AND (
          LOWER(COALESCE(f.color_family, '')) = LOWER(r.color_name)
          OR f.product_title ILIKE '%' || r.color_name || '%'
        )
    ) m ON true
    LEFT JOIN LATERAL (
      SELECT 
        COUNT(*)::int AS brand_total,
        COUNT(f.transmission_distance)::int AS brand_with_td
      FROM filaments f
      WHERE LOWER(f.vendor) = LOWER(r.brand_name)
        AND LOWER(COALESCE(f.material, '')) = LOWER(r.material_type)
    ) bt ON true
  ) sub;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;
