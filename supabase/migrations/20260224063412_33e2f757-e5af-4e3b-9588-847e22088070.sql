-- Delete the UUID-based duplicate entry
DELETE FROM brand_sync_config WHERE brand_id = '600094ec-f6d3-412b-9fae-33df6775fa73';

-- Update the existing slug-based entry with regional URL templates
UPDATE brand_sync_config 
SET 
  store_url_us = 'https://store.creality.com/products/{slug}',
  store_url_ca = 'https://store.creality.com/ca/products/{slug}',
  store_url_uk = 'https://store.creality.com/uk/products/{slug}',
  store_url_eu = 'https://store.creality.com/eu/products/{slug}',
  store_url_au = 'https://store.creality.com/au/products/{slug}',
  store_url_jp = 'https://store.creality.com/jp/products/{slug}',
  variant_exclude_patterns = ARRAY['combo', 'bundle', 'kit', 'pack', 'set'],
  variant_selection_strategy = 'cheapest_standalone',
  sync_notes = 'Custom Shopify storefront blocks .json endpoints. Uses JSON-LD extraction. Handles differ across regions - uses myshopify.com backends for handle discovery. Multi-offer pages need InStock/combo filtering.',
  updated_at = NOW()
WHERE brand_id = 'creality';