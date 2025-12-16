-- Fix product_id collision issue: Change from global unique to vendor-scoped unique

-- Drop the existing global unique constraint on product_id
ALTER TABLE filaments DROP CONSTRAINT IF EXISTS filaments_product_id_key;

-- Add a compound unique constraint: product_id must be unique within each vendor
ALTER TABLE filaments ADD CONSTRAINT filaments_vendor_product_id_key 
  UNIQUE (vendor, product_id);