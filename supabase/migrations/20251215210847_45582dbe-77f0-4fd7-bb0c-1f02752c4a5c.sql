-- ============================================================================
-- SAFE BRAND CONFIGURATION UPDATE (UPSERT - No Data Loss)
-- ============================================================================

-- Part 1: Update existing Shopify brands with API endpoints and discovery config
UPDATE automated_brands SET
  has_api = true,
  api_endpoint = base_url || '/products.json',
  products_url = COALESCE(products_url, base_url || '/collections/all'),
  product_url_pattern = base_url || '/products/{handle}',
  auto_create_products = true,
  scraping_enabled = true
WHERE platform_type = 'shopify';

-- Part 2: Update existing WooCommerce brands
UPDATE automated_brands SET
  has_api = false,
  auto_create_products = true,
  scraping_enabled = true
WHERE platform_type = 'woocommerce';

-- Part 3: Update existing BigCommerce brands  
UPDATE automated_brands SET
  has_api = false,
  auto_create_products = true,
  scraping_enabled = true
WHERE platform_type = 'bigcommerce';

-- Part 4: Update Amazon brands (disabled until API configured)
UPDATE automated_brands SET
  has_api = false,
  auto_create_products = true,
  scraping_enabled = false,
  rate_limit_ms = 3000
WHERE platform_type = 'amazon';

-- Part 5: Update Firecrawl/custom brands
UPDATE automated_brands SET
  has_api = false,
  auto_create_products = true,
  scraping_enabled = true
WHERE platform_type = 'firecrawl';

-- Part 6: Add any missing brands using UPSERT
INSERT INTO automated_brands (
  brand_name, brand_slug, display_name, description,
  website_url, platform_type, base_url, products_url,
  has_api, api_endpoint, auto_create_products,
  scraping_enabled, scrape_frequency_hours,
  rate_limit_ms, batch_size, display_order,
  product_url_pattern, default_currency, color_primary
) VALUES
-- Recreus (Shopify - EUR)
('Recreus', 'recreus', 'Recreus', 'Spanish manufacturer of innovative flexible filaments',
 'https://recreus.com', 'shopify', 'https://recreus.com', 'https://recreus.com/collections/all',
 true, 'https://recreus.com/products.json', true,
 true, 24, 2000, 40, 50,
 'https://recreus.com/products/{handle}', 'EUR', '#16a085'),

-- IC3D Printers (WooCommerce)
('IC3D Printers', 'ic3d-printers', 'IC3D Printers', 'Premium filaments with tight tolerances',
 'https://www.ic3dprinters.com', 'woocommerce', 'https://www.ic3dprinters.com', 'https://www.ic3dprinters.com/collections/filament',
 false, null, true,
 true, 24, 2000, 80, 55,
 'https://www.ic3dprinters.com/products/{slug}', 'USD', '#1abc9c'),

-- Fiberlogy (Shopify - EUR)
('Fiberlogy', 'fiberlogy', 'Fiberlogy', 'Polish manufacturer of quality filaments',
 'https://fiberlogy.com', 'shopify', 'https://fiberlogy.com', 'https://fiberlogy.com/collections/all',
 true, 'https://fiberlogy.com/products.json', true,
 true, 24, 2000, 40, 45,
 'https://fiberlogy.com/products/{handle}', 'EUR', '#1abc9c')

ON CONFLICT (brand_slug) DO UPDATE SET
  has_api = EXCLUDED.has_api,
  api_endpoint = EXCLUDED.api_endpoint,
  products_url = COALESCE(automated_brands.products_url, EXCLUDED.products_url),
  product_url_pattern = COALESCE(automated_brands.product_url_pattern, EXCLUDED.product_url_pattern),
  auto_create_products = true,
  scraping_enabled = true;

-- Part 7: Link existing filaments to brands
SELECT link_filaments_to_brands();

-- Part 8: Update product counts
SELECT update_brand_product_counts();