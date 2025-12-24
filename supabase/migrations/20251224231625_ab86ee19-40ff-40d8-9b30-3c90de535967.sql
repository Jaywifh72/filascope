-- Add available_regions tracking column to filaments table
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS available_regions text[] DEFAULT '{}';

-- Create index for faster region-based queries
CREATE INDEX IF NOT EXISTS idx_filaments_available_regions ON public.filaments USING GIN(available_regions);

-- Update available_regions based on existing regional URL data for Elegoo products
UPDATE public.filaments 
SET available_regions = ARRAY_REMOVE(ARRAY[
  CASE WHEN product_url IS NOT NULL THEN 'US' END,
  CASE WHEN product_url_ca IS NOT NULL THEN 'CA' END,
  CASE WHEN product_url_eu IS NOT NULL THEN 'EU' END,
  CASE WHEN product_url_uk IS NOT NULL THEN 'UK' END,
  CASE WHEN product_url_au IS NOT NULL THEN 'AU' END,
  CASE WHEN product_url_jp IS NOT NULL THEN 'JP' END
], NULL)
WHERE vendor = 'Elegoo';