-- Add warranty details column for storing coverage specifics
ALTER TABLE public.printers
ADD COLUMN IF NOT EXISTS warranty_coverage text DEFAULT NULL;

COMMENT ON COLUMN public.printers.warranty_coverage IS 'Brief description of what the warranty covers';