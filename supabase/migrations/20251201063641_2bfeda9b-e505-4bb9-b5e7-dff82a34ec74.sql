-- Add scraping and discovery fields to printer_brands table
ALTER TABLE public.printer_brands
ADD COLUMN IF NOT EXISTS scrape_config JSONB,
ADD COLUMN IF NOT EXISTS last_discovery_run_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS new_models_found_count INTEGER DEFAULT 0;

-- Add status field to printers table
ALTER TABLE public.printers
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_printers_status ON public.printers(status);

-- Add comment explaining scrape_config structure
COMMENT ON COLUMN public.printer_brands.scrape_config IS 'JSON config for web scraping: { "models_list_url": "https://...", "model_url_pattern": "https://.../{model}", "selectors": { "model_list": ".model-item", "specs": {...} } }';

-- Add comment for status field
COMMENT ON COLUMN public.printers.status IS 'Printer status: active, pending, discontinued, draft';