-- Fix security warning: Set search_path for the duplicate prevention function
CREATE OR REPLACE FUNCTION prevent_printer_name_duplicates()
RETURNS TRIGGER AS $$
DECLARE
  base_model_name TEXT;
  duplicate_count INTEGER;
BEGIN
  -- Check if the model name ends with " 3D Printer"
  IF NEW.model_name LIKE '% 3D Printer' THEN
    -- Extract the base model name (without " 3D Printer")
    base_model_name := REPLACE(NEW.model_name, ' 3D Printer', '');
    
    -- Check if a printer with the base name already exists for this brand
    SELECT COUNT(*) INTO duplicate_count
    FROM printers
    WHERE brand_id = NEW.brand_id
      AND model_name = base_model_name
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    IF duplicate_count > 0 THEN
      RAISE EXCEPTION 'Duplicate printer detected: A printer named "%" already exists for this brand. Cannot add "%" as it would create a duplicate.', 
        base_model_name, NEW.model_name;
    END IF;
  END IF;
  
  -- Also check the reverse: if adding a base name when "X 3D Printer" exists
  SELECT COUNT(*) INTO duplicate_count
  FROM printers
  WHERE brand_id = NEW.brand_id
    AND model_name = NEW.model_name || ' 3D Printer'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Duplicate printer detected: A printer named "% 3D Printer" already exists for this brand. Cannot add "%" as it would create a duplicate.', 
      NEW.model_name, NEW.model_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;