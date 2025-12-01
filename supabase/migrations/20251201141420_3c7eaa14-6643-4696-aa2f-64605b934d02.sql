-- Create discovery_runs table to track all scraping runs
CREATE TABLE IF NOT EXISTS public.discovery_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.printer_brands(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  models_found INTEGER DEFAULT 0,
  models_added INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create discovery_models table to track individual models discovered
CREATE TABLE IF NOT EXISTS public.discovery_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_run_id UUID REFERENCES public.discovery_runs(id) ON DELETE CASCADE NOT NULL,
  printer_id UUID REFERENCES public.printers(id) ON DELETE SET NULL,
  model_name TEXT NOT NULL,
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  was_new BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discovery_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_models ENABLE ROW LEVEL SECURITY;

-- Policies for discovery_runs
CREATE POLICY "Admins can manage discovery runs"
ON public.discovery_runs
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Discovery runs publicly readable"
ON public.discovery_runs
FOR SELECT
TO authenticated
USING (true);

-- Policies for discovery_models
CREATE POLICY "Admins can manage discovery models"
ON public.discovery_models
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Discovery models publicly readable"
ON public.discovery_models
FOR SELECT
TO authenticated
USING (true);

-- Add index for better performance
CREATE INDEX idx_discovery_runs_brand_id ON public.discovery_runs(brand_id);
CREATE INDEX idx_discovery_runs_started_at ON public.discovery_runs(started_at DESC);
CREATE INDEX idx_discovery_models_run_id ON public.discovery_models(discovery_run_id);
CREATE INDEX idx_discovery_models_discovered_at ON public.discovery_models(discovered_at DESC);