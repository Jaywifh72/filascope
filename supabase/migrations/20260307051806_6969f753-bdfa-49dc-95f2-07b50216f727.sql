
CREATE OR REPLACE FUNCTION public.get_brand_filaments_grouped(
  p_brand_name text,
  p_region text DEFAULT 'US',
  p_material text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  WITH filtered AS (
    SELECT *
    FROM filaments f
    WHERE f.vendor ILIKE p_brand_name
      AND (f.net_weight_g IS NULL OR f.net_weight_g >= 300)
      AND (p_material IS NULL OR f.material = p_material)
  ),
  grouped AS (
    SELECT
      COALESCE(f.product_line_id, f.vendor || '::' || f.id::text) AS group_key,
      f.product_line_id,
      COUNT(*) AS variant_count,
      array_agg(DISTINCT f.color_family) FILTER (WHERE f.color_family IS NOT NULL) AS group_colors,
      array_agg(DISTINCT f.net_weight_g) FILTER (WHERE f.net_weight_g IS NOT NULL) AS group_weights,
      MIN(f.variant_price) FILTER (WHERE f.variant_price > 0) AS price_min,
      MAX(f.variant_price) FILTER (WHERE f.variant_price > 0) AS price_max,
      (array_agg(f.material ORDER BY f.material NULLS LAST))[1] AS material,
      -- Pick representative: prefer one with image and highest score
      (array_agg(f.id ORDER BY
        CASE WHEN f.featured_image IS NOT NULL THEN 0 ELSE 1 END,
        COALESCE(f.filascope_score, 0) DESC,
        f.display_name NULLS LAST,
        f.product_title
      ))[1] AS representative_id,
      array_agg(f.id) AS variant_ids
    FROM filtered f
    GROUP BY COALESCE(f.product_line_id, f.vendor || '::' || f.id::text), f.product_line_id
  )
  SELECT jsonb_build_object(
    'total', (SELECT COUNT(*) FROM grouped),
    'items', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'group_key', g.group_key,
          'product_line_id', g.product_line_id,
          'material', g.material,
          'variant_count', g.variant_count,
          'group_colors', g.group_colors,
          'group_weights', g.group_weights,
          'price_min', g.price_min,
          'price_max', g.price_max,
          'representative_id', g.representative_id,
          'variant_ids', g.variant_ids,
          'representative', row_to_json(f.*)
        )
        ORDER BY g.material NULLS LAST, COALESCE(f.display_name, f.product_title)
      )
      FROM grouped g
      JOIN filaments f ON f.id = g.representative_id
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$function$;
