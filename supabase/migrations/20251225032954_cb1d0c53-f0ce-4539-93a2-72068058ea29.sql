-- Create table for detailed sync activity logging
CREATE TABLE public.sync_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.scrape_jobs(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  phase TEXT NOT NULL, -- 'regions', 'images', 'quality', 'variant_images'
  region TEXT, -- Optional: which region this action relates to
  action TEXT NOT NULL, -- 'started', 'product_created', 'product_updated', 'product_skipped', 'image_matched', 'image_failed', 'completed', 'error'
  product_id UUID REFERENCES public.filaments(id) ON DELETE SET NULL,
  product_title TEXT,
  details JSONB, -- Flexible for old/new values, error messages, counts, etc.
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warning', 'error', 'success'))
);

-- Create indexes for efficient querying
CREATE INDEX idx_sync_activity_log_job_id ON public.sync_activity_log(job_id);
CREATE INDEX idx_sync_activity_log_timestamp ON public.sync_activity_log(timestamp DESC);
CREATE INDEX idx_sync_activity_log_job_timestamp ON public.sync_activity_log(job_id, timestamp DESC);
CREATE INDEX idx_sync_activity_log_level ON public.sync_activity_log(level);

-- Enable RLS but allow service role full access
ALTER TABLE public.sync_activity_log ENABLE ROW LEVEL SECURITY;

-- Allow admins to read activity logs
CREATE POLICY "Admins can view sync activity logs"
ON public.sync_activity_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role has full access to sync activity logs"
ON public.sync_activity_log
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_activity_log;

-- Add comment for documentation
COMMENT ON TABLE public.sync_activity_log IS 'Detailed activity log for Elegoo sync operations, enabling real-time progress monitoring';
COMMENT ON COLUMN public.sync_activity_log.phase IS 'Sync phase: regions, images, quality, variant_images';
COMMENT ON COLUMN public.sync_activity_log.action IS 'Action type: started, completed, product_created, product_updated, product_skipped, image_matched, image_failed, error';
COMMENT ON COLUMN public.sync_activity_log.level IS 'Log level: info, warning, error, success';