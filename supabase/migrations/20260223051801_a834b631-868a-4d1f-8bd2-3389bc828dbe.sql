ALTER TABLE public.printers ADD COLUMN IF NOT EXISTS price_extraction_method TEXT;
ALTER TABLE public.printers ADD COLUMN IF NOT EXISTS price_confidence TEXT;
ALTER TABLE public.printers ADD COLUMN IF NOT EXISTS price_requires_review BOOLEAN DEFAULT false;