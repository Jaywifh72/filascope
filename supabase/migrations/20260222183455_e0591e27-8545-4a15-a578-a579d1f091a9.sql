
-- ============================================================
-- STEP 1: Create accessories table
-- ============================================================
CREATE TABLE public.accessories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  name text NOT NULL,
  slug text,
  category text NOT NULL DEFAULT 'general',
  subcategory text,
  description text,
  sku text,
  image_url text,
  product_url text,
  product_url_ca text,
  product_url_uk text,
  product_url_eu text,
  product_url_au text,
  product_url_jp text,
  variant_id text,
  variant_title text,
  variant_sku text,
  variant_price numeric,
  variant_compare_at_price numeric,
  variant_available boolean,
  compatible_printers text[],
  compatible_materials text[],
  specifications jsonb DEFAULT '{}',
  amazon_link_us text,
  amazon_link_uk text,
  amazon_link_de text,
  amazon_link_ca text,
  amazon_link_fr text,
  amazon_link_es text,
  amazon_link_it text,
  amazon_link_nl text,
  amazon_link_be text,
  amazon_link_au text,
  amazon_link_jp text,
  tags text[],
  persona_tags text[],
  primary_data_source text,
  external_sources jsonb,
  data_confidence_score numeric,
  last_external_sync_at timestamptz,
  sync_status text,
  sync_error_log text,
  requires_manual_review boolean DEFAULT false,
  validated_by_user boolean DEFAULT false,
  user_override_fields text[],
  external_data_hash text,
  local_data_hash text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view accessories" ON public.accessories
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert accessories" ON public.accessories
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update accessories" ON public.accessories
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete accessories" ON public.accessories
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_accessories_brand ON public.accessories(brand);
CREATE INDEX idx_accessories_category ON public.accessories(category);
CREATE INDEX idx_accessories_slug ON public.accessories(slug);
CREATE INDEX idx_accessories_created ON public.accessories(created_at DESC);

CREATE TRIGGER set_accessories_updated_at
  BEFORE UPDATE ON public.accessories
  FOR EACH ROW EXECUTE FUNCTION public.update_listing_timestamp();

-- ============================================================
-- STEP 2: Extend filament_listings for multi-product support
-- ============================================================
ALTER TABLE public.filament_listings
  ADD COLUMN IF NOT EXISTS printer_id uuid REFERENCES public.printers(id),
  ADD COLUMN IF NOT EXISTS accessory_id uuid REFERENCES public.accessories(id),
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'filament';

CREATE INDEX idx_filament_listings_printer_id ON public.filament_listings(printer_id);
CREATE INDEX idx_filament_listings_accessory_id ON public.filament_listings(accessory_id);
CREATE INDEX idx_filament_listings_product_type ON public.filament_listings(product_type);

ALTER TABLE public.filament_listings
  ADD CONSTRAINT filament_listings_one_product_check CHECK (
    (CASE WHEN filament_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN printer_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN accessory_id IS NOT NULL THEN 1 ELSE 0 END) <= 1
  );

-- ============================================================
-- STEP 3: Extend price_history for multi-product support
-- ============================================================
ALTER TABLE public.price_history
  ADD COLUMN IF NOT EXISTS printer_id uuid REFERENCES public.printers(id),
  ADD COLUMN IF NOT EXISTS accessory_id uuid REFERENCES public.accessories(id),
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'filament';

CREATE INDEX idx_price_history_printer_id ON public.price_history(printer_id);
CREATE INDEX idx_price_history_accessory_id ON public.price_history(accessory_id);
CREATE INDEX idx_price_history_product_type ON public.price_history(product_type);

-- ============================================================
-- STEP 4: Add columns to printers table
-- ============================================================
ALTER TABLE public.printers
  ADD COLUMN IF NOT EXISTS product_url text,
  ADD COLUMN IF NOT EXISTS product_url_ca text,
  ADD COLUMN IF NOT EXISTS product_url_uk text,
  ADD COLUMN IF NOT EXISTS product_url_eu text,
  ADD COLUMN IF NOT EXISTS product_url_au text,
  ADD COLUMN IF NOT EXISTS product_url_jp text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS variant_id text,
  ADD COLUMN IF NOT EXISTS variant_title text,
  ADD COLUMN IF NOT EXISTS variant_sku text,
  ADD COLUMN IF NOT EXISTS variant_price numeric,
  ADD COLUMN IF NOT EXISTS variant_compare_at_price numeric,
  ADD COLUMN IF NOT EXISTS variant_available boolean,
  ADD COLUMN IF NOT EXISTS tags text[],
  ADD COLUMN IF NOT EXISTS amazon_link_us text,
  ADD COLUMN IF NOT EXISTS amazon_link_uk text,
  ADD COLUMN IF NOT EXISTS amazon_link_de text,
  ADD COLUMN IF NOT EXISTS amazon_link_ca text,
  ADD COLUMN IF NOT EXISTS amazon_link_fr text,
  ADD COLUMN IF NOT EXISTS amazon_link_es text,
  ADD COLUMN IF NOT EXISTS amazon_link_it text,
  ADD COLUMN IF NOT EXISTS amazon_link_nl text,
  ADD COLUMN IF NOT EXISTS amazon_link_be text,
  ADD COLUMN IF NOT EXISTS amazon_link_au text,
  ADD COLUMN IF NOT EXISTS amazon_link_jp text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_printers_brand_id ON public.printers(brand_id);
CREATE INDEX IF NOT EXISTS idx_printers_slug ON public.printers(slug);
