
-- ============================================================
-- Filament Onboarding Tool Tables
-- ============================================================

-- 1. brand_scraping_configs
CREATE TABLE public.brand_scraping_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id text NOT NULL,
  brand_name text NOT NULL,
  platform text NOT NULL,
  base_url text NOT NULL,
  scrape_method text NOT NULL DEFAULT 'json_endpoint',
  adapter_key text NOT NULL UNIQUE,
  regional_url_pattern jsonb,
  variant_mapping jsonb NOT NULL,
  spec_extraction jsonb,
  default_material_type text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_brand_scraping_configs_adapter_key ON public.brand_scraping_configs (adapter_key);
CREATE INDEX idx_brand_scraping_configs_brand_id ON public.brand_scraping_configs (brand_id);

ALTER TABLE public.brand_scraping_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on brand_scraping_configs" ON public.brand_scraping_configs
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. filament_onboarding_jobs
CREATE TABLE public.filament_onboarding_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id text NOT NULL,
  config_id uuid REFERENCES public.brand_scraping_configs(id),
  source_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  raw_data jsonb,
  extracted_filaments jsonb,
  extraction_errors jsonb,
  selected_filament_ids uuid[],
  inserted_count integer DEFAULT 0,
  skipped_count integer DEFAULT 0,
  duplicate_count integer DEFAULT 0,
  admin_user_id uuid,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_onboarding_jobs_brand_id ON public.filament_onboarding_jobs (brand_id);
CREATE INDEX idx_onboarding_jobs_status ON public.filament_onboarding_jobs (status);
CREATE INDEX idx_onboarding_jobs_created_at ON public.filament_onboarding_jobs (created_at DESC);

ALTER TABLE public.filament_onboarding_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on filament_onboarding_jobs" ON public.filament_onboarding_jobs
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. filament_onboarding_items
CREATE TABLE public.filament_onboarding_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.filament_onboarding_jobs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  extracted_data jsonb NOT NULL,
  display_name text,
  color_name text,
  material_type text,
  image_url text,
  price_usd numeric,
  price_eur numeric,
  price_cad numeric,
  price_gbp numeric,
  price_aud numeric,
  variant_sku text,
  is_duplicate boolean DEFAULT false,
  existing_filament_id uuid,
  admin_override_data jsonb,
  inserted_filament_id uuid,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_onboarding_items_job_id ON public.filament_onboarding_items (job_id);
CREATE INDEX idx_onboarding_items_status ON public.filament_onboarding_items (status);
CREATE INDEX idx_onboarding_items_job_status ON public.filament_onboarding_items (job_id, status);

ALTER TABLE public.filament_onboarding_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on filament_onboarding_items" ON public.filament_onboarding_items
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_scraping_config_timestamp()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER trg_brand_scraping_configs_updated_at
  BEFORE UPDATE ON public.brand_scraping_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_scraping_config_timestamp();

CREATE OR REPLACE FUNCTION public.update_onboarding_job_timestamp()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER trg_filament_onboarding_jobs_updated_at
  BEFORE UPDATE ON public.filament_onboarding_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_onboarding_job_timestamp();
