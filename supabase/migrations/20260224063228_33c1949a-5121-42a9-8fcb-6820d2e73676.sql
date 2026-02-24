-- Create brand_sync_config entry for Creality
-- Brand ID: 600094ec-f6d3-412b-9fae-33df6775fa73
-- Primary extraction: json_ld (Shopify JSON is blocked on custom storefront)
-- Regional URL templates use path-based routing

INSERT INTO brand_sync_config (
  brand_id,
  store_platform,
  primary_extraction,
  fallback_extraction,
  shopify_json_available,
  json_ld_type,
  variant_region_in_title,
  variant_region_separator,
  variant_exclude_patterns,
  variant_selection_strategy,
  price_field,
  compare_at_field,
  store_url_us,
  store_url_ca,
  store_url_uk,
  store_url_eu,
  store_url_au,
  store_url_jp,
  uses_geo_pricing,
  sync_notes
) VALUES (
  '600094ec-f6d3-412b-9fae-33df6775fa73',
  'custom_shopify',
  'json_ld',
  'meta_tags',
  false,
  'Product',
  false,
  ' / ',
  ARRAY['combo', 'bundle', 'kit', 'pack', 'set'],
  'cheapest_standalone',
  'price',
  'compare_at_price',
  'https://store.creality.com/products/{slug}',
  'https://store.creality.com/ca/products/{slug}',
  'https://store.creality.com/uk/products/{slug}',
  'https://store.creality.com/eu/products/{slug}',
  'https://store.creality.com/au/products/{slug}',
  'https://store.creality.com/jp/products/{slug}',
  false,
  'Custom Shopify storefront blocks .json endpoints. Uses JSON-LD extraction. Handles differ across regions - uses myshopify.com backends for handle discovery. Multi-offer pages need InStock/combo filtering.'
);

-- Update JP regional store to have product_url_pattern
UPDATE brand_regional_stores 
SET product_url_pattern = 'https://store.creality.com/jp/products/{slug}'
WHERE brand_id = '600094ec-f6d3-412b-9fae-33df6775fa73' 
  AND region_code = 'JP'
  AND product_url_pattern IS NULL;