CREATE OR REPLACE FUNCTION public.update_filament_price_after_refresh(
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
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  v_region := CASE p_currency
    WHEN 'USD' THEN 'US'
    WHEN 'CAD' THEN 'CA'
    WHEN 'EUR' THEN 'EU'
    WHEN 'GBP' THEN 'UK'
    WHEN 'AUD' THEN 'AU'
    WHEN 'JPY' THEN 'JP'
    ELSE 'US'
  END;

  -- Update the CORRECT price column based on currency
  IF p_currency = 'USD' THEN
    UPDATE filaments SET
      variant_price = p_new_price,
      variant_compare_at_price = p_compare_at_price,
      last_scraped_at = NOW(),
      price_last_manual_refresh = NOW(),
      price_source = CASE WHEN p_source = 'manual' THEN 'admin_refresh' ELSE p_source END,
      updated_at = NOW()
    WHERE id = p_filament_id
    RETURNING * INTO v_updated_row;

  ELSIF p_currency = 'CAD' THEN
    UPDATE filaments SET
      price_cad = p_new_price,
      last_scraped_at = NOW(),
      price_last_manual_refresh = NOW(),
      updated_at = NOW()
    WHERE id = p_filament_id
    RETURNING * INTO v_updated_row;

  ELSIF p_currency = 'GBP' THEN
    UPDATE filaments SET
      price_gbp = p_new_price,
      last_scraped_at = NOW(),
      price_last_manual_refresh = NOW(),
      updated_at = NOW()
    WHERE id = p_filament_id
    RETURNING * INTO v_updated_row;

  ELSIF p_currency = 'EUR' THEN
    UPDATE filaments SET
      price_eur = p_new_price,
      last_scraped_at = NOW(),
      price_last_manual_refresh = NOW(),
      updated_at = NOW()
    WHERE id = p_filament_id
    RETURNING * INTO v_updated_row;

  ELSIF p_currency = 'AUD' THEN
    UPDATE filaments SET
      price_aud = p_new_price,
      last_scraped_at = NOW(),
      price_last_manual_refresh = NOW(),
      updated_at = NOW()
    WHERE id = p_filament_id
    RETURNING * INTO v_updated_row;

  ELSIF p_currency = 'JPY' THEN
    UPDATE filaments SET
      price_jpy = p_new_price,
      last_scraped_at = NOW(),
      price_last_manual_refresh = NOW(),
      updated_at = NOW()
    WHERE id = p_filament_id
    RETURNING * INTO v_updated_row;

  ELSE
    UPDATE filaments SET
      variant_price = p_new_price,
      variant_compare_at_price = p_compare_at_price,
      last_scraped_at = NOW(),
      price_last_manual_refresh = NOW(),
      price_source = CASE WHEN p_source = 'manual' THEN 'admin_refresh' ELSE p_source END,
      updated_at = NOW()
    WHERE id = p_filament_id
    RETURNING * INTO v_updated_row;
  END IF;

  IF v_updated_row.id IS NULL THEN
    RAISE EXCEPTION 'Filament not found: %', p_filament_id;
  END IF;

  INSERT INTO price_history (filament_id, price, compare_at_price, currency, source, region, recorded_at)
  VALUES (p_filament_id, p_new_price, p_compare_at_price, p_currency, 'admin_refresh', v_region, NOW());

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