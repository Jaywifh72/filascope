
-- Add missing MSRP columns to printers table
ALTER TABLE public.printers ADD COLUMN IF NOT EXISTS msrp_gbp numeric;
ALTER TABLE public.printers ADD COLUMN IF NOT EXISTS msrp_aud numeric;
ALTER TABLE public.printers ADD COLUMN IF NOT EXISTS msrp_jpy numeric;
