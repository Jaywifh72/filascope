-- Add extraction config columns to automated_brands
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS extraction_method text DEFAULT 'auto';
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS price_extraction_config jsonb DEFAULT '{}'::jsonb;
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS test_product_url text;
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS last_extraction_test_at timestamptz;
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS extraction_working boolean DEFAULT true;
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS extraction_success_rate numeric(5,2);

-- Create extraction logging table
CREATE TABLE IF NOT EXISTS price_extraction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES automated_brands(id) ON DELETE SET NULL,
  brand_slug text,
  product_url text NOT NULL,
  extraction_method text NOT NULL,
  success boolean NOT NULL,
  extracted_price numeric,
  currency text,
  error_message text,
  raw_content_sample text,
  response_time_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Index for brand success rate queries
CREATE INDEX IF NOT EXISTS idx_extraction_logs_brand_success 
ON price_extraction_logs (brand_id, success, created_at DESC);

-- Index for recent logs lookup
CREATE INDEX IF NOT EXISTS idx_extraction_logs_created_at
ON price_extraction_logs (created_at DESC);

-- Index for brand_slug lookup
CREATE INDEX IF NOT EXISTS idx_extraction_logs_brand_slug
ON price_extraction_logs (brand_slug, created_at DESC);

-- Enable RLS
ALTER TABLE price_extraction_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users (admins check in app)
CREATE POLICY "Allow read for authenticated users" ON price_extraction_logs
FOR SELECT TO authenticated USING (true);

-- Allow insert from Edge Functions (service role)
CREATE POLICY "Allow insert for service role" ON price_extraction_logs
FOR INSERT WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE price_extraction_logs IS 'Tracks price extraction attempts for monitoring success rates and debugging';
COMMENT ON COLUMN automated_brands.extraction_method IS 'Price extraction method: auto, shopify_json, firecrawl, custom';
COMMENT ON COLUMN automated_brands.price_extraction_config IS 'JSON config with pricePatterns, excludePatterns, priceRangeMin/Max, currencyDetection';