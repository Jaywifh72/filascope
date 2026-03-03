-- Add variant_image column to filaments table
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS variant_image TEXT;