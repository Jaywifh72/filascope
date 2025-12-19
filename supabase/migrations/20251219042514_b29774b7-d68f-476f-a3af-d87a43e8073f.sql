-- Create scrape_jobs table for background job tracking
CREATE TABLE public.scrape_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL, -- 'bambu_pla', 'bambu_petg', etc.
  status text NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  materials text[] NOT NULL DEFAULT '{}',
  products text[] DEFAULT '{}',
  request_id text,
  dry_run boolean DEFAULT false,
  progress jsonb DEFAULT '{}'::jsonb,
  results jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scrape_jobs ENABLE ROW LEVEL SECURITY;

-- Admins can manage scrape jobs
CREATE POLICY "Admins can manage scrape jobs"
ON public.scrape_jobs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view scrape jobs (for polling status)
CREATE POLICY "Scrape jobs are publicly readable"
ON public.scrape_jobs
FOR SELECT
USING (true);

-- Create index for status queries
CREATE INDEX idx_scrape_jobs_status ON public.scrape_jobs(status);
CREATE INDEX idx_scrape_jobs_created_at ON public.scrape_jobs(created_at DESC);

-- Create trigger to update updated_at
CREATE TRIGGER update_scrape_jobs_updated_at
BEFORE UPDATE ON public.scrape_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for progress tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.scrape_jobs;