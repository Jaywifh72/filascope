
-- Add Awin-specific columns to affiliate_programs
ALTER TABLE affiliate_programs ADD COLUMN IF NOT EXISTS awin_merchant_id text DEFAULT NULL;
ALTER TABLE affiliate_programs ADD COLUMN IF NOT EXISTS awin_publisher_id text DEFAULT NULL;
