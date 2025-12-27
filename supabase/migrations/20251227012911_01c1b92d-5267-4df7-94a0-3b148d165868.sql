-- Fix brand_sync_logs check constraint to accept all sync types
ALTER TABLE public.brand_sync_logs DROP CONSTRAINT IF EXISTS brand_sync_logs_sync_type_check;

ALTER TABLE public.brand_sync_logs 
ADD CONSTRAINT brand_sync_logs_sync_type_check 
CHECK (sync_type = ANY (ARRAY['full_scrape', 'update_only', 'discovery', 'manual', 'products', 'prices', 'images', 'regional']));

-- Update Overture to use Firecrawl platform type
UPDATE public.automated_brands 
SET platform_type = 'firecrawl',
    notes = COALESCE(notes, '') || ' | Switched to Firecrawl due to WooCommerce API 400 errors'
WHERE brand_slug = 'overture';