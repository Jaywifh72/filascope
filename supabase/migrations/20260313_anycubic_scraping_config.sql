-- Insert Anycubic brand scraping config for Brand Catalog Sync
-- Anycubic uses a per-handle whitelist strategy because their /products.json
-- doesn't have CORS headers, and the main endpoint mixes printers/resins with filaments.
-- The whitelist contains 19 curated filament product handles.

INSERT INTO brand_scraping_configs (
  brand_id, brand_name, platform, base_url, scrape_method, adapter_key,
  catalog_strategy, regional_url_pattern, variant_mapping,
  spec_extraction, default_material_type, notes, is_active
)
VALUES (
  (SELECT id FROM automated_brands WHERE brand_slug = 'anycubic' LIMIT 1),
  'Anycubic',
  'shopify',
  'https://store.anycubic.com',
  'per_handle_whitelist',
  'anycubic',
  'per-handle-whitelist',
  '{"US": "https://store.anycubic.com", "CA": "https://ca.anycubic.com", "UK": "https://uk.anycubic.com", "EU": "https://eu.anycubic.com", "AU": "https://www.anycubic.au"}'::jsonb,
  '{"region_option": "option3", "color_option": "option1", "size_option": "option2", "region_map": {"US": "US", "EU": "EU", "UK": "UK", "Other": "US"}, "price_currency_map": {"US": "USD", "EU": "EUR", "UK": "GBP", "Other": "USD"}}'::jsonb,
  NULL,
  NULL,
  'Anycubic uses Shopify with Option1=Color, Option2=Size(1KG), Option3=Region(US/EU/UK/Other). Products are fetched individually via CORS proxy using a curated whitelist of 19 filament handles. Some products (PETG, PLA Silk Dual/Tri-Color) may only exist on CA store. Regional stores: US=store.anycubic.com, CA=ca.anycubic.com, EU=eu.anycubic.com, UK=uk.anycubic.com, AU=www.anycubic.au.',
  true
)
ON CONFLICT (adapter_key) DO NOTHING;
