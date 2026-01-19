-- Add coming_soon column to printers table
ALTER TABLE public.printers 
ADD COLUMN IF NOT EXISTS coming_soon BOOLEAN DEFAULT FALSE;