-- Add redirect_url column to store redirect destinations
ALTER TABLE public.url_validation_results 
ADD COLUMN IF NOT EXISTS redirect_url TEXT;