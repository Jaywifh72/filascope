-- Create a function to normalize color_hex values
CREATE OR REPLACE FUNCTION public.normalize_color_hex()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If color_hex is not null and doesn't start with #, add the prefix
  IF NEW.color_hex IS NOT NULL AND NEW.color_hex NOT LIKE '#%' THEN
    NEW.color_hex := '#' || NEW.color_hex;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically normalize color_hex on insert
CREATE TRIGGER normalize_color_hex_on_insert
  BEFORE INSERT ON public.filaments
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_color_hex();

-- Create trigger to automatically normalize color_hex on update
CREATE TRIGGER normalize_color_hex_on_update
  BEFORE UPDATE ON public.filaments
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_color_hex();