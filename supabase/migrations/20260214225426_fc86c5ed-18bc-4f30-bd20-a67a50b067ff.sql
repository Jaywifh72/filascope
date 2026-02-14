
-- Create scrape_errors table for granular error tracking
CREATE TABLE public.scrape_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id uuid REFERENCES public.filaments(id) ON DELETE SET NULL,
  brand_slug text NOT NULL,
  region text,
  error_type text,
  error_message text,
  url text,
  sync_run_id uuid,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_scrape_errors_brand_slug ON public.scrape_errors(brand_slug);
CREATE INDEX idx_scrape_errors_error_type ON public.scrape_errors(error_type);
CREATE INDEX idx_scrape_errors_created_at ON public.scrape_errors(created_at DESC);
CREATE INDEX idx_scrape_errors_unresolved ON public.scrape_errors(is_resolved) WHERE is_resolved = false;

-- Enable RLS
ALTER TABLE public.scrape_errors ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view scrape errors"
  ON public.scrape_errors FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert scrape errors"
  ON public.scrape_errors FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update scrape errors"
  ON public.scrape_errors FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete scrape errors"
  ON public.scrape_errors FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow service role (edge functions) to insert
CREATE POLICY "Service role can manage scrape errors"
  ON public.scrape_errors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.scrape_errors;
