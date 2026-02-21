
-- Phase 1a: Add search_vector column + GIN index + trigger

ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE filaments SET search_vector = to_tsvector('english',
  coalesce(product_title,'') || ' ' ||
  coalesce(vendor,'') || ' ' ||
  coalesce(material,'') || ' ' ||
  coalesce(finish_type,'') || ' ' ||
  coalesce(color_family,'') || ' ' ||
  coalesce(display_name,'')
);

CREATE INDEX IF NOT EXISTS idx_filaments_search_vector ON filaments USING gin(search_vector);

CREATE OR REPLACE FUNCTION public.update_filament_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.product_title,'') || ' ' ||
    coalesce(NEW.vendor,'') || ' ' ||
    coalesce(NEW.material,'') || ' ' ||
    coalesce(NEW.finish_type,'') || ' ' ||
    coalesce(NEW.color_family,'') || ' ' ||
    coalesce(NEW.display_name,'')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_search_vector ON filaments;
CREATE TRIGGER trg_update_search_vector
  BEFORE INSERT OR UPDATE OF product_title, vendor, material, finish_type, color_family, display_name
  ON filaments
  FOR EACH ROW
  EXECUTE FUNCTION update_filament_search_vector();

-- Phase 1b: Create search_synonyms table

CREATE TABLE IF NOT EXISTS public.search_synonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL UNIQUE,
  synonyms text[] NOT NULL DEFAULT '{}',
  maps_to_material text,
  maps_to_tag text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.search_synonyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read search synonyms"
  ON public.search_synonyms FOR SELECT
  USING (true);

-- Phase 1c: Create search_filaments_ranked RPC

CREATE OR REPLACE FUNCTION public.search_filaments_ranked(
  p_query text,
  p_material_hint text DEFAULT NULL,
  p_region text DEFAULT 'US',
  p_limit int DEFAULT 48,
  p_offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
  v_tsquery tsquery;
  v_has_fts_results boolean;
BEGIN
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
      AND (
        CASE
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
          'group_price_max', s.group_price_max, 'group_any_in_stock', s.group_any_in_stock
        ) as item
      FROM sorted s JOIN filaments f ON f.id = s.representative_id
    ) sub), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
