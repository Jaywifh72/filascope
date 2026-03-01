
CREATE OR REPLACE FUNCTION public.match_td_reference_values(
  p_dry_run BOOLEAN DEFAULT true,
  p_brand_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  filament_id UUID,
  vendor TEXT,
  product_title TEXT,
  color_family TEXT,
  material TEXT,
  ref_brand TEXT,
  ref_color TEXT,
  ref_material TEXT,
  td_value NUMERIC,
  confidence TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If not dry run, apply updates first
  IF NOT p_dry_run THEN
    UPDATE filaments f
    SET transmission_distance = sub.td_value,
        updated_at = NOW()
    FROM (
      SELECT DISTINCT ON (f2.id)
        f2.id,
        r2.td_value
      FROM filaments f2
      JOIN td_reference_values r2 ON (
        f2.vendor ILIKE '%' || r2.brand_name || '%'
        AND f2.color_family ILIKE r2.color_name
        AND (
          (r2.material_type LIKE '% %' AND f2.product_title ILIKE '%' || r2.material_type || '%')
          OR
          (r2.material_type NOT LIKE '% %' AND LOWER(f2.material) = LOWER(r2.material_type))
        )
      )
      WHERE f2.transmission_distance IS NULL
        AND (p_brand_filter IS NULL OR f2.vendor ILIKE '%' || p_brand_filter || '%')
      ORDER BY f2.id, r2.td_value
    ) sub
    WHERE f.id = sub.id;
  END IF;

  -- Return matching results (for dry run this shows what would be matched,
  -- for non-dry run this shows what was just applied)
  RETURN QUERY
  SELECT DISTINCT ON (f.id)
    f.id AS filament_id,
    f.vendor,
    f.product_title,
    f.color_family,
    f.material,
    r.brand_name AS ref_brand,
    r.color_name AS ref_color,
    r.material_type AS ref_material,
    r.td_value,
    CASE
      WHEN f.vendor ILIKE r.brand_name
           AND f.color_family ILIKE r.color_name
           AND f.product_title ILIKE '%' || r.material_type || '%'
      THEN 'high'
      WHEN f.vendor ILIKE '%' || r.brand_name || '%'
           AND f.color_family ILIKE '%' || r.color_name || '%'
      THEN 'medium'
      ELSE 'low'
    END AS confidence
  FROM filaments f
  JOIN td_reference_values r ON (
    f.vendor ILIKE '%' || r.brand_name || '%'
    AND f.color_family ILIKE r.color_name
    AND (
      (r.material_type LIKE '% %' AND f.product_title ILIKE '%' || r.material_type || '%')
      OR
      (r.material_type NOT LIKE '% %' AND LOWER(f.material) = LOWER(r.material_type))
    )
  )
  WHERE (p_dry_run AND f.transmission_distance IS NULL OR NOT p_dry_run)
    AND (p_brand_filter IS NULL OR f.vendor ILIKE '%' || p_brand_filter || '%')
  ORDER BY f.id, confidence;
END;
$$;
