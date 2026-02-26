
ALTER TABLE public.scrape_errors 
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS url_attempted text,
  ADD COLUMN IF NOT EXISTS http_status integer;
