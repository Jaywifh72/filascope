-- Add manual verification columns to url_validation_results
ALTER TABLE public.url_validation_results
ADD COLUMN manually_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN verified_by UUID REFERENCES auth.users(id);