DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'automated_brands_brand_name_key') THEN
    ALTER TABLE automated_brands ADD CONSTRAINT automated_brands_brand_name_key UNIQUE (brand_name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'automated_brands_brand_slug_key') THEN
    ALTER TABLE automated_brands ADD CONSTRAINT automated_brands_brand_slug_key UNIQUE (brand_slug);
  END IF;
END $$;

ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS has_api boolean DEFAULT false;
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS products_with_urls integer DEFAULT 0;
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS api_endpoint text;
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS products_url text;
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS product_url_pattern text;
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS auto_create_products boolean DEFAULT true;
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS batch_size integer DEFAULT 40;
