-- Add timestamp for tracking when an admin last manually refreshed the price
ALTER TABLE filaments 
  ADD COLUMN IF NOT EXISTS price_last_manual_refresh timestamptz;

-- Add comment for documentation
COMMENT ON COLUMN filaments.price_last_manual_refresh IS 
  'Timestamp of last admin-initiated manual price refresh';

-- Create RPC function for updating filament price after manual refresh
CREATE OR REPLACE FUNCTION update_filament_price_after_refresh(
  p_filament_id uuid,
  p_new_price numeric,
  p_compare_at_price numeric DEFAULT NULL,
  p_currency text DEFAULT 'USD',
  p_source text DEFAULT 'manual'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_row filaments%ROWTYPE;
  v_region text;
BEGIN
  -- Verify the caller is an admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  
  -- Map currency to region for price history
  v_region := CASE p_currency
    WHEN 'USD' THEN 'US'
    WHEN 'CAD' THEN 'CA'
    WHEN 'EUR' THEN 'EU'
    WHEN 'GBP' THEN 'UK'
    WHEN 'AUD' THEN 'AU'
    WHEN 'JPY' THEN 'JP'
    ELSE 'US'
  END;
  
  -- Update the filament record
  UPDATE filaments
  SET 
    variant_price = p_new_price,
    variant_compare_at_price = p_compare_at_price,
    last_scraped_at = NOW(),
    price_last_manual_refresh = NOW(),
    price_source = CASE 
      WHEN p_source = 'manual' THEN 'admin_refresh'
      ELSE p_source
    END,
    updated_at = NOW()
  WHERE id = p_filament_id
  RETURNING * INTO v_updated_row;
  
  -- Check if update was successful
  IF v_updated_row.id IS NULL THEN
    RAISE EXCEPTION 'Filament not found: %', p_filament_id;
  END IF;
  
  -- Insert into price history for tracking
  INSERT INTO price_history (
    filament_id,
    price,
    compare_at_price,
    currency,
    source,
    region,
    recorded_at
  ) VALUES (
    p_filament_id,
    p_new_price,
    p_compare_at_price,
    p_currency,
    'admin_refresh',
    v_region,
    NOW()
  );
  
  -- Return the updated filament data
  RETURN jsonb_build_object(
    'success', true,
    'filament_id', v_updated_row.id,
    'product_title', v_updated_row.product_title,
    'variant_price', v_updated_row.variant_price,
    'variant_compare_at_price', v_updated_row.variant_compare_at_price,
    'price_source', v_updated_row.price_source,
    'last_scraped_at', v_updated_row.last_scraped_at,
    'price_last_manual_refresh', v_updated_row.price_last_manual_refresh
  );
END;
$$;

-- Grant execute permission to authenticated users (admin check is inside function)
GRANT EXECUTE ON FUNCTION update_filament_price_after_refresh TO authenticated;