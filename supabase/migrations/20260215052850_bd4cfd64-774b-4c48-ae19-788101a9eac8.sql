
-- URL Repair Queue: tracks broken URLs with diagnosis and suggested fixes
CREATE TABLE public.url_repair_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_url text NOT NULL,
  product_id uuid REFERENCES public.filaments(id) ON DELETE CASCADE,
  product_name text,
  brand_name text,
  region text DEFAULT 'US',
  url_column text, -- e.g. 'product_url', 'product_url_ca', etc.
  http_status integer,
  failure_reason text DEFAULT 'unknown', -- 'discontinued', 'slug_changed', 'domain_changed', 'store_down', 'soft_404', 'redirect_chain', 'unknown'
  diagnosis_details jsonb DEFAULT '{}'::jsonb,
  suggested_url text,
  suggestion_source text, -- 'brand_fix', 'slug_variant', 'redirect_follow', 'sitemap_search', 'manual'
  suggestion_confidence numeric DEFAULT 0, -- 0.0 to 1.0
  suggestion_validated boolean DEFAULT false, -- whether the suggested URL was verified as working
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'applied', 'ignored'
  reviewed_by uuid,
  reviewed_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_repair_queue_status ON public.url_repair_queue(status);
CREATE INDEX idx_repair_queue_product ON public.url_repair_queue(product_id);
CREATE INDEX idx_repair_queue_brand ON public.url_repair_queue(brand_name);
CREATE INDEX idx_repair_queue_region ON public.url_repair_queue(region);
CREATE INDEX idx_repair_queue_reason ON public.url_repair_queue(failure_reason);

-- Enable RLS
ALTER TABLE public.url_repair_queue ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view repair queue"
  ON public.url_repair_queue FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert repair queue"
  ON public.url_repair_queue FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update repair queue"
  ON public.url_repair_queue FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete repair queue"
  ON public.url_repair_queue FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Service role access for edge functions
CREATE POLICY "Service role full access to repair queue"
  ON public.url_repair_queue FOR ALL
  USING (auth.role() = 'service_role');

-- Updated_at trigger
CREATE TRIGGER update_repair_queue_timestamp
  BEFORE UPDATE ON public.url_repair_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_listing_timestamp();
