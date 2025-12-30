
-- Fix: Recreate the view without SECURITY DEFINER (use SECURITY INVOKER which is default)
DROP VIEW IF EXISTS public.v_filaments_normalized;

CREATE VIEW public.v_filaments_normalized 
WITH (security_invoker = true) AS
SELECT 
  f.id,
  f.product_id,
  f.product_title,
  f.product_handle,
  f.vendor,
  f.variant_price,
  f.variant_available,
  f.color_hex,
  f.product_url,
  f.featured_image,
  f.tds_url,
  f.net_weight_g,
  f.diameter_nominal_mm,
  f.nozzle_temp_min_c,
  f.nozzle_temp_max_c,
  f.bed_temp_min_c,
  f.bed_temp_max_c,
  f.product_line_id,
  f.created_at,
  f.updated_at,
  -- Joined lookup data
  m.name AS material_name,
  m.base_type AS material_base_type,
  m.is_composite AS material_is_composite,
  m.requires_hardened_nozzle,
  cf.name AS color_family_name,
  cf.hex_default AS color_family_hex,
  ft.name AS finish_type_name,
  ml.name AS moisture_level_name,
  ml.severity_rank AS moisture_severity,
  -- Brand data
  ab.brand_name,
  ab.display_name AS brand_display_name,
  ab.logo_url AS brand_logo
FROM public.filaments f
LEFT JOIN public.materials m ON f.material_id = m.id
LEFT JOIN public.color_families cf ON f.color_family_id = cf.id
LEFT JOIN public.finish_types ft ON f.finish_type_id = ft.id
LEFT JOIN public.moisture_levels ml ON f.moisture_level_id = ml.id
LEFT JOIN public.automated_brands ab ON f.brand_id = ab.id;

-- Grant access to the view
GRANT SELECT ON public.v_filaments_normalized TO anon, authenticated;
