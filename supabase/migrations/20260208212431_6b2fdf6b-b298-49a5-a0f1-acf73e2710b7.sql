
-- Fix search_filaments_paginated: split jsonb_build_object to stay under 100 arg limit
CREATE OR REPLACE FUNCTION public.search_filaments_paginated(
  p_search TEXT DEFAULT NULL, p_materials TEXT[] DEFAULT NULL,
  p_brands TEXT[] DEFAULT NULL, p_sort TEXT DEFAULT 'scoring-desc',
  p_page_size INT DEFAULT 48, p_offset INT DEFAULT 0,
  p_region TEXT DEFAULT 'US', p_high_speed BOOLEAN DEFAULT FALSE,
  p_brass_only BOOLEAN DEFAULT FALSE, p_ams_only BOOLEAN DEFAULT FALSE,
  p_matte BOOLEAN DEFAULT FALSE, p_silk BOOLEAN DEFAULT FALSE,
  p_metallic BOOLEAN DEFAULT FALSE, p_sparkle BOOLEAN DEFAULT FALSE,
  p_translucent_filter BOOLEAN DEFAULT FALSE, p_glow BOOLEAN DEFAULT FALSE,
  p_carbon_fiber BOOLEAN DEFAULT FALSE, p_glass_fiber BOOLEAN DEFAULT FALSE,
  p_wood_filled BOOLEAN DEFAULT FALSE, p_large_spools BOOLEAN DEFAULT FALSE,
  p_has_td BOOLEAN DEFAULT FALSE, p_price_min NUMERIC DEFAULT NULL,
  p_price_max NUMERIC DEFAULT NULL, p_color_families TEXT[] DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
  v_regional_brands TEXT[] := ARRAY['bambu lab','polymaker','creality','anycubic','elegoo','qidi','flashforge','kingroon','artillery'];
BEGIN
  WITH 
  filtered AS (
    SELECT f.*
    FROM filaments f
    WHERE f.material IS NOT NULL
      AND (f.net_weight_g IS NULL OR f.net_weight_g >= 300)
      AND (p_search IS NULL OR p_search = '' OR (
        f.product_title ILIKE '%' || p_search || '%'
        OR f.vendor ILIKE '%' || p_search || '%'
        OR f.material ILIKE '%' || p_search || '%'
        OR f.finish_type ILIKE '%' || p_search || '%'
        OR f.display_name ILIKE '%' || p_search || '%'))
      AND (p_materials IS NULL OR f.material = ANY(p_materials))
      AND (p_brands IS NULL OR f.vendor = ANY(p_brands))
      AND (p_price_min IS NULL OR f.variant_price >= p_price_min)
      AND (p_price_max IS NULL OR f.variant_price <= p_price_max)
      AND (NOT p_high_speed OR f.high_speed_capable = true OR f.product_title ILIKE '%high speed%' OR f.material ILIKE '%-HS%')
      AND (NOT p_brass_only OR f.is_nozzle_abrasive = false)
      AND (NOT p_large_spools OR (f.net_weight_g IS NOT NULL AND f.net_weight_g >= 1000))
      AND (NOT p_has_td OR f.transmission_distance IS NOT NULL)
      AND (NOT p_matte OR LOWER(f.finish_type) = 'matte' OR f.product_title ILIKE '%matte%')
      AND (NOT p_silk OR f.finish_type ILIKE '%silk%' OR f.finish_type ILIKE '%shimmer%' OR f.product_title ILIKE '%silk%')
      AND (NOT p_metallic OR f.finish_type ILIKE '%metallic%' OR f.finish_type ILIKE '%metal%' OR f.product_title ILIKE '%metallic%')
      AND (NOT p_sparkle OR f.finish_type ILIKE '%sparkle%' OR f.finish_type ILIKE '%glitter%' OR f.finish_type ILIKE '%galaxy%' OR f.product_title ILIKE '%sparkle%' OR f.product_title ILIKE '%glitter%')
      AND (NOT p_translucent_filter OR f.finish_type ILIKE '%translucent%' OR f.finish_type ILIKE '%transparent%' OR f.product_title ILIKE '%translucent%')
      AND (NOT p_glow OR f.material ILIKE '%glow%' OR f.product_title ILIKE '%glow%')
      AND (NOT p_carbon_fiber OR f.finish_type = 'Carbon' OR (f.carbon_fiber_percentage IS NOT NULL AND f.carbon_fiber_percentage > 0))
      AND (NOT p_glass_fiber OR f.finish_type ILIKE '%glass%' OR (f.glass_fiber_percentage IS NOT NULL AND f.glass_fiber_percentage > 0))
      AND (NOT p_wood_filled OR f.finish_type = 'Wood' OR (f.wood_powder_percentage IS NOT NULL AND f.wood_powder_percentage > 0) OR f.product_title ILIKE '%wood%')
      AND (NOT p_ams_only OR (f.material IS NOT NULL AND (
        UPPER(f.material) LIKE '%PLA%' OR UPPER(f.material) LIKE '%PETG%' OR UPPER(f.material) LIKE '%ABS%'
        OR UPPER(f.material) LIKE '%ASA%' OR UPPER(f.material) LIKE '%TPU%' OR UPPER(f.material) LIKE '%HIPS%')
        AND UPPER(f.material) NOT LIKE '%PEEK%' AND UPPER(f.material) NOT LIKE '%PPS%'
        AND UPPER(f.material) NOT LIKE '%85A%' AND UPPER(f.material) NOT LIKE '%80A%' AND UPPER(f.material) NOT LIKE '%75A%'))
      AND (p_color_families IS NULL OR (f.color_family IS NOT NULL AND f.color_family = ANY(p_color_families)))
      AND (p_region = 'US' OR NOT (LOWER(COALESCE(f.vendor,'')) = ANY(v_regional_brands))
        OR (p_region = 'CA' AND f.product_url_ca IS NOT NULL)
        OR (p_region = 'UK' AND f.product_url_uk IS NOT NULL)
        OR (p_region = 'EU' AND f.product_url_eu IS NOT NULL)
        OR (p_region = 'AU' AND f.product_url_au IS NOT NULL)
        OR (p_region = 'JP' AND f.product_url_jp IS NOT NULL))
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
      MIN(f.product_title) as first_title,
      MAX(f.strength_index) as best_strength,
      MAX(f.printability_index) as best_printability,
      MAX(f.transmission_distance) as best_td,
      (array_agg(f.id ORDER BY 
        CASE WHEN f.featured_image IS NOT NULL THEN 0 ELSE 1 END,
        f.filascope_score DESC NULLS LAST, f.variant_price ASC NULLS LAST
      ))[1] as representative_id
    FROM filtered f
    GROUP BY group_key, f.product_line_id
  ),
  sorted AS (
    SELECT g.*, COUNT(*) OVER() as total_groups
    FROM grouped g
    ORDER BY
      CASE WHEN p_sort IN ('scoring-desc','scoring-asc') THEN
        CASE WHEN g.group_any_in_stock THEN 0 ELSE 1 END ELSE 0 END,
      CASE WHEN p_sort = 'scoring-desc' THEN g.best_score END DESC NULLS LAST,
      CASE WHEN p_sort = 'scoring-asc' THEN g.best_score END ASC NULLS LAST,
      CASE WHEN p_sort = 'price-asc' THEN g.group_price_min END ASC NULLS LAST,
      CASE WHEN p_sort = 'price-desc' THEN g.group_price_min END DESC NULLS LAST,
      CASE WHEN p_sort = 'alpha-asc' THEN g.first_title END ASC,
      CASE WHEN p_sort = 'alpha-desc' THEN g.first_title END DESC,
      CASE WHEN p_sort = 'strength-desc' THEN g.best_strength END DESC NULLS LAST,
      CASE WHEN p_sort = 'print-desc' THEN g.best_printability END DESC NULLS LAST,
      CASE WHEN p_sort = 'td-desc' THEN g.best_td END DESC NULLS LAST,
      g.group_price_min ASC NULLS LAST
    LIMIT p_page_size OFFSET p_offset
  )
  SELECT jsonb_build_object(
    'total', COALESCE((SELECT total_groups FROM sorted LIMIT 1), 0)::int,
    'items', COALESCE((SELECT jsonb_agg(item ORDER BY item_order) FROM (
      SELECT row_number() OVER() as item_order,
        -- Split into two objects to stay under 100-arg limit, then merge with ||
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
          'group_price_max', s.group_price_max, 'group_any_in_stock', s.group_any_in_stock
        ) as item
      FROM sorted s JOIN filaments f ON f.id = s.representative_id
    ) sub), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$$;
