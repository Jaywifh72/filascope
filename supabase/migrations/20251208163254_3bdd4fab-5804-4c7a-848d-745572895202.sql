-- Add upc column to filaments table for UPC/barcode storage
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS upc TEXT;