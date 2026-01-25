-- Create table to track broken product URLs for admin review
CREATE TABLE public.broken_product_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_url TEXT UNIQUE NOT NULL,
  store_domain TEXT NOT NULL,
  error_type TEXT NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  new_url TEXT,
  notes TEXT,
  detection_count INTEGER DEFAULT 1,
  last_detected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.broken_product_urls ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for Edge Functions)
CREATE POLICY "Service role can manage broken URLs"
ON public.broken_product_urls
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for quick lookups
CREATE INDEX idx_broken_urls_domain ON public.broken_product_urls(store_domain);
CREATE INDEX idx_broken_urls_unresolved ON public.broken_product_urls(resolved_at) WHERE resolved_at IS NULL;