-- Create URL normalization function for product URLs
-- This function automatically fixes known problematic URL domains on insert/update

CREATE OR REPLACE FUNCTION public.normalize_product_url()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Skip if product_url is null
  IF NEW.product_url IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Fix eSUN domain: esun3d.com → esun3dstore.com
  -- Handles both www.esun3d.com and esun3d.com variants
  IF NEW.product_url LIKE '%esun3d.com%' 
     AND NEW.product_url NOT LIKE '%esun3dstore.com%' THEN
    NEW.product_url := REPLACE(
      REPLACE(NEW.product_url, 'www.esun3d.com', 'esun3dstore.com'),
      'esun3d.com', 'esun3dstore.com'
    );
  END IF;
  
  -- Additional brand fixes can be added here in the future
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT operations
CREATE TRIGGER normalize_product_url_on_insert
  BEFORE INSERT ON filaments
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_product_url();

-- Create trigger for UPDATE operations (only when product_url changes)
CREATE TRIGGER normalize_product_url_on_update
  BEFORE UPDATE ON filaments
  FOR EACH ROW
  WHEN (OLD.product_url IS DISTINCT FROM NEW.product_url)
  EXECUTE FUNCTION public.normalize_product_url();