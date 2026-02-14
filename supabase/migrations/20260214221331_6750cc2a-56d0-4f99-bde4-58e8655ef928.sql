
-- Create orchestration_runs table for tracking full orchestration runs
CREATE TABLE public.orchestration_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  brands_total INTEGER NOT NULL DEFAULT 0,
  brands_synced INTEGER NOT NULL DEFAULT 0,
  brands_failed TEXT[] NOT NULL DEFAULT '{}',
  total_products_updated INTEGER NOT NULL DEFAULT 0,
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('cron', 'manual')),
  triggered_by_user UUID,
  error_log JSONB,
  summary JSONB
);

-- Enable RLS
ALTER TABLE public.orchestration_runs ENABLE ROW LEVEL SECURITY;

-- Admin-only read
CREATE POLICY "Admins can read orchestration runs"
  ON public.orchestration_runs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only insert
CREATE POLICY "Admins can insert orchestration runs"
  ON public.orchestration_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin-only update
CREATE POLICY "Admins can update orchestration runs"
  ON public.orchestration_runs
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role bypass for edge functions (anon key with no JWT still needs service role)
-- The edge function uses service role key directly, so RLS is bypassed automatically.

-- Also allow anon role to insert/update for cron-triggered runs
CREATE POLICY "Anon can insert orchestration runs (cron)"
  ON public.orchestration_runs
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update orchestration runs (cron)"
  ON public.orchestration_runs
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Anon can read orchestration runs (cron)"
  ON public.orchestration_runs
  FOR SELECT
  TO anon
  USING (true);

-- Enable realtime for live progress updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.orchestration_runs;
