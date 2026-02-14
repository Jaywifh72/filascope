
-- Phase 1A: Create brand_affiliate_aliases table
CREATE TABLE public.brand_affiliate_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_vendor_name text NOT NULL,
  affiliate_brand_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_vendor_name)
);

ALTER TABLE public.brand_affiliate_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read brand_affiliate_aliases"
  ON public.brand_affiliate_aliases FOR SELECT USING (true);

CREATE POLICY "Admins can manage brand_affiliate_aliases"
  ON public.brand_affiliate_aliases FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed initial mappings
INSERT INTO public.brand_affiliate_aliases (product_vendor_name, affiliate_brand_name) VALUES
  ('eSun', 'eSUN'),
  ('Creality', 'Creality'),
  ('ELEGOO', 'Elegoo'),
  ('Eryone', 'Eryone'),
  ('Overture', 'Overture'),
  ('Proto-Pasta', 'Proto-Pasta'),
  ('KingRoon', 'KingRoon'),
  ('Anycubic', 'Anycubic');

-- Phase 1B: Add product_url_domains column to affiliate_programs
ALTER TABLE public.affiliate_programs ADD COLUMN IF NOT EXISTS product_url_domains text[] DEFAULT NULL;
