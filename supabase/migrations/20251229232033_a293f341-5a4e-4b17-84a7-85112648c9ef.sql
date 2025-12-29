-- Create color_audit_logs table for storing audit history
CREATE TABLE public.color_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_line_id TEXT NOT NULL,
  vendor TEXT NOT NULL,
  database_count INTEGER NOT NULL,
  website_count INTEGER,
  status TEXT NOT NULL,
  sample_product_title TEXT,
  sample_product_url TEXT,
  discrepancy INTEGER,
  error_message TEXT,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  audit_run_id UUID,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('match', 'mismatch', 'website_error', 'no_url', 'bundle_skipped'))
);

-- Create indexes for efficient querying
CREATE INDEX idx_color_audit_logs_vendor ON public.color_audit_logs(vendor);
CREATE INDEX idx_color_audit_logs_status ON public.color_audit_logs(status);
CREATE INDEX idx_color_audit_logs_scraped_at ON public.color_audit_logs(scraped_at DESC);
CREATE INDEX idx_color_audit_logs_audit_run_id ON public.color_audit_logs(audit_run_id);
CREATE INDEX idx_color_audit_logs_product_line ON public.color_audit_logs(product_line_id);

-- Enable RLS
ALTER TABLE public.color_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can manage audit logs
CREATE POLICY "Admins can manage color audit logs"
ON public.color_audit_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public can read audit logs
CREATE POLICY "Color audit logs publicly readable"
ON public.color_audit_logs
FOR SELECT
USING (true);