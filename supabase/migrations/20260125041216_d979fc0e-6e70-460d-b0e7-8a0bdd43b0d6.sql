-- Phase 1: Add metadata columns to tables

-- 1.1 Add columns to filaments
ALTER TABLE filaments 
  ADD COLUMN IF NOT EXISTS price_source VARCHAR(50) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS price_confidence VARCHAR(20) DEFAULT 'unknown';

COMMENT ON COLUMN filaments.price_source IS 'Origin of price data: manual, scraper, api, affiliate';
COMMENT ON COLUMN filaments.price_confidence IS 'Calculated staleness: high, medium, low, stale, unknown';

-- 1.2 Add columns to printers
ALTER TABLE printers 
  ADD COLUMN IF NOT EXISTS price_source VARCHAR(50) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS price_confidence VARCHAR(20) DEFAULT 'unknown';

-- 1.3 Add columns to filament_listings
ALTER TABLE filament_listings 
  ADD COLUMN IF NOT EXISTS price_source VARCHAR(50) DEFAULT 'scraper',
  ADD COLUMN IF NOT EXISTS price_confidence VARCHAR(20) DEFAULT 'unknown';

-- 1.4 Create printer_price_history table
CREATE TABLE IF NOT EXISTS printer_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID NOT NULL REFERENCES printers(id) ON DELETE CASCADE,
  region_code VARCHAR(5) NOT NULL DEFAULT 'US',
  price DECIMAL(10,2) NOT NULL,
  currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
  source VARCHAR(50) NOT NULL DEFAULT 'manual',
  store_url TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_printer_price_history_product ON printer_price_history(printer_id);
CREATE INDEX IF NOT EXISTS idx_printer_price_history_date ON printer_price_history(recorded_at DESC);

-- Phase 2: Create price confidence function
CREATE OR REPLACE FUNCTION get_price_confidence(last_verified TIMESTAMPTZ)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF last_verified IS NULL THEN
    RETURN 'unknown';
  ELSIF last_verified > NOW() - INTERVAL '24 hours' THEN
    RETURN 'high';
  ELSIF last_verified > NOW() - INTERVAL '7 days' THEN
    RETURN 'medium';
  ELSIF last_verified > NOW() - INTERVAL '30 days' THEN
    RETURN 'low';
  ELSE
    RETURN 'stale';
  END IF;
END;
$$;

COMMENT ON FUNCTION get_price_confidence IS 'Calculate price confidence based on age: <24h=high, <7d=medium, <30d=low, >30d=stale';

-- Phase 3: Create trigger function for auto-updating confidence
CREATE OR REPLACE FUNCTION update_price_confidence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'filaments' THEN
    NEW.price_confidence := get_price_confidence(NEW.last_scraped_at);
  ELSIF TG_TABLE_NAME = 'printers' THEN
    NEW.price_confidence := get_price_confidence(NEW.prices_last_updated_at);
  ELSIF TG_TABLE_NAME = 'filament_listings' THEN
    NEW.price_confidence := get_price_confidence(NEW.last_scraped_at);
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trg_filament_price_confidence ON filaments;
CREATE TRIGGER trg_filament_price_confidence
  BEFORE INSERT OR UPDATE OF variant_price, last_scraped_at ON filaments
  FOR EACH ROW EXECUTE FUNCTION update_price_confidence();

DROP TRIGGER IF EXISTS trg_printer_price_confidence ON printers;
CREATE TRIGGER trg_printer_price_confidence
  BEFORE INSERT OR UPDATE OF current_price_usd_store, prices_last_updated_at ON printers
  FOR EACH ROW EXECUTE FUNCTION update_price_confidence();

DROP TRIGGER IF EXISTS trg_listing_price_confidence ON filament_listings;
CREATE TRIGGER trg_listing_price_confidence
  BEFORE INSERT OR UPDATE OF current_price, last_scraped_at ON filament_listings
  FOR EACH ROW EXECUTE FUNCTION update_price_confidence();

-- Phase 6: RLS policies for printer_price_history
ALTER TABLE printer_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for printer_price_history"
  ON printer_price_history FOR SELECT
  USING (true);

CREATE POLICY "Admin insert for printer_price_history"
  ON printer_price_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin update for printer_price_history"
  ON printer_price_history FOR UPDATE
  USING (true);

-- Backfill existing data
UPDATE filaments 
SET price_confidence = get_price_confidence(last_scraped_at)
WHERE last_scraped_at IS NOT NULL;

UPDATE printers 
SET price_confidence = get_price_confidence(prices_last_updated_at)
WHERE prices_last_updated_at IS NOT NULL;

UPDATE filament_listings 
SET price_confidence = get_price_confidence(last_scraped_at)
WHERE last_scraped_at IS NOT NULL;