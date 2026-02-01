-- Add validation tracking columns to product_regional_urls
ALTER TABLE public.product_regional_urls 
ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suggested_url TEXT,
ADD COLUMN IF NOT EXISTS validation_error TEXT;

-- Add index for efficient validation queries
CREATE INDEX IF NOT EXISTS idx_product_regional_urls_validation 
ON public.product_regional_urls (last_validated_at, is_verified)
WHERE last_validated_at IS NULL OR is_verified = false;

-- Add index for region-based queries
CREATE INDEX IF NOT EXISTS idx_product_regional_urls_region 
ON public.product_regional_urls (region_code, product_type);

-- Comment on columns
COMMENT ON COLUMN public.product_regional_urls.last_validated_at IS 'Last time this URL was validated via HEAD request';
COMMENT ON COLUMN public.product_regional_urls.suggested_url IS 'Alternative URL if original returns 404 (from redirect or slug repair)';
COMMENT ON COLUMN public.product_regional_urls.validation_error IS 'Error message from last validation attempt';