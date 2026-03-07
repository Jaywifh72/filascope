-- Fix ON DELETE behavior for FKs that need SET NULL instead of CASCADE/NO ACTION
-- Also update CHECK constraints to include 'accessory'

-- 1. filament_listings.filament_id: CASCADE → SET NULL
ALTER TABLE filament_listings DROP CONSTRAINT filament_listings_filament_id_fkey;
ALTER TABLE filament_listings ADD CONSTRAINT filament_listings_filament_id_fkey
  FOREIGN KEY (filament_id) REFERENCES filaments(id) ON DELETE SET NULL;

-- 2. filament_listings.retailer_id: CASCADE → SET NULL
ALTER TABLE filament_listings DROP CONSTRAINT filament_listings_retailer_id_fkey;
ALTER TABLE filament_listings ADD CONSTRAINT filament_listings_retailer_id_fkey
  FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE SET NULL;

-- 5. price_history.filament_id: CASCADE → SET NULL
ALTER TABLE price_history DROP CONSTRAINT price_history_filament_id_fkey;
ALTER TABLE price_history ADD CONSTRAINT price_history_filament_id_fkey
  FOREIGN KEY (filament_id) REFERENCES filaments(id) ON DELETE SET NULL;

-- 6. affiliate_clicks.program_id: NO ACTION → SET NULL
ALTER TABLE affiliate_clicks DROP CONSTRAINT affiliate_clicks_program_id_fkey;
ALTER TABLE affiliate_clicks ADD CONSTRAINT affiliate_clicks_program_id_fkey
  FOREIGN KEY (program_id) REFERENCES affiliate_programs(id) ON DELETE SET NULL;

-- 11. filament_inventory.retailer_id: CASCADE → SET NULL
ALTER TABLE filament_inventory DROP CONSTRAINT filament_inventory_retailer_id_fkey;
ALTER TABLE filament_inventory ADD CONSTRAINT filament_inventory_retailer_id_fkey
  FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE SET NULL;

-- 3. product_regional_prices: update CHECK to include 'accessory'
ALTER TABLE product_regional_prices DROP CONSTRAINT product_regional_prices_type_check;
ALTER TABLE product_regional_prices ADD CONSTRAINT product_regional_prices_type_check
  CHECK (product_type IN ('filament', 'printer', 'accessory'));

-- 4. product_regional_urls: update CHECK to include 'accessory'
ALTER TABLE product_regional_urls DROP CONSTRAINT product_regional_urls_type_check;
ALTER TABLE product_regional_urls ADD CONSTRAINT product_regional_urls_type_check
  CHECK (product_type IN ('filament', 'printer', 'accessory'));