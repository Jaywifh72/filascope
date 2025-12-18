-- Phase 2: Add regional price and URL columns to filaments table

-- Regional prices (actual prices from regional stores, not converted)
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS price_cad numeric;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS price_eur numeric;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS price_gbp numeric;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS price_aud numeric;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS price_jpy numeric;

-- Regional product URLs (some products have different slugs per region)
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS product_url_ca text;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS product_url_uk text;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS product_url_eu text;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS product_url_au text;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS product_url_jp text;

-- Regional price last updated timestamps
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS regional_prices_updated_at timestamp with time zone;

-- URL validation tracking
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS url_validated_at timestamp with time zone;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS url_validation_status text; -- 'valid', 'invalid', 'redirect', 'not_found'

-- Create index for efficient querying of filaments needing price updates
CREATE INDEX IF NOT EXISTS idx_filaments_regional_prices_updated 
ON public.filaments (regional_prices_updated_at NULLS FIRST, vendor);

-- Create index for URL validation queries
CREATE INDEX IF NOT EXISTS idx_filaments_url_validation 
ON public.filaments (url_validation_status, url_validated_at NULLS FIRST);