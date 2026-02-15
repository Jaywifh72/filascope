
-- Create orchestration_batches table
CREATE TABLE public.orchestration_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orchestration_id UUID NOT NULL REFERENCES public.orchestration_runs(id) ON DELETE CASCADE,
  batch_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  brand_slugs TEXT[] NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  brands_synced INTEGER NOT NULL DEFAULT 0,
  products_synced INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orchestration_batches ENABLE ROW LEVEL SECURITY;

-- Admin read/write policy
CREATE POLICY "Admins can manage orchestration batches"
  ON public.orchestration_batches FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Service role (edge functions) needs access - allow via anon for realtime
CREATE POLICY "Service role full access to batches"
  ON public.orchestration_batches FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orchestration_batches;

-- Index for lookups
CREATE INDEX idx_orchestration_batches_orchestration ON public.orchestration_batches(orchestration_id, batch_number);
CREATE INDEX idx_orchestration_batches_status ON public.orchestration_batches(status);
