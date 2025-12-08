-- Add GTIN and EAN columns to filaments table
ALTER TABLE public.filaments 
ADD COLUMN IF NOT EXISTS gtin text,
ADD COLUMN IF NOT EXISTS ean text;