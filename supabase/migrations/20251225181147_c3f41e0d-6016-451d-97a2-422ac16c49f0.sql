-- Update supported_regions for all 51 brands based on verified regional store presence

-- MULTI-REGION BRANDS (have regional subdomains/stores)
UPDATE automated_brands SET supported_regions = ARRAY['US','CA','UK','EU','AU','JP'] WHERE brand_slug = 'bambu-lab';
UPDATE automated_brands SET supported_regions = ARRAY['US','CA','UK','EU','AU'] WHERE brand_slug = 'elegoo';
UPDATE automated_brands SET supported_regions = ARRAY['US','EU'] WHERE brand_slug = 'polymaker';
UPDATE automated_brands SET supported_regions = ARRAY['US','CA','UK','EU','AU'] WHERE brand_slug = 'creality';
UPDATE automated_brands SET supported_regions = ARRAY['US','CA','UK','EU','AU'] WHERE brand_slug = 'anycubic';
UPDATE automated_brands SET supported_regions = ARRAY['US','EU'] WHERE brand_slug = 'flashforge';
UPDATE automated_brands SET supported_regions = ARRAY['US','EU'] WHERE brand_slug = 'prusament';

-- EUROPEAN BRANDS (EUR-native, ship globally)
UPDATE automated_brands SET supported_regions = ARRAY['US','EU'] WHERE brand_slug = 'colorfabb';
UPDATE automated_brands SET supported_regions = ARRAY['US','EU'] WHERE brand_slug = 'fillamentum';
UPDATE automated_brands SET supported_regions = ARRAY['US','EU'] WHERE brand_slug = 'formfutura';
UPDATE automated_brands SET supported_regions = ARRAY['US','EU'] WHERE brand_slug = 'fiberlogy';
UPDATE automated_brands SET supported_regions = ARRAY['US','EU'] WHERE brand_slug = 'extrudr';
UPDATE automated_brands SET supported_regions = ARRAY['US','EU'] WHERE brand_slug = 'azurefilm';
UPDATE automated_brands SET supported_regions = ARRAY['US','EU'] WHERE brand_slug = 'recreus';
UPDATE automated_brands SET supported_regions = ARRAY['US','UK'] WHERE brand_slug = 'rigid-ink';

-- CANADIAN BRANDS
UPDATE automated_brands SET supported_regions = ARRAY['CA'] WHERE brand_slug = 'filaments-ca';

-- MULTI-REGION ASIAN BRANDS
UPDATE automated_brands SET supported_regions = ARRAY['US','EU'] WHERE brand_slug = 'esun';
UPDATE automated_brands SET supported_regions = ARRAY['US','EU','UK'] WHERE brand_slug = 'jayo';
UPDATE automated_brands SET supported_regions = ARRAY['US','EU'] WHERE brand_slug = 'sunlu';
UPDATE automated_brands SET supported_regions = ARRAY['US','EU'] WHERE brand_slug = 'sovol';
UPDATE automated_brands SET supported_regions = ARRAY['US','EU'] WHERE brand_slug = 'kingroon';
UPDATE automated_brands SET supported_regions = ARRAY['US','EU'] WHERE brand_slug = 'eryone';

-- All other US-only brands already have ['US'] so no change needed