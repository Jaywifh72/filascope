-- Global sync runs tracking table
-- Stores history and live progress for the global-brand-sync edge function

CREATE TABLE IF NOT EXISTS global_sync_runs (
  id             uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at     timestamptz NOT NULL,
  completed_at   timestamptz,
  status         text    NOT NULL DEFAULT 'running',  -- running | completed | failed
  mode           text    NOT NULL DEFAULT 'filaments', -- filaments | printers | both
  scope          text    NOT NULL DEFAULT 'gaps_only', -- full | gaps_only | prices_only
  -- Live progress fields (updated in-flight)
  current_brand  text,
  current_phase  text,
  progress_done  int     DEFAULT 0,
  progress_total int     DEFAULT 0,
  -- Results
  result         jsonb,
  error          text,
  created_at     timestamptz DEFAULT now()
);

-- Index for fast status queries
CREATE INDEX IF NOT EXISTS idx_global_sync_runs_status    ON global_sync_runs (status);
CREATE INDEX IF NOT EXISTS idx_global_sync_runs_started   ON global_sync_runs (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_sync_runs_completed ON global_sync_runs (completed_at DESC);

-- Constraint: only one run in 'running' state at a time (advisory — enforced by app logic)
-- RLS: allow service role full access
ALTER TABLE global_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON global_sync_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
