
-- The affiliate_clicks table already exists with a compatible schema.
-- Add missing indexes if not already present (safe with IF NOT EXISTS).
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created ON affiliate_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_brand ON affiliate_clicks(brand_name);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_region ON affiliate_clicks(region_code);

-- Ensure anonymous insert policy exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'affiliate_clicks'
    AND policyname = 'Allow anonymous inserts'
  ) THEN
    CREATE POLICY "Allow anonymous inserts" ON affiliate_clicks FOR INSERT WITH CHECK (true);
  END IF;
END$$;

-- Ensure authenticated read policy exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'affiliate_clicks'
    AND policyname = 'Allow authenticated reads'
  ) THEN
    CREATE POLICY "Allow authenticated reads" ON affiliate_clicks FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END$$;

-- Create the log_affiliate_click RPC function (maps to existing schema columns)
CREATE OR REPLACE FUNCTION public.log_affiliate_click(
  p_product_id     UUID    DEFAULT NULL,
  p_product_name   TEXT    DEFAULT NULL,
  p_brand          TEXT    DEFAULT NULL,
  p_material       TEXT    DEFAULT NULL,
  p_store          TEXT    DEFAULT NULL,
  p_store_url      TEXT    DEFAULT NULL,
  p_region         TEXT    DEFAULT 'US',
  p_currency       TEXT    DEFAULT 'USD',
  p_price          NUMERIC DEFAULT NULL,
  p_source_page    TEXT    DEFAULT NULL,
  p_session_id     TEXT    DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO affiliate_clicks (
    product_id,
    product_name,
    brand_name,
    destination_url,
    region_code,
    currency,
    price,
    source_page,
    session_id,
    utm_source,
    utm_medium
  ) VALUES (
    p_product_id,
    p_product_name,
    COALESCE(p_brand, p_store, 'unknown'),
    COALESCE(p_store_url, ''),
    COALESCE(p_region, 'US'),
    COALESCE(p_currency, 'USD'),
    p_price,
    COALESCE(p_source_page, 'unknown'),
    p_session_id,
    'filascope',
    'affiliate'
  );
END;
$$;
