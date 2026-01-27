-- Migration: fix_formfutura_urls
-- Fix FormFutura URLs with broken /products/ path and add trigger for future-proofing

-- 1. Fix filaments table (defensive - currently clean)
UPDATE filaments 
SET product_url = 'https://www.formfutura.com/search/?q=' || 
  REPLACE(
    REGEXP_REPLACE(product_url, '^.*/products/([^/?]+).*$', '\1'),
    '-', ' '
  )
WHERE product_url LIKE '%formfutura.com/products/%';

-- 2. Fix product_regional_urls table (defensive)
UPDATE product_regional_urls 
SET store_url = 'https://www.formfutura.com/search/?q=' || 
  REPLACE(
    REGEXP_REPLACE(store_url, '^.*/products/([^/?]+).*$', '\1'),
    '-', ' '
  )
WHERE store_url LIKE '%formfutura.com/products/%';

-- 3. Fix broken_product_urls table (1 record to fix)
UPDATE broken_product_urls 
SET product_url = 'https://www.formfutura.com/search/?q=' || 
  REPLACE(
    REGEXP_REPLACE(product_url, '^.*/products/([^/?]+).*$', '\1'),
    '-', ' '
  )
WHERE product_url LIKE '%formfutura.com/products/%';

-- 4. Fix filament_listings table (defensive)
UPDATE filament_listings 
SET product_url = 'https://www.formfutura.com/search/?q=' || 
  REPLACE(
    REGEXP_REPLACE(product_url, '^.*/products/([^/?]+).*$', '\1'),
    '-', ' '
  )
WHERE product_url LIKE '%formfutura.com/products/%';

-- 5. Update the normalize_product_url trigger to include FormFutura fix
CREATE OR REPLACE FUNCTION public.normalize_product_url()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  product_slug TEXT;
BEGIN
  -- Skip if product_url is null
  IF NEW.product_url IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Fix eSUN domain: esun3d.com → esun3dstore.com
  IF NEW.product_url LIKE '%esun3d.com%' 
     AND NEW.product_url NOT LIKE '%esun3dstore.com%' THEN
    NEW.product_url := REPLACE(
      REPLACE(NEW.product_url, 'www.esun3d.com', 'esun3dstore.com'),
      'esun3d.com', 'esun3dstore.com'
    );
  END IF;
  
  -- Fix FormFutura: /products/ path → search URL
  IF NEW.product_url LIKE '%formfutura.com/products/%' THEN
    -- Extract product slug from URL
    product_slug := REGEXP_REPLACE(NEW.product_url, '^.*/products/([^/?]+).*$', '\1');
    -- Convert to search URL with spaces instead of hyphens
    NEW.product_url := 'https://www.formfutura.com/search/?q=' || REPLACE(product_slug, '-', ' ');
  END IF;
  
  RETURN NEW;
END;
$function$;