-- Activity logging for admin actions
CREATE TABLE admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write activity logs
CREATE POLICY "Admins can manage activity logs"
ON admin_activity_log FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Scheduled task tracking
CREATE TABLE scheduled_task_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  items_processed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_log TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scheduled_task_runs ENABLE ROW LEVEL SECURITY;

-- Admins can manage, publicly readable for dashboard
CREATE POLICY "Admins can manage task runs"
ON scheduled_task_runs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Task runs publicly readable"
ON scheduled_task_runs FOR SELECT
USING (true);

-- URL validation results
CREATE TABLE url_validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  url_field TEXT NOT NULL,
  url TEXT NOT NULL,
  status_code INTEGER,
  status TEXT NOT NULL,
  redirect_url TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE url_validation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage URL validation"
ON url_validation_results FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "URL validation publicly readable"
ON url_validation_results FOR SELECT
USING (true);

-- Duplicate detection candidates
CREATE TABLE duplicate_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id_a UUID NOT NULL,
  entity_id_b UUID NOT NULL,
  confidence TEXT NOT NULL,
  match_reason TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE duplicate_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage duplicates"
ON duplicate_candidates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Duplicates publicly readable"
ON duplicate_candidates FOR SELECT
USING (true);

-- Create indexes for performance
CREATE INDEX idx_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX idx_activity_log_entity ON admin_activity_log(entity_type, entity_id);
CREATE INDEX idx_task_runs_task_name ON scheduled_task_runs(task_name);
CREATE INDEX idx_task_runs_status ON scheduled_task_runs(status);
CREATE INDEX idx_url_validation_entity ON url_validation_results(entity_type, entity_id);
CREATE INDEX idx_url_validation_status ON url_validation_results(status);
CREATE INDEX idx_duplicates_entity_type ON duplicate_candidates(entity_type);
CREATE INDEX idx_duplicates_resolved ON duplicate_candidates(resolved);