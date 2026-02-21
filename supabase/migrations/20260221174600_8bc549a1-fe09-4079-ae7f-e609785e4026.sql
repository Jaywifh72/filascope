
CREATE OR REPLACE FUNCTION public.search_filaments_ranked(
  p_query text,
  p_material_hint text DEFAULT NULL,
  p_region text DEFAULT 'US',
  p_limit integer DEFAULT 48,
  p_offset integer DEFAULT 0,
  p_property_sort_col text DEFAULT NULL,
  p_property_sort_dir text DEFAULT 'desc'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
  v_tsquery tsquery;
  v_has_fts_results boolean;
  v_valid_sort_col text;
BEGIN
  -- Whitelist allowed sort columns to prevent SQL injection
  v_valid_sort_col := CASE p_property_sort_col
    WHEN 'shore_hardness_d' THEN 'shore_hardness_d'
    WHEN 'hardness_shore_a' THEN 'hardness_shore_a'
    WHEN 'tensile_strength_xy_mpa' THEN 'tensile_strength_xy_mpa'
    WHEN 'hdt_18_mpa_c' THEN 'hdt_18_mpa_c'
    WHEN 'print_speed_max_mms' THEN 'print_speed_max_mms'
    WHEN 'density_g_cm3' THEN 'density_g_cm3'
    WHEN 'elongation_break_xy_percent' THEN 'elongation_break_xy_percent'
    ELSE NULL
  END;

  -- Build tsquery from user input
  BEGIN
    v_tsquery := websearch_to_tsquery('english', p_query);
  EXCEPTION WHEN OTHERS THEN
    v_tsquery := NULL;
  END;

  -- Check if FTS yields results
  IF v_tsquery IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM filaments
      WHERE search_vector @@ v_tsquery
        AND material IS NOT NULL
        AND (net_weight_g IS NULL OR net_weight_g >= 300)
      LIMIT 1
    ) INTO v_has_fts_results;
  ELSE
    v_has_fts_results := false;
  END IF;

  WITH
  filtered AS (
    SELECT f.*,
      CASE
        WHEN v_has_fts_results AND v_tsquery IS NOT NULL THEN
          ts_rank_cd(f.search_vector, v_tsquery)
          + CASE WHEN p_material_hint IS NOT NULL AND LOWER(f.material) = LOWER(p_material_hint) THEN 0.5 ELSE 0.0 END
        ELSE 0.0
      END as search_rank
    FROM filaments f
    WHERE f.material IS NOT NULL
      AND (f.net_weight_g IS NULL OR f.net_weight_g >= 300)
      -- Hard material filter when intent parser provides one
      AND (p_material_hint IS NULL OR f.material ILIKE '%' || p_material_hint || '%')
      AND (
        CASE
          -- When material_hint is provided (hard filter), we don't need text match
          WHEN p_material_hint IS NOT NULL THEN true
          WHEN v_has_fts_results AND v_tsquery IS NOT NULL THEN
            f.search_vector @@ v_tsquery
          ELSE
            -- Fallback to ILIKE
            f.product_title ILIKE '%' || p_query || '%'
            OR f.vendor ILIKE '%' || p_query || '%'
            OR f.material ILIKE '%' || p_query || '%'
            OR f.finish_type ILIKE '%' || p_query || '%'
            OR f.display_name ILIKE '%' || p_query || '%'
        END
      )
  ),
  grouped AS (
    SELECT
      COALESCE(f.product_line_id, f.vendor || '::' || f.id::text) as group_key,
      f.product_line_id,
      COUNT(*)::int as variant_count,
      array_agg(DISTINCT f.color_hex) FILTER (WHERE f.color_hex IS NOT NULL) as group_colors,
      array_agg(DISTINCT f.net_weight_g) FILTER (WHERE f.net_weight_g IS NOT NULL) as group_weights,
      MIN(f.variant_price) FILTER (WHERE f.variant_price IS NOT NULL) as group_price_min,
      MAX(f.variant_price) FILTER (WHERE f.variant_price IS NOT NULL) as group_price_max,
      bool_or(COALESCE(f.variant_available, true)) as group_any_in_stock,
      MAX(f.filascope_score) as best_score,
      MAX(f.search_rank) as best_search_rank,
      -- Property sort aggregates
      MIN(f.shore_hardness_d) FILTER (WHERE f.shore_hardness_d IS NOT NULL) as group_shore_d,
      MIN(f.hardness_shore_a) FILTER (WHERE f.hardness_shore_a IS NOT NULL) as group_shore_a,
      MAX(f.tensile_strength_xy_mpa) FILTER (WHERE f.tensile_strength_xy_mpa IS NOT NULL) as group_tensile,
      MAX(f.hdt_18_mpa_c) FILTER (WHERE f.hdt_18_mpa_c IS NOT NULL) as group_hdt,
      MAX(f.print_speed_max_mms) FILTER (WHERE f.print_speed_max_mms IS NOT NULL) as group_speed,
      MIN(f.density_g_cm3) FILTER (WHERE f.density_g_cm3 IS NOT NULL) as group_density,
      MAX(f.elongation_break_xy_percent) FILTER (WHERE f.elongation_break_xy_percent IS NOT NULL) as group_elongation,
      (array_agg(f.id ORDER BY
        CASE WHEN f.featured_image IS NOT NULL THEN 0 ELSE 1 END,
        f.search_rank DESC NULLS LAST, f.filascope_score DESC NULLS LAST, f.variant_price ASC NULLS LAST
      ))[1] as representative_id
    FROM filtered f
    GROUP BY group_key, f.product_line_id
  ),
  sorted AS (
    SELECT g.*, COUNT(*) OVER() as total_groups
    FROM grouped g
    ORDER BY
      CASE WHEN g.group_any_in_stock THEN 0 ELSE 1 END,
      -- Property-based sorting when requested
      CASE WHEN v_valid_sort_col = 'shore_hardness_d' AND p_property_sort_dir = 'asc'
           THEN g.group_shore_d END ASC NULLS LAST,
      CASE WHEN v_valid_sort_col = 'shore_hardness_d' AND p_property_sort_dir = 'desc'
           THEN g.group_shore_d END DESC NULLS LAST,
      CASE WHEN v_valid_sort_col = 'hardness_shore_a' AND p_property_sort_dir = 'asc'
           THEN g.group_shore_a END ASC NULLS LAST,
      CASE WHEN v_valid_sort_col = 'hardness_shore_a' AND p_property_sort_dir = 'desc'
           THEN g.group_shore_a END DESC NULLS LAST,
      CASE WHEN v_valid_sort_col = 'tensile_strength_xy_mpa'
           THEN g.group_tensile END DESC NULLS LAST,
      CASE WHEN v_valid_sort_col = 'hdt_18_mpa_c'
           THEN g.group_hdt END DESC NULLS LAST,
      CASE WHEN v_valid_sort_col = 'print_speed_max_mms'
           THEN g.group_speed END DESC NULLS LAST,
      CASE WHEN v_valid_sort_col = 'density_g_cm3' AND p_property_sort_dir = 'asc'
           THEN g.group_density END ASC NULLS LAST,
      CASE WHEN v_valid_sort_col = 'density_g_cm3' AND p_property_sort_dir = 'desc'
           THEN g.group_density END DESC NULLS LAST,
      CASE WHEN v_valid_sort_col = 'elongation_break_xy_percent'
           THEN g.group_elongation END DESC NULLS LAST,
      -- Fallback to relevance ranking when no property sort
      g.best_search_rank DESC NULLS LAST,
      g.best_score DESC NULLS LAST,
      g.group_price_min ASC NULLS LAST
    LIMIT p_limit OFFSET p_offset
  )
  SELECT jsonb_build_object(
    'total', COALESCE((SELECT total_groups FROM sorted LIMIT 1), 0)::int,
    'items', COALESCE((SELECT jsonb_agg(item ORDER BY item_order) FROM (
      SELECT row_number() OVER() as item_order,
        jsonb_build_object(
          'id', f.id, 'product_title', f.product_title, 'product_handle', f.product_handle,
          'vendor', f.vendor, 'material', f.material, 'color_hex', f.color_hex,
          'color_family', f.color_family, 'variant_price', f.variant_price,
          'variant_compare_at_price', f.variant_compare_at_price,
          'net_weight_g', f.net_weight_g, 'pack_quantity', f.pack_quantity,
          'featured_image', f.featured_image, 'variant_available', f.variant_available,
          'product_line_id', f.product_line_id, 'finish_type', f.finish_type,
          'is_nozzle_abrasive', f.is_nozzle_abrasive, 'high_speed_capable', f.high_speed_capable,
          'product_url', f.product_url, 'product_url_ca', f.product_url_ca,
          'product_url_uk', f.product_url_uk, 'product_url_eu', f.product_url_eu,
          'product_url_au', f.product_url_au, 'product_url_jp', f.product_url_jp,
          'price_cad', f.price_cad, 'price_gbp', f.price_gbp
        ) || jsonb_build_object(
          'price_eur', f.price_eur, 'price_aud', f.price_aud, 'price_jpy', f.price_jpy,
          'last_scraped_at', f.last_scraped_at, 'transmission_distance', f.transmission_distance,
          'nozzle_temp_min_c', f.nozzle_temp_min_c, 'nozzle_temp_max_c', f.nozzle_temp_max_c,
          'bed_temp_min_c', f.bed_temp_min_c, 'bed_temp_max_c', f.bed_temp_max_c,
          'tensile_strength_xy_mpa', f.tensile_strength_xy_mpa, 'density_g_cm3', f.density_g_cm3,
          'ease_of_printing_score', f.ease_of_printing_score, 'strength_index', f.strength_index,
          'printability_index', f.printability_index, 'value_score', f.value_score,
          'diameter_nominal_mm', f.diameter_nominal_mm,
          'print_speed_max_mms', f.print_speed_max_mms, 'display_name', f.display_name,
          'moisture_sensitivity_level', f.moisture_sensitivity_level,
          'brand_id', f.brand_id, 'filascope_score', f.filascope_score, 'tds_url', f.tds_url,
          'variant_count', s.variant_count, 'group_colors', s.group_colors,
          'group_weights', s.group_weights, 'group_price_min', s.group_price_min,
          'group_price_max', s.group_price_max, 'group_any_in_stock', s.group_any_in_stock,
          'shore_hardness_d', f.shore_hardness_d, 'hardness_shore_a', f.hardness_shore_a,
          'hdt_18_mpa_c', f.hdt_18_mpa_c, 'elongation_break_xy_percent', f.elongation_break_xy_percent
        ) as item
      FROM sorted s JOIN filaments f ON f.id = s.representative_id
    ) sub), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$function$;
