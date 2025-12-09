-- Add MPN (Manufacturer Part Number) column to filaments table
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS mpn text;