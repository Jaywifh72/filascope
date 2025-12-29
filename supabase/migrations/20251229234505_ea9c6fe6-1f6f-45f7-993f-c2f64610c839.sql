-- Create function to find duplicate hex codes within product lines for a vendor
CREATE OR REPLACE FUNCTION find_duplicate_hexes(p_vendor TEXT)
RETURNS TABLE(
  id UUID,
  product_line_id TEXT,
  product_title TEXT,
  color_hex TEXT,
  duplicate_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.product_line_id, f.product_title, f.color_hex, dupes.cnt
  FROM filaments f
  INNER JOIN (
    SELECT fil.product_line_id AS pli, LOWER(fil.color_hex) AS hex_lower, COUNT(*) AS cnt
    FROM filaments fil
    WHERE fil.vendor ILIKE p_vendor 
      AND fil.product_line_id IS NOT NULL 
      AND fil.color_hex IS NOT NULL
    GROUP BY fil.product_line_id, LOWER(fil.color_hex)
    HAVING COUNT(*) > 1
  ) dupes ON f.product_line_id = dupes.pli 
    AND LOWER(f.color_hex) = dupes.hex_lower
  WHERE f.vendor ILIKE p_vendor
  ORDER BY f.product_line_id, f.color_hex;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;