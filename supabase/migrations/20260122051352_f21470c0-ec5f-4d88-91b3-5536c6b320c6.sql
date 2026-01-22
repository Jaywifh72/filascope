-- Add warranty_years column to printers table
ALTER TABLE public.printers
ADD COLUMN IF NOT EXISTS warranty_years integer DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.printers.warranty_years IS 'Manufacturer warranty duration in years';