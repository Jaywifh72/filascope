-- Update normalize_product_url trigger with simpler FormFutura fix
CREATE OR REPLACE FUNCTION public.normalize_product_url()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Fix FormFutura URL: /products/{slug} -> /{slug}
  -- FormFutura uses root-level product slugs, not /products/ path
  IF NEW.product_url LIKE '%formfutura.com/products/%' THEN
    NEW.product_url := REPLACE(NEW.product_url, '/products/', '/');
  END IF;
  
  RETURN NEW;
END;
$function$;