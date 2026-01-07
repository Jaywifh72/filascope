-- Update Eryone to use custom platform type to route to dedicated CSV-seeded sync
UPDATE automated_brands 
SET platform_type = 'custom'
WHERE brand_slug = 'eryone';