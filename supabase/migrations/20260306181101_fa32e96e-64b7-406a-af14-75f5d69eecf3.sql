
-- Drop existing simple-schema tables (both empty, no data loss)
DROP TABLE IF EXISTS public.brand_sync_items CASCADE;
DROP TABLE IF EXISTS public.brand_sync_jobs CASCADE;

-- TABLE 1: brand_sync_jobs
CREATE TABLE public.brand_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.automated_brands(id),
  config_id uuid REFERENCES public.brand_scraping_configs(id),
  status text NOT NULL DEFAULT 'pending',
  -- Catalog stats
  total_store_products integer,
  filament_products_found integer,
  skipped_products integer,
  skip_reasons jsonb,
  -- Sync results
  new_count integer DEFAULT 0,
  changed_count integer DEFAULT 0,
  matched_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  imported_count integer DEFAULT 0,
  -- Data
  warnings text[],
  errors jsonb,
  -- Post-import
  post_import_results jsonb,
  -- Meta
  admin_user_id uuid,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_brand_sync_job_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'syncing', 'completed', 'failed') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be one of: pending, syncing, completed, failed', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_brand_sync_job_status
  BEFORE INSERT OR UPDATE ON public.brand_sync_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_brand_sync_job_status();

-- updated_at trigger
CREATE TRIGGER trg_brand_sync_jobs_updated_at
  BEFORE UPDATE ON public.brand_sync_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_brand_sync_jobs_brand_id ON public.brand_sync_jobs(brand_id);
CREATE INDEX idx_brand_sync_jobs_status ON public.brand_sync_jobs(status);
CREATE INDEX idx_brand_sync_jobs_created_at ON public.brand_sync_jobs(created_at DESC);

-- RLS
ALTER TABLE public.brand_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage brand_sync_jobs"
  ON public.brand_sync_jobs
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- TABLE 2: brand_sync_items
CREATE TABLE public.brand_sync_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.brand_sync_jobs(id) ON DELETE CASCADE,
  -- Status
  status text NOT NULL DEFAULT 'new',
  is_new boolean NOT NULL DEFAULT true,
  -- Extracted data
  extracted_data jsonb NOT NULL,
  admin_override_data jsonb,
  -- Denormalized for table display
  display_name text,
  color_name text,
  material_type text,
  color_hex text,
  color_family text,
  finish_type text,
  image_url text,
  variant_image_url text,
  -- Prices
  price_usd numeric(10,2),
  price_eur numeric(10,2),
  price_gbp numeric(10,2),
  price_cad numeric(10,2),
  price_aud numeric(10,2),
  -- Identification
  variant_sku text,
  product_handle text,
  available_regions text[],
  -- Matching
  existing_filament_id uuid REFERENCES public.filaments(id),
  price_diff jsonb,
  -- Import tracking
  inserted_filament_id uuid,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_brand_sync_item_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('new', 'price_changed', 'matched', 'imported', 'skipped', 'error') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be one of: new, price_changed, matched, imported, skipped, error', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_brand_sync_item_status
  BEFORE INSERT OR UPDATE ON public.brand_sync_items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_brand_sync_item_status();

-- updated_at trigger
CREATE TRIGGER trg_brand_sync_items_updated_at
  BEFORE UPDATE ON public.brand_sync_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_brand_sync_items_job_id ON public.brand_sync_items(job_id);
CREATE INDEX idx_brand_sync_items_status ON public.brand_sync_items(status);
CREATE INDEX idx_brand_sync_items_variant_sku ON public.brand_sync_items(variant_sku);
CREATE INDEX idx_brand_sync_items_existing_filament ON public.brand_sync_items(existing_filament_id);

-- RLS
ALTER TABLE public.brand_sync_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage brand_sync_items"
  ON public.brand_sync_items
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
