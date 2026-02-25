
-- Allow product_regional_slugs to store printer slugs without a filament_id
ALTER TABLE product_regional_slugs ALTER COLUMN filament_id DROP NOT NULL;

-- Add a check constraint to ensure at least one of filament_id or printer_id is set
ALTER TABLE product_regional_slugs ADD CONSTRAINT chk_has_product_id
  CHECK (filament_id IS NOT NULL OR printer_id IS NOT NULL);
