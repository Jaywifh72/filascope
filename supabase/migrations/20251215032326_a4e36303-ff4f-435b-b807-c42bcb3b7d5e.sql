-- Add shipping preferences to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shipping_zip_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shipping_country TEXT DEFAULT 'US';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS amazon_prime_member BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS retailer_memberships JSONB DEFAULT '{}';

-- Create retailers table
CREATE TABLE IF NOT EXISTS retailers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website_url TEXT,
  trust_score NUMERIC(2,1),
  shipping_speed_rating NUMERIC(2,1),
  customer_service_rating NUMERIC(2,1),
  return_policy_days INTEGER,
  return_policy_type TEXT,
  restocking_fee_percent INTEGER DEFAULT 0,
  free_shipping_threshold NUMERIC,
  flat_rate_shipping NUMERIC,
  regions_served TEXT[],
  membership_program TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create filament inventory table
CREATE TABLE IF NOT EXISTS filament_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filament_id UUID REFERENCES filaments(id) ON DELETE CASCADE NOT NULL,
  retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE NOT NULL,
  stock_status TEXT NOT NULL DEFAULT 'unknown',
  stock_quantity INTEGER,
  last_checked TIMESTAMPTZ DEFAULT now(),
  price NUMERIC,
  currency TEXT DEFAULT 'USD',
  product_url TEXT,
  estimated_ship_days INTEGER,
  UNIQUE(filament_id, retailer_id)
);

-- Create shipping estimates table
CREATE TABLE IF NOT EXISTS shipping_estimates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE NOT NULL,
  origin_region TEXT NOT NULL,
  dest_zip_prefix TEXT,
  dest_country TEXT NOT NULL,
  shipping_cost NUMERIC,
  shipping_currency TEXT DEFAULT 'USD',
  min_days INTEGER,
  max_days INTEGER,
  carrier TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(retailer_id, origin_region, dest_zip_prefix, dest_country)
);

-- Enable RLS
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE filament_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_estimates ENABLE ROW LEVEL SECURITY;

-- Public read access for retailers
CREATE POLICY "Retailers are publicly readable" ON retailers FOR SELECT USING (true);

-- Public read access for inventory
CREATE POLICY "Inventory is publicly readable" ON filament_inventory FOR SELECT USING (true);

-- Public read access for shipping estimates
CREATE POLICY "Shipping estimates are publicly readable" ON shipping_estimates FOR SELECT USING (true);

-- Insert seed data for common retailers
INSERT INTO retailers (name, slug, logo_url, website_url, trust_score, shipping_speed_rating, customer_service_rating, return_policy_days, return_policy_type, restocking_fee_percent, free_shipping_threshold, regions_served, membership_program) VALUES
('Amazon', 'amazon', '/images/retailers/amazon.png', 'https://amazon.com', 4.8, 5.0, 4.5, 30, 'no_questions', 0, 25, ARRAY['US', 'CA', 'UK', 'EU', 'JP', 'AU'], 'prime'),
('Bambu Lab', 'bambu-lab', '/images/brands/bambu-lab.webp', 'https://store.bambulab.com', 4.9, 4.5, 4.8, 30, 'no_questions', 0, 49, ARRAY['US', 'CA', 'UK', 'EU', 'JP', 'AU'], NULL),
('MatterHackers', 'matterhackers', '/images/brands/matterhackers.webp', 'https://matterhackers.com', 4.2, 4.0, 4.8, 14, 'restocking_fee', 15, 35, ARRAY['US'], NULL),
('Polymaker', 'polymaker', '/images/brands/polymaker.webp', 'https://polymaker.com', 4.5, 4.0, 4.5, 30, 'no_questions', 0, 49, ARRAY['US', 'CA', 'UK', 'EU', 'AU'], NULL),
('Prusa Research', 'prusa', '/images/brands/prusa-research.png', 'https://prusa3d.com', 4.7, 4.0, 4.9, 14, 'no_questions', 0, 75, ARRAY['US', 'CA', 'UK', 'EU', 'AU'], 'insider'),
('Fillamentum', 'fillamentum', '/images/brands/fillamentum.webp', 'https://fillamentum.com', 4.6, 3.5, 4.5, 14, 'restocking_fee', 10, 100, ARRAY['EU', 'US'], NULL),
('ColorFabb', 'colorfabb', '/images/brands/colorfabb.webp', 'https://colorfabb.com', 4.5, 3.5, 4.5, 14, 'no_questions', 0, 75, ARRAY['EU', 'US', 'CA'], NULL),
('eSun', 'esun', '/images/brands/esun.webp', 'https://esun3d.com', 4.0, 3.5, 3.8, 30, 'restocking_fee', 15, 50, ARRAY['US', 'EU', 'AU'], NULL),
('Overture', 'overture', '/images/brands/overture.webp', 'https://overture3d.com', 4.1, 4.0, 4.0, 30, 'no_questions', 0, 39, ARRAY['US'], NULL),
('Hatchbox', 'hatchbox', '/images/brands/hatchbox.webp', 'https://hatchbox3d.com', 4.3, 4.0, 4.2, 30, 'no_questions', 0, 39, ARRAY['US'], NULL)
ON CONFLICT (slug) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_filament_inventory_filament ON filament_inventory(filament_id);
CREATE INDEX IF NOT EXISTS idx_filament_inventory_retailer ON filament_inventory(retailer_id);
CREATE INDEX IF NOT EXISTS idx_shipping_estimates_retailer ON shipping_estimates(retailer_id);