-- Add tracking columns for Amazon link discovery
ALTER TABLE automated_brands 
ADD COLUMN IF NOT EXISTS products_with_amazon_links INTEGER DEFAULT 0;

-- Add confidence tracking to filaments
ALTER TABLE filaments 
ADD COLUMN IF NOT EXISTS amazon_match_confidence INTEGER;

-- Update products_with_amazon_links count for existing data
UPDATE automated_brands ab
SET products_with_amazon_links = (
  SELECT COUNT(*) FROM filaments f 
  WHERE LOWER(f.vendor) = LOWER(ab.brand_name) 
  AND f.amazon_link_us IS NOT NULL
);