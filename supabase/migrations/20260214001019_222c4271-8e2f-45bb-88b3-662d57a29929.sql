
-- RPC: Get affiliate clicks grouped by day with optional brand/region filters
CREATE OR REPLACE FUNCTION public.get_affiliate_clicks_by_day(
  p_start_date date,
  p_end_date date,
  p_brand_names text[] DEFAULT NULL,
  p_region_codes text[] DEFAULT NULL
)
RETURNS TABLE(click_date date, brand_name text, click_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT 
    (ac.clicked_at AT TIME ZONE 'UTC')::date AS click_date,
    ac.brand_name,
    COUNT(*) AS click_count
  FROM affiliate_clicks ac
  WHERE ac.clicked_at >= p_start_date::timestamp
    AND ac.clicked_at < (p_end_date + 1)::timestamp
    AND (p_brand_names IS NULL OR ac.brand_name = ANY(p_brand_names))
    AND (p_region_codes IS NULL OR ac.region_code = ANY(p_region_codes))
  GROUP BY click_date, ac.brand_name
  ORDER BY click_date;
$$;

-- RPC: Get affiliate clicks summary stats
CREATE OR REPLACE FUNCTION public.get_affiliate_clicks_summary(
  p_start_date date,
  p_end_date date,
  p_brand_names text[] DEFAULT NULL,
  p_region_codes text[] DEFAULT NULL
)
RETURNS TABLE(total_clicks bigint, unique_sessions bigint, top_brand text, top_source_page text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH filtered AS (
    SELECT * FROM affiliate_clicks ac
    WHERE ac.clicked_at >= p_start_date::timestamp
      AND ac.clicked_at < (p_end_date + 1)::timestamp
      AND (p_brand_names IS NULL OR ac.brand_name = ANY(p_brand_names))
      AND (p_region_codes IS NULL OR ac.region_code = ANY(p_region_codes))
  )
  SELECT
    COUNT(*)::bigint AS total_clicks,
    COUNT(DISTINCT session_id)::bigint AS unique_sessions,
    (SELECT f2.brand_name FROM filtered f2 GROUP BY f2.brand_name ORDER BY COUNT(*) DESC LIMIT 1) AS top_brand,
    (SELECT f3.source_page FROM filtered f3 GROUP BY f3.source_page ORDER BY COUNT(*) DESC LIMIT 1) AS top_source_page
  FROM filtered;
$$;
