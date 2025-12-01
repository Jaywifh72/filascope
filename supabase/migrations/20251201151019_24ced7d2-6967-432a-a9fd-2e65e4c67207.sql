-- Add fields to store deep scrape data and status for pending printers
ALTER TABLE public.printers 
ADD COLUMN scraped_data JSONB,
ADD COLUMN scrape_status TEXT DEFAULT 'not_started',
ADD COLUMN scrape_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN scrape_error TEXT;

-- Add index for scrape_status for faster queries
CREATE INDEX idx_printers_scrape_status ON public.printers(scrape_status) WHERE status = 'pending';