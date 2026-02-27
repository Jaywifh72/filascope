ALTER TABLE automated_brands DROP CONSTRAINT automated_brands_platform_type_check;
ALTER TABLE automated_brands ADD CONSTRAINT automated_brands_platform_type_check CHECK (platform_type = ANY (ARRAY['shopify','woocommerce','amazon','bigcommerce','magento','prestashop','firecrawl','custom','wix']));
UPDATE automated_brands SET platform_type = 'wix' WHERE brand_slug = 'paramount-3d';