-- Phase 1: Regional Pricing Infrastructure
-- Creates 4 new tables: exchange_rates, stores, filament_prices, region_config

-- 1. Create exchange_rates table
CREATE TABLE exchange_rates (
  currency_code TEXT PRIMARY KEY,
  currency_name TEXT NOT NULL,
  currency_symbol TEXT NOT NULL,
  rate_to_usd NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read exchange rates" 
  ON exchange_rates FOR SELECT USING (true);

INSERT INTO exchange_rates (currency_code, currency_name, currency_symbol, rate_to_usd) VALUES
  ('USD', 'US Dollar', '$', 1.00),
  ('CAD', 'Canadian Dollar', 'C$', 0.71),
  ('EUR', 'Euro', '€', 1.04),
  ('GBP', 'British Pound', '£', 1.24),
  ('AUD', 'Australian Dollar', 'A$', 0.62),
  ('JPY', 'Japanese Yen', '¥', 0.0064),
  ('CNY', 'Chinese Yuan', '¥', 0.14),
  ('INR', 'Indian Rupee', '₹', 0.012),
  ('SEK', 'Swedish Krona', 'kr', 0.091),
  ('PLN', 'Polish Zloty', 'zł', 0.24),
  ('MXN', 'Mexican Peso', '$', 0.049);

-- 2. Create stores table
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  store_type TEXT NOT NULL CHECK (store_type IN ('marketplace', 'brand_direct', 'retailer')),
  region TEXT NOT NULL,
  country_code TEXT,
  currency_code TEXT REFERENCES exchange_rates(currency_code),
  base_url TEXT NOT NULL,
  affiliate_tag TEXT,
  affiliate_network TEXT,
  ships_from TEXT[],
  ships_to TEXT[],
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read stores" 
  ON stores FOR SELECT USING (is_active = true);

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

INSERT INTO stores (name, slug, store_type, region, country_code, currency_code, base_url, ships_from, ships_to) VALUES
  ('Amazon US', 'amazon-us', 'marketplace', 'US', 'US', 'USD', 'https://amazon.com', ARRAY['US'], ARRAY['US', 'CA', 'MX']),
  ('Amazon Canada', 'amazon-ca', 'marketplace', 'CA', 'CA', 'CAD', 'https://amazon.ca', ARRAY['CA'], ARRAY['CA']),
  ('Amazon UK', 'amazon-uk', 'marketplace', 'UK', 'GB', 'GBP', 'https://amazon.co.uk', ARRAY['GB'], ARRAY['UK', 'EU']),
  ('Amazon Germany', 'amazon-de', 'marketplace', 'EU', 'DE', 'EUR', 'https://amazon.de', ARRAY['DE'], ARRAY['EU']),
  ('Amazon France', 'amazon-fr', 'marketplace', 'EU', 'FR', 'EUR', 'https://amazon.fr', ARRAY['FR'], ARRAY['EU']),
  ('Amazon Italy', 'amazon-it', 'marketplace', 'EU', 'IT', 'EUR', 'https://amazon.it', ARRAY['IT'], ARRAY['EU']),
  ('Amazon Spain', 'amazon-es', 'marketplace', 'EU', 'ES', 'EUR', 'https://amazon.es', ARRAY['ES'], ARRAY['EU']),
  ('Amazon Australia', 'amazon-au', 'marketplace', 'AU', 'AU', 'AUD', 'https://amazon.com.au', ARRAY['AU'], ARRAY['AU']),
  ('Amazon Japan', 'amazon-jp', 'marketplace', 'JP', 'JP', 'JPY', 'https://amazon.co.jp', ARRAY['JP'], ARRAY['JP']),
  ('Polymaker US', 'polymaker-us', 'brand_direct', 'US', 'US', 'USD', 'https://us.polymaker.com', ARRAY['US', 'CN'], ARRAY['US', 'CA', 'GLOBAL']),
  ('Prusament', 'prusament', 'brand_direct', 'EU', 'CZ', 'EUR', 'https://www.prusa3d.com/product-category/prusament/', ARRAY['CZ'], ARRAY['EU', 'GLOBAL']),
  ('Bambu Lab', 'bambu-lab', 'brand_direct', 'GLOBAL', NULL, 'USD', 'https://store.bambulab.com', ARRAY['CN', 'US', 'EU'], ARRAY['GLOBAL']),
  ('PrintedSolid', 'printedsolid', 'retailer', 'US', 'US', 'USD', 'https://www.printedsolid.com', ARRAY['US'], ARRAY['US', 'CA']),
  ('Filaments.ca', 'filaments-ca', 'retailer', 'CA', 'CA', 'CAD', 'https://filaments.ca', ARRAY['CA'], ARRAY['CA']),
  ('3DJake EU', '3djake-eu', 'retailer', 'EU', 'AT', 'EUR', 'https://www.3djake.com', ARRAY['AT', 'DE'], ARRAY['EU']),
  ('3DJake UK', '3djake-uk', 'retailer', 'UK', 'GB', 'GBP', 'https://www.3djake.co.uk', ARRAY['GB'], ARRAY['UK']),
  ('ColorFabb', 'colorfabb', 'brand_direct', 'EU', 'NL', 'EUR', 'https://colorfabb.com', ARRAY['NL'], ARRAY['EU', 'GLOBAL']);

-- 3. Create filament_prices table
CREATE TABLE filament_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id UUID NOT NULL REFERENCES filaments(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL,
  currency_code TEXT NOT NULL REFERENCES exchange_rates(currency_code),
  product_url TEXT,
  affiliate_url TEXT,
  in_stock BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(filament_id, store_id)
);

ALTER TABLE filament_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read filament prices" 
  ON filament_prices FOR SELECT USING (true);

CREATE INDEX idx_filament_prices_filament ON filament_prices(filament_id);
CREATE INDEX idx_filament_prices_store ON filament_prices(store_id);
CREATE INDEX idx_filament_prices_in_stock ON filament_prices(in_stock) WHERE in_stock = true;

CREATE TRIGGER update_filament_prices_updated_at
  BEFORE UPDATE ON filament_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Create region_config table
CREATE TABLE region_config (
  region_code TEXT PRIMARY KEY,
  region_name TEXT NOT NULL,
  currency_code TEXT REFERENCES exchange_rates(currency_code),
  flag_emoji TEXT,
  default_store_priority TEXT[],
  amazon_domain TEXT,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE region_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read region config" 
  ON region_config FOR SELECT USING (is_active = true);

INSERT INTO region_config VALUES
  ('US', 'United States', 'USD', '🇺🇸', ARRAY['amazon-us', 'printedsolid'], 'amazon.com', true),
  ('CA', 'Canada', 'CAD', '🇨🇦', ARRAY['amazon-ca', 'filaments-ca'], 'amazon.ca', true),
  ('UK', 'United Kingdom', 'GBP', '🇬🇧', ARRAY['amazon-uk', '3djake-uk'], 'amazon.co.uk', true),
  ('EU', 'European Union', 'EUR', '🇪🇺', ARRAY['amazon-de', '3djake-eu', 'prusament'], 'amazon.de', true),
  ('AU', 'Australia', 'AUD', '🇦🇺', ARRAY['amazon-au'], 'amazon.com.au', true),
  ('JP', 'Japan', 'JPY', '🇯🇵', ARRAY['amazon-jp'], 'amazon.co.jp', true);