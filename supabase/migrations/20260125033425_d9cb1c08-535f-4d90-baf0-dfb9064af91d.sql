-- Create table for caching URL validation results
CREATE TABLE public.url_validation_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('valid', 'invalid', 'redirect', 'unknown')),
  status_code INTEGER,
  redirect_url TEXT,
  last_checked TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  check_count INTEGER DEFAULT 1,
  consecutive_failures INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_url_validation_cache_url ON public.url_validation_cache (url);
CREATE INDEX idx_url_validation_cache_status ON public.url_validation_cache (status);
CREATE INDEX idx_url_validation_cache_last_checked ON public.url_validation_cache (last_checked);

-- Enable RLS
ALTER TABLE public.url_validation_cache ENABLE ROW LEVEL SECURITY;

-- Public read access for cache lookups
CREATE POLICY "URL validation cache is publicly readable"
ON public.url_validation_cache
FOR SELECT
USING (true);

-- Only backend can insert/update (via service role)
CREATE POLICY "Service role can manage URL validation cache"
ON public.url_validation_cache
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');