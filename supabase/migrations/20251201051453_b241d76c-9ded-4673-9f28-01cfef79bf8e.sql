-- Fix column types that should be NUMERIC instead of INTEGER
ALTER TABLE public.printers
  ALTER COLUMN msrp_usd TYPE NUMERIC USING msrp_usd::NUMERIC,
  ALTER COLUMN msrp_cad TYPE NUMERIC USING msrp_cad::NUMERIC,
  ALTER COLUMN msrp_eur TYPE NUMERIC USING msrp_eur::NUMERIC,
  ALTER COLUMN current_price_usd_store TYPE NUMERIC USING current_price_usd_store::NUMERIC,
  ALTER COLUMN current_price_usd_amazon TYPE NUMERIC USING current_price_usd_amazon::NUMERIC,
  ALTER COLUMN screen_size_inch TYPE NUMERIC USING screen_size_inch::NUMERIC;