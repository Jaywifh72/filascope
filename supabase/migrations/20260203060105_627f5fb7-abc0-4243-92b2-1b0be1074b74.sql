-- Main function: Get all regional prices for a filament with currency conversion
CREATE OR REPLACE FUNCTION get_filament_regional_prices(
  p_filament_id UUID,
  p_user_region TEXT DEFAULT 'US'
)
RETURNS TABLE (
  store_name TEXT,
  store_slug TEXT,
  store_type TEXT,
  region TEXT,
  country_code TEXT,
  price_cents INTEGER,
  price_local NUMERIC,
  price_display TEXT,
  currency_code TEXT,
  currency_symbol TEXT,
  product_url TEXT,
  is_local_store BOOLEAN,
  ships_to_user BOOLEAN,
  ships_from TEXT[],
  converted_price BOOLEAN
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_currency TEXT;
  v_user_rate NUMERIC;
  v_user_symbol TEXT;
BEGIN
  -- Get user's currency info from region_config
  SELECT rc.currency_code, er.rate_to_usd, er.currency_symbol
  INTO v_user_currency, v_user_rate, v_user_symbol
  FROM region_config rc
  JOIN exchange_rates er ON er.currency_code = rc.currency_code
  WHERE rc.region_code = p_user_region;

  -- Default to USD if region not found
  IF v_user_currency IS NULL THEN
    v_user_currency := 'USD';
    v_user_rate := 1.0;
    v_user_symbol := '$';
  END IF;

  RETURN QUERY
  SELECT 
    s.name AS store_name,
    s.slug AS store_slug,
    s.store_type,
    s.region,
    s.country_code,
    fp.price_cents,
    -- Convert to user's currency: (price_in_original / 100) * (original_rate / user_rate)
    ROUND(
      (fp.price_cents::NUMERIC / 100) * 
      (er.rate_to_usd / v_user_rate), 
      2
    ) AS price_local,
    -- Format for display with currency symbol
    v_user_symbol || ROUND(
      (fp.price_cents::NUMERIC / 100) * 
      (er.rate_to_usd / v_user_rate), 
      2
    )::TEXT AS price_display,
    fp.currency_code,
    er.currency_symbol,
    COALESCE(fp.affiliate_url, fp.product_url) AS product_url,
    (s.region = p_user_region) AS is_local_store,
    (p_user_region = ANY(s.ships_to) OR 'GLOBAL' = ANY(s.ships_to)) AS ships_to_user,
    s.ships_from,
    (fp.currency_code != v_user_currency) AS converted_price
  FROM filament_prices fp
  JOIN stores s ON s.id = fp.store_id
  JOIN exchange_rates er ON er.currency_code = fp.currency_code
  WHERE fp.filament_id = p_filament_id
    AND fp.in_stock = true
    AND s.is_active = true
  ORDER BY 
    (s.region = p_user_region) DESC,  -- Local stores first
    (p_user_region = ANY(s.ships_to)) DESC,  -- Ships to user second
    ROUND((fp.price_cents::NUMERIC / 100) * (er.rate_to_usd / v_user_rate), 2) ASC;  -- Then by converted price
END;
$$;

-- Helper function: Get single best price for a filament
CREATE OR REPLACE FUNCTION get_filament_best_price(
  p_filament_id UUID,
  p_user_region TEXT DEFAULT 'US'
)
RETURNS TABLE (
  store_name TEXT,
  price_display TEXT,
  product_url TEXT,
  is_local BOOLEAN,
  ships_to_user BOOLEAN
)
LANGUAGE sql
AS $$
  SELECT 
    store_name,
    price_display,
    product_url,
    is_local_store,
    ships_to_user
  FROM get_filament_regional_prices(p_filament_id, p_user_region)
  LIMIT 1;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_filament_regional_prices TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_filament_best_price TO anon, authenticated;