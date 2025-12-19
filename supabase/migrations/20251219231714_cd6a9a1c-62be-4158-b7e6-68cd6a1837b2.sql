-- Create scrape_job_logs table for persistent debug logging
CREATE TABLE IF NOT EXISTS public.scrape_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.scrape_jobs(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
  level TEXT CHECK (level IN ('info', 'warn', 'error', 'debug')) NOT NULL,
  stage TEXT, -- 'init', 'product_discovery', 'color_fetch', 'price_fetch', 'db_upsert', etc.
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional context like product name, region, API response
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient querying by job_id and timestamp
CREATE INDEX idx_scrape_job_logs_job_id ON public.scrape_job_logs(job_id);
CREATE INDEX idx_scrape_job_logs_timestamp ON public.scrape_job_logs(timestamp DESC);
CREATE INDEX idx_scrape_job_logs_level ON public.scrape_job_logs(level);

-- Enable RLS
ALTER TABLE public.scrape_job_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs
CREATE POLICY "Admins can read scrape logs" 
ON public.scrape_job_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow edge functions (service role) to insert logs
CREATE POLICY "Service role can insert scrape logs" 
ON public.scrape_job_logs 
FOR INSERT 
WITH CHECK (true);

-- Auto-cleanup old logs after 30 days
CREATE OR REPLACE FUNCTION public.cleanup_old_scrape_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM scrape_job_logs WHERE timestamp < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;