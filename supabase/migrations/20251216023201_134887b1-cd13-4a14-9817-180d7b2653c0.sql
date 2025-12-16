-- Add Amazon price tracking to filaments table
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS amazon_price_usd NUMERIC(10,2);
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS amazon_prices_last_updated_at TIMESTAMPTZ;

-- Add Amazon store presence tracking to automated_brands table
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS amazon_store_url TEXT;
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS has_amazon_store BOOLEAN DEFAULT false;
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS products_with_amazon_prices INTEGER DEFAULT 0;
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS amazon_last_scrape_at TIMESTAMPTZ;

-- Update brands with known Amazon stores
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/Polymaker' WHERE LOWER(brand_name) = 'polymaker';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/HATCHBOX' WHERE LOWER(brand_name) = 'hatchbox';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/SUNLU' WHERE LOWER(brand_name) = 'sunlu';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/eSUN' WHERE LOWER(brand_name) = 'esun';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/Overture' WHERE LOWER(brand_name) = 'overture';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/AMOLEN' WHERE LOWER(brand_name) = 'amolen';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/ZIRO' WHERE LOWER(brand_name) = 'ziro';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/CC3D' WHERE LOWER(brand_name) = 'cc3d';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/TECBEARS' WHERE LOWER(brand_name) = 'tecbears';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/TTYT3D' WHERE LOWER(brand_name) = 'ttyt3d';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/Eryone' WHERE LOWER(brand_name) = 'eryone';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/MIKA3D' WHERE LOWER(brand_name) = 'mika3d';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/iSANMATE' WHERE LOWER(brand_name) = 'isanmate';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/DURAMIC' WHERE LOWER(brand_name) = 'duramic';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/GEEETECH' WHERE LOWER(brand_name) = 'geeetech';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/Gizmo+Dorks' WHERE LOWER(brand_name) = 'gizmo dorks';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/ANYCUBIC' WHERE LOWER(brand_name) = 'anycubic';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/Creality' WHERE LOWER(brand_name) = 'creality';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/ELEGOO' WHERE LOWER(brand_name) = 'elegoo';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/INLAND' WHERE LOWER(brand_name) = 'inland';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/JAYO' WHERE LOWER(brand_name) = 'jayo';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/Kingroon' WHERE LOWER(brand_name) = 'kingroon';
UPDATE automated_brands SET has_amazon_store = true, amazon_store_url = 'https://www.amazon.com/stores/Reprapper' WHERE LOWER(brand_name) = 'reprapper';