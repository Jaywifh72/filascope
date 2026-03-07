ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS price_cny numeric;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS product_url_cn text;
ALTER TABLE public.brand_sync_items ADD COLUMN IF NOT EXISTS price_cny numeric;
ALTER TABLE public.brand_sync_items ADD COLUMN IF NOT EXISTS product_url_cn text;