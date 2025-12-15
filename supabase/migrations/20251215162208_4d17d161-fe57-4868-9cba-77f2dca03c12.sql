-- Add sync tracking columns to filaments table
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS external_data_hash text;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS last_external_sync_at timestamptz;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS sync_status text DEFAULT 'pending';
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS user_override_fields text[];
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS variant_compare_at_price numeric;

-- Create sync_logs table for run tracking
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL,
  data_source text NOT NULL,
  status text DEFAULT 'running',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  records_fetched integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  duration_seconds numeric,
  success_details jsonb,
  error_message text
);

-- Enable RLS on sync_logs
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can manage sync_logs
CREATE POLICY "Admins can manage sync_logs" ON public.sync_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public can view sync_logs
CREATE POLICY "Sync logs publicly readable" ON public.sync_logs
  FOR SELECT USING (true);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_filaments_sync_status ON public.filaments(sync_status);
CREATE INDEX IF NOT EXISTS idx_filaments_last_sync ON public.filaments(last_external_sync_at);
CREATE INDEX IF NOT EXISTS idx_filaments_external_hash ON public.filaments(external_data_hash);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON public.sync_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_data_source ON public.sync_logs(data_source);