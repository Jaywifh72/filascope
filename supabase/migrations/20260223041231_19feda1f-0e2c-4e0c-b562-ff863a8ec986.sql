
-- Create printer_url_validations table
CREATE TABLE public.printer_url_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  printer_id UUID NOT NULL REFERENCES public.printers(id) ON DELETE CASCADE,
  region TEXT NOT NULL,
  url TEXT NOT NULL,
  status_code INTEGER,
  status TEXT NOT NULL DEFAULT 'unknown',
  redirect_url TEXT,
  error_message TEXT,
  price_found NUMERIC,
  price_in_db NUMERIC,
  price_mismatch BOOLEAN NOT NULL DEFAULT false,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT printer_url_validations_region_check CHECK (region IN ('US', 'CA', 'UK', 'EU', 'AU', 'JP')),
  CONSTRAINT printer_url_validations_status_check CHECK (status IN ('valid', 'invalid', 'redirect', 'unknown')),
  CONSTRAINT printer_url_validations_unique UNIQUE (printer_id, region)
);

-- Indexes
CREATE INDEX idx_printer_url_validations_status ON public.printer_url_validations(status);
CREATE INDEX idx_printer_url_validations_printer ON public.printer_url_validations(printer_id);
CREATE INDEX idx_printer_url_validations_mismatch ON public.printer_url_validations(price_mismatch) WHERE price_mismatch = true;

-- Enable RLS
ALTER TABLE public.printer_url_validations ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can read printer_url_validations"
  ON public.printer_url_validations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert printer_url_validations"
  ON public.printer_url_validations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update printer_url_validations"
  ON public.printer_url_validations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete printer_url_validations"
  ON public.printer_url_validations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role policy for edge function access
CREATE POLICY "Service role full access to printer_url_validations"
  ON public.printer_url_validations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
