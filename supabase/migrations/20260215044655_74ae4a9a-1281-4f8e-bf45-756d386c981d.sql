
-- Validation runs tracking
CREATE TABLE public.validation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  total_checks integer DEFAULT 0,
  valid_count integer DEFAULT 0,
  broken_count integer DEFAULT 0,
  redirect_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  timeout_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'running',
  filter_brand text,
  filter_region text,
  triggered_by text DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.validation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage validation_runs"
  ON public.validation_runs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Buy button validation log
CREATE TABLE public.buy_button_validation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_run_id uuid NOT NULL REFERENCES public.validation_runs(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  product_name text,
  brand_name text,
  region text NOT NULL,
  store_url text,
  http_status_code integer,
  validation_status text NOT NULL DEFAULT 'unchecked',
  error_message text,
  response_time_ms integer,
  redirect_url text,
  checked_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.buy_button_validation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage buy_button_validation_log"
  ON public.buy_button_validation_log FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_validation_log_product ON public.buy_button_validation_log(product_id);
CREATE INDEX idx_validation_log_region ON public.buy_button_validation_log(region);
CREATE INDEX idx_validation_log_status ON public.buy_button_validation_log(validation_status);
CREATE INDEX idx_validation_log_run ON public.buy_button_validation_log(validation_run_id);
CREATE INDEX idx_validation_runs_status ON public.validation_runs(status);
