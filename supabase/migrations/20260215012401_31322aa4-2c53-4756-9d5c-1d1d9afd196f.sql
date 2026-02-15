
-- Add live progress tracking columns to orchestration_runs
ALTER TABLE public.orchestration_runs 
  ADD COLUMN IF NOT EXISTS current_brand_slug text,
  ADD COLUMN IF NOT EXISTS current_brand_name text,
  ADD COLUMN IF NOT EXISTS current_product_name text,
  ADD COLUMN IF NOT EXISTS current_product_url text;

-- Add stack_trace column to scrape_errors for comprehensive error logging
ALTER TABLE public.scrape_errors 
  ADD COLUMN IF NOT EXISTS stack_trace text;
