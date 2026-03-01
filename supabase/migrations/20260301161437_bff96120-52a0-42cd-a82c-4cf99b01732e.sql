-- Drop the expression-based unique index that can't be used with ON CONFLICT
DROP INDEX IF EXISTS public.search_console_data_unique;

-- Create a plain unique constraint on the raw columns
ALTER TABLE public.search_console_data
  ADD CONSTRAINT search_console_data_date_query_page_country_device_key
  UNIQUE (date, query, page, country, device);