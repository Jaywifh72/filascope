
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
  ADD COLUMN IF NOT EXISTS variant_available boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS tags text[],
  ADD COLUMN IF NOT EXISTS amazon_link_us text,
  ADD COLUMN IF NOT EXISTS amazon_link_uk text,
  ADD COLUMN IF NOT EXISTS amazon_link_de text,
  ADD COLUMN IF NOT EXISTS amazon_link_ca text,
  ADD COLUMN IF NOT EXISTS amazon_link_fr text,
  ADD COLUMN IF NOT EXISTS amazon_link_au text,
  ADD COLUMN IF NOT EXISTS amazon_link_jp text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS series_name text,
  ADD COLUMN IF NOT EXISTS is_discontinued boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS product_page_url text;

CREATE INDEX IF NOT EXISTS idx_printers_slug ON public.printers (slug);
CREATE INDEX IF NOT EXISTS idx_printers_brand_id ON public.printers (brand_id);
