
CREATE OR REPLACE FUNCTION public.get_td_coverage_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total bigint;
  v_with_td bigint;
  v_ref_count bigint;
  v_by_material jsonb;
  v_by_brand jsonb;
  v_top_gaps_brand jsonb;
  v_top_gaps_material jsonb;
  v_recent_logs jsonb;
BEGIN
  -- Overall counts
  SELECT COUNT(*), COUNT(transmission_distance)
  INTO v_total, v_with_td
  FROM filaments;

  -- Reference count
  SELECT COUNT(*) INTO v_ref_count FROM td_reference_values;

  -- By material (top 15)
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  INTO v_by_material
  FROM (
    SELECT 
      COALESCE(material, 'Unknown') as material,
      COUNT(*)::int as total,
      COUNT(transmission_distance)::int as with_td,
      ROUND(COUNT(transmission_distance)::numeric / NULLIF(COUNT(*), 0) * 100, 1)::numeric as pct
    FROM filaments
    GROUP BY material
    ORDER BY COUNT(*) DESC
    LIMIT 15
  ) t;

  -- By brand (top 10)
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  INTO v_by_brand
  FROM (
    SELECT 
      COALESCE(vendor, 'Unknown') as brand,
      COUNT(*)::int as total,
      COUNT(transmission_distance)::int as with_td,
      ROUND(COUNT(transmission_distance)::numeric / NULLIF(COUNT(*), 0) * 100, 1)::numeric as pct
    FROM filaments
    GROUP BY vendor
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) t;

  -- Top 5 brands with most missing TD
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  INTO v_top_gaps_brand
  FROM (
    SELECT 
      COALESCE(vendor, 'Unknown') as brand,
      COUNT(*)::int as total,
      (COUNT(*) - COUNT(transmission_distance))::int as missing
    FROM filaments
    GROUP BY vendor
    ORDER BY (COUNT(*) - COUNT(transmission_distance)) DESC
    LIMIT 5
  ) t;

  -- Top 5 materials with lowest coverage (that have >10 filaments)
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  INTO v_top_gaps_material
  FROM (
    SELECT 
      COALESCE(material, 'Unknown') as material,
      COUNT(*)::int as total,
      (COUNT(*) - COUNT(transmission_distance))::int as missing,
      ROUND(COUNT(transmission_distance)::numeric / NULLIF(COUNT(*), 0) * 100, 1)::numeric as pct
    FROM filaments
    GROUP BY material
    HAVING COUNT(*) > 10
    ORDER BY (COUNT(transmission_distance)::numeric / NULLIF(COUNT(*), 0)) ASC
    LIMIT 5
  ) t;

  -- Recent logs (last 10 entries)
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  INTO v_recent_logs
  FROM (
    SELECT 
      created_at,
      source,
      confidence,
      status,
      td_value,
      notes
    FROM td_population_log
    ORDER BY created_at DESC
    LIMIT 50
  ) t;

  RETURN jsonb_build_object(
    'total_filaments', v_total,
    'with_td', v_with_td,
    'missing_td', v_total - v_with_td,
    'coverage_pct', CASE WHEN v_total > 0 THEN ROUND(v_with_td::numeric / v_total * 100, 1) ELSE 0 END,
    'reference_count', v_ref_count,
    'by_material', v_by_material,
    'by_brand', v_by_brand,
    'top_gaps_brand', v_top_gaps_brand,
    'top_gaps_material', v_top_gaps_material,
    'recent_logs', v_recent_logs
  );
END;
$function$;
