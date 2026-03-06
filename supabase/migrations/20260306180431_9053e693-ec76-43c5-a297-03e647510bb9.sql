
-- brand_sync_jobs: stores catalog sync job metadata
CREATE TABLE public.brand_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.automated_brands(id) ON DELETE CASCADE NOT NULL,
  brand_slug text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_seconds numeric,
  catalog_stats jsonb,
  sync_results_summary jsonb,
  warnings text[],
  triggered_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage brand_sync_jobs"
  ON public.brand_sync_jobs
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- brand_sync_items: stores per-filament sync results
CREATE TABLE public.brand_sync_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.brand_sync_jobs(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'new',
  extracted_data jsonb NOT NULL,
  display_name text,
  color_name text,
  material_type text,
  image_url text,
  prices jsonb,
  variant_sku text,
  is_new boolean NOT NULL DEFAULT true,
  existing_filament_id uuid REFERENCES public.filaments(id) ON DELETE SET NULL,
  price_diff jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_sync_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage brand_sync_items"
  ON public.brand_sync_items
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_brand_sync_jobs_brand_id ON public.brand_sync_jobs(brand_id);
CREATE INDEX idx_brand_sync_jobs_status ON public.brand_sync_jobs(status);
CREATE INDEX idx_brand_sync_items_job_id ON public.brand_sync_items(job_id);
CREATE INDEX idx_brand_sync_items_status ON public.brand_sync_items(status);
CREATE INDEX idx_brand_sync_items_existing_filament ON public.brand_sync_items(existing_filament_id);
