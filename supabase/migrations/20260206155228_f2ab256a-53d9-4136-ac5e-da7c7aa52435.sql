-- View: prioritized list of product lines missing temperature data
-- Groups by product_line_id so you see one row per product line, not per color variant
CREATE OR REPLACE VIEW public.v_missing_temp_data AS
SELECT 
  product_line_id,
  vendor,
  material,
  MIN(product_title) AS sample_title,
  COUNT(*) AS variant_count,
  -- Which temps are missing (across the line)
  BOOL_AND(nozzle_temp_min_c IS NULL) AS all_missing_nozzle_min,
  BOOL_AND(nozzle_temp_max_c IS NULL) AS all_missing_nozzle_max,
  BOOL_AND(bed_temp_min_c IS NULL) AS all_missing_bed_min,
  BOOL_AND(bed_temp_max_c IS NULL) AS all_missing_bed_max,
  -- Count of individual NULL fields for severity ranking
  COUNT(*) FILTER (WHERE nozzle_temp_min_c IS NULL) AS null_nozzle_min_count,
  COUNT(*) FILTER (WHERE bed_temp_min_c IS NULL) AS null_bed_min_count,
  -- Use variant_count as a proxy for popularity (more variants = more popular product line)
  MIN(product_url) AS sample_url,
  MIN(product_handle) AS sample_handle
FROM filaments
WHERE 
  nozzle_temp_min_c IS NULL 
  OR nozzle_temp_max_c IS NULL 
  OR bed_temp_min_c IS NULL 
  OR bed_temp_max_c IS NULL
GROUP BY product_line_id, vendor, material
ORDER BY variant_count DESC;