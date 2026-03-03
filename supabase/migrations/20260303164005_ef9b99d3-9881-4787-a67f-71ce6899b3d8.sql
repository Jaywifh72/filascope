INSERT INTO brand_scraping_configs (brand_id, brand_name, platform, base_url, scrape_method, adapter_key, regional_url_pattern, variant_mapping, spec_extraction, default_material_type, notes, is_active)
VALUES (
  (SELECT id FROM automated_brands WHERE brand_name ILIKE '%sunlu%' LIMIT 1),
  'SUNLU',
  'shopify',
  'https://store.sunlu.com',
  'json_endpoint',
  'sunlu',
  '{"US": "https://store.sunlu.com", "EU": "https://store.sunlu.com/en-de", "UK": "https://store.sunlu.com/en-gb", "CA": "https://store.sunlu.com", "AU": "https://store.sunlu.com"}'::jsonb,
  '{"region_option": "option1", "material_option": "option2", "color_option": "option3", "region_map": {"Ship to USA": "US", "Ship to Europe": "EU", "Ship to Canada": "CA", "Ship to Australia": "AU"}, "price_currency_map": {"Ship to USA": "USD", "Ship to Europe": "EUR", "Ship to Canada": "CAD", "Ship to Australia": "AUD"}}'::jsonb,
  '{"diameter_regex": "Diameter[:\\\\s]*([\\\\d.]+)\\\\s*[±]?", "nozzle_temp_min_regex": "Printing Temperature[:\\\\s]*([\\\\d]+)", "nozzle_temp_max_regex": "Printing Temperature[:\\\\s]*\\\\d+[–-]([\\\\d]+)", "bed_temp_min_regex": "heated.*?([\\\\d]+)[–-]([\\\\d]+)", "bed_temp_max_regex": "heated.*?\\\\d+[–-]([\\\\d]+)", "net_weight_regex": "Net Weight[:\\\\s]*([\\\\d.]+)", "length_regex": "Length.*?([\\\\d]+)\\\\s*m"}'::jsonb,
  'PLA',
  'SUNLU uses Shopify mega-product pages where all colors of a filament type are listed as variants. Option1=Region, Option2=Material sub-type, Option3=Color. The store is at store.sunlu.com (www.sunlu.com redirects there). Regional stores use Shopify Markets prefixes (/en-de, /en-gb). Prices in variants are region-specific. The geo-popup offers DE, UK, FR, IT store switches. No TDS PDF links found on product pages. 50+ PLA colors on a single product with 137 variants.',
  true
);