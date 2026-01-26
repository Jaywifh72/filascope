-- Add admin management columns to filaments table
ALTER TABLE filaments 
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS msrp numeric,
  ADD COLUMN IF NOT EXISTS sync_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_sync_error text,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- Add comments for documentation
COMMENT ON COLUMN filaments.display_name IS 'Admin-editable display name that overrides product_title';
COMMENT ON COLUMN filaments.msrp IS 'Manufacturer Suggested Retail Price';
COMMENT ON COLUMN filaments.sync_enabled IS 'Whether to include in automated price syncs';
COMMENT ON COLUMN filaments.last_sync_error IS 'Error message from the last sync attempt';
COMMENT ON COLUMN filaments.admin_notes IS 'Internal notes for admin use only';

-- Create index for sync filtering on filaments
CREATE INDEX IF NOT EXISTS idx_filaments_sync_enabled ON filaments(sync_enabled) WHERE sync_enabled = true;

-- Add admin management columns to printers table
ALTER TABLE printers 
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS compare_at_price_usd numeric,
  ADD COLUMN IF NOT EXISTS sync_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_sync_status text,
  ADD COLUMN IF NOT EXISTS last_sync_error text,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- Add comments for documentation
COMMENT ON COLUMN printers.display_name IS 'Admin-editable display name that overrides model_name';
COMMENT ON COLUMN printers.compare_at_price_usd IS 'Compare-at/strikethrough price in USD';
COMMENT ON COLUMN printers.sync_enabled IS 'Whether to include in automated price syncs';
COMMENT ON COLUMN printers.last_sync_status IS 'Status of last sync: success, failed, or pending';
COMMENT ON COLUMN printers.last_sync_error IS 'Error message from the last sync attempt';
COMMENT ON COLUMN printers.admin_notes IS 'Internal notes for admin use only';

-- Create index for sync filtering on printers
CREATE INDEX IF NOT EXISTS idx_printers_sync_enabled ON printers(sync_enabled) WHERE sync_enabled = true;

-- Add Prusa brand if not already present
INSERT INTO automated_brands (brand_name, brand_slug, display_name, base_url, platform_type, scraping_enabled, rate_limit_ms)
VALUES ('Prusa', 'prusa', 'Prusa', 'https://www.prusa3d.com', 'shopify', true, 2000)
ON CONFLICT (brand_slug) DO NOTHING;