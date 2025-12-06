-- Add regional price columns for global coverage
ALTER TABLE public.printers
ADD COLUMN IF NOT EXISTS current_price_cad_store numeric,
ADD COLUMN IF NOT EXISTS current_price_eur_store numeric,
ADD COLUMN IF NOT EXISTS current_price_gbp_store numeric,
ADD COLUMN IF NOT EXISTS current_price_aud_store numeric,
ADD COLUMN IF NOT EXISTS current_price_jpy_store numeric,
ADD COLUMN IF NOT EXISTS current_price_cad_amazon numeric,
ADD COLUMN IF NOT EXISTS current_price_eur_amazon numeric,
ADD COLUMN IF NOT EXISTS current_price_gbp_amazon numeric,
ADD COLUMN IF NOT EXISTS current_price_aud_amazon numeric,
ADD COLUMN IF NOT EXISTS current_price_jpy_amazon numeric;

-- Add regional store URLs
ALTER TABLE public.printers
ADD COLUMN IF NOT EXISTS official_store_url_ca text,
ADD COLUMN IF NOT EXISTS official_store_url_eu text,
ADD COLUMN IF NOT EXISTS official_store_url_uk text,
ADD COLUMN IF NOT EXISTS official_store_url_au text,
ADD COLUMN IF NOT EXISTS official_store_url_jp text,
ADD COLUMN IF NOT EXISTS amazon_url_de text,
ADD COLUMN IF NOT EXISTS amazon_url_au text,
ADD COLUMN IF NOT EXISTS amazon_url_jp text;

-- Add last price update timestamp
ALTER TABLE public.printers
ADD COLUMN IF NOT EXISTS prices_last_updated_at timestamp with time zone;