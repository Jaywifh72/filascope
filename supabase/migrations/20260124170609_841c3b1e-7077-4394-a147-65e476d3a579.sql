-- Analytics tables for UX optimization

-- Performance metrics (Core Web Vitals)
CREATE TABLE public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  rating TEXT NOT NULL,
  page_url TEXT NOT NULL,
  route TEXT NOT NULL,
  device_type TEXT NOT NULL,
  connection_type TEXT,
  session_id TEXT,
  user_id UUID,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Funnel events for conversion tracking
CREATE TABLE public.funnel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID,
  funnel_type TEXT NOT NULL,
  step_name TEXT NOT NULL,
  previous_step TEXT,
  step_order INTEGER,
  entity_id TEXT,
  entity_type TEXT,
  page_url TEXT,
  referrer TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Filter usage analytics
CREATE TABLE public.filter_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filter_type TEXT NOT NULL,
  filter_value TEXT NOT NULL,
  action TEXT NOT NULL,
  page TEXT NOT NULL,
  result_count INTEGER,
  user_id UUID,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Search analytics
CREATE TABLE public.search_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  has_results BOOLEAN NOT NULL,
  filters_applied TEXT[],
  time_to_results_ms INTEGER,
  user_id UUID,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Error logs
CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_id TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component_stack TEXT,
  page_url TEXT,
  route TEXT,
  user_agent TEXT,
  session_id TEXT,
  device_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filter_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Create insert policies (allow all inserts for analytics)
CREATE POLICY "Allow insert for all users" ON public.performance_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all users" ON public.funnel_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all users" ON public.filter_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all users" ON public.search_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all users" ON public.error_logs FOR INSERT WITH CHECK (true);

-- Create indexes for analytics queries
CREATE INDEX idx_performance_metrics_route ON public.performance_metrics(route);
CREATE INDEX idx_performance_metrics_metric_name ON public.performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_created_at ON public.performance_metrics(created_at);

CREATE INDEX idx_funnel_events_session_id ON public.funnel_events(session_id);
CREATE INDEX idx_funnel_events_funnel_type ON public.funnel_events(funnel_type);
CREATE INDEX idx_funnel_events_step_name ON public.funnel_events(step_name);
CREATE INDEX idx_funnel_events_created_at ON public.funnel_events(created_at);

CREATE INDEX idx_filter_analytics_filter_type ON public.filter_analytics(filter_type);
CREATE INDEX idx_filter_analytics_created_at ON public.filter_analytics(created_at);

CREATE INDEX idx_search_analytics_query ON public.search_analytics(query);
CREATE INDEX idx_search_analytics_created_at ON public.search_analytics(created_at);

CREATE INDEX idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at);