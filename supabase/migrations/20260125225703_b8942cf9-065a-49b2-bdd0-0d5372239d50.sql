-- RPC function to get current stored price data for comparison
CREATE OR REPLACE FUNCTION test_price_extraction(p_url text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  -- Get current stored data for the URL
  SELECT jsonb_build_object(
    'url', p_url,
    'filament_id', f.id,
    'product_title', f.product_title,
    'current_db_price', f.variant_price,
    'compare_at_price', f.variant_compare_at_price,
    'last_scraped', f.last_scraped_at,
    'price_source', f.price_source,
    'price_confidence', f.price_confidence,
    'vendor', f.vendor
  )
  INTO v_result
  FROM filaments f
  WHERE f.product_url ILIKE '%' || p_url || '%'
     OR f.product_url = p_url
  LIMIT 1;
  
  RETURN COALESCE(v_result, jsonb_build_object('error', 'filament not found', 'url', p_url));
END;
$$;

-- Grant execute to authenticated users (admin check is inside function)
GRANT EXECUTE ON FUNCTION test_price_extraction TO authenticated;