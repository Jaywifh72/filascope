-- Add product_line_id column for grouping color variants of the same product
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS product_line_id TEXT;

-- Create index for efficient product line grouping queries
CREATE INDEX IF NOT EXISTS idx_filaments_product_line_id ON public.filaments(product_line_id);

-- Create index for Elegoo vendor queries with product_line_id
CREATE INDEX IF NOT EXISTS idx_filaments_vendor_product_line ON public.filaments(vendor, product_line_id);