-- Drop existing triggers first
DROP TRIGGER IF EXISTS normalize_color_hex_on_insert ON public.filaments;
DROP TRIGGER IF EXISTS normalize_color_hex_on_update ON public.filaments;

-- Replace the function with enhanced validation
CREATE OR REPLACE FUNCTION public.normalize_color_hex()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  hex_value TEXT;
BEGIN
  -- If color_hex is null, just return
  IF NEW.color_hex IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Remove # prefix if present for validation
  hex_value := CASE 
    WHEN NEW.color_hex LIKE '#%' THEN SUBSTRING(NEW.color_hex FROM 2)
    ELSE NEW.color_hex
  END;
  
  -- Convert to uppercase for consistency
  hex_value := UPPER(hex_value);
  
  -- Validate: must be exactly 6 hex characters (or 3 for shorthand)
  IF hex_value ~ '^[0-9A-F]{6}$' THEN
    -- Valid 6-character hex, add # prefix
    NEW.color_hex := '#' || hex_value;
  ELSIF hex_value ~ '^[0-9A-F]{3}$' THEN
    -- Valid 3-character shorthand, expand to 6 characters
    NEW.color_hex := '#' || 
      SUBSTRING(hex_value FROM 1 FOR 1) || SUBSTRING(hex_value FROM 1 FOR 1) ||
      SUBSTRING(hex_value FROM 2 FOR 1) || SUBSTRING(hex_value FROM 2 FOR 1) ||
      SUBSTRING(hex_value FROM 3 FOR 1) || SUBSTRING(hex_value FROM 3 FOR 1);
  ELSE
    -- Invalid hex value, set to null
    NEW.color_hex := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER normalize_color_hex_on_insert
  BEFORE INSERT ON public.filaments
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_color_hex();

CREATE TRIGGER normalize_color_hex_on_update
  BEFORE UPDATE ON public.filaments
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_color_hex();