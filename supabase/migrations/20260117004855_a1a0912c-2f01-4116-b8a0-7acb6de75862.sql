-- Add 'tds_parsing' to the allowed sync_type values
ALTER TABLE brand_sync_logs 
DROP CONSTRAINT brand_sync_logs_sync_type_check;

ALTER TABLE brand_sync_logs 
ADD CONSTRAINT brand_sync_logs_sync_type_check 
CHECK (sync_type = ANY (ARRAY[
  'full_scrape'::text, 
  'update_only'::text, 
  'discovery'::text, 
  'manual'::text, 
  'products'::text, 
  'prices'::text, 
  'images'::text, 
  'regional'::text, 
  'clean_slate'::text, 
  'incremental'::text, 
  'full_sync'::text,
  'tds_parsing'::text,
  'tds_discovery'::text,
  'color_extraction'::text
]));