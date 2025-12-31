-- Create scrape_decision_logs table for verbose sync logging
CREATE TABLE public.scrape_decision_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_log_id uuid REFERENCES brand_sync_logs(id) ON DELETE CASCADE,
  brand_slug text NOT NULL,
  product_id text,
  product_title text,
  decision_type text NOT NULL,
  input_data jsonb,
  output_data jsonb,
  decision_reason text,
  success boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_scrape_decision_logs_sync_log ON scrape_decision_logs(sync_log_id);
CREATE INDEX idx_scrape_decision_logs_brand ON scrape_decision_logs(brand_slug);
CREATE INDEX idx_scrape_decision_logs_product ON scrape_decision_logs(product_id);
CREATE INDEX idx_scrape_decision_logs_type ON scrape_decision_logs(decision_type);

-- Enable RLS
ALTER TABLE public.scrape_decision_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read decision logs
CREATE POLICY "Admins can read decision logs"
ON public.scrape_decision_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert logs (edge functions)
CREATE POLICY "Service role can insert decision logs"
ON public.scrape_decision_logs
FOR INSERT
WITH CHECK (true);

-- Admins can delete old logs
CREATE POLICY "Admins can delete decision logs"
ON public.scrape_decision_logs
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add comment for documentation
COMMENT ON TABLE public.scrape_decision_logs IS 'Verbose decision logging for sync functions - stores color extraction, product line, filter, and hex lookup decisions for debugging and AI analysis';