-- Add printer_id column to product_regional_slugs for caching discovered regional handles
ALTER TABLE product_regional_slugs 
ADD COLUMN IF NOT EXISTS printer_id UUID REFERENCES printers(id) ON DELETE CASCADE;

-- Add index for printer lookups
CREATE INDEX IF NOT EXISTS idx_product_regional_slugs_printer_id 
ON product_regional_slugs(printer_id, region_code) WHERE printer_id IS NOT NULL;

-- Add unique constraint to prevent duplicate entries per printer+region
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_regional_slugs_printer_region 
ON product_regional_slugs(printer_id, region_code) WHERE printer_id IS NOT NULL;