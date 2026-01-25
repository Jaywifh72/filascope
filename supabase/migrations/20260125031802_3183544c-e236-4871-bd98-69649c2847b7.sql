-- Create product_regional_slugs table for mapping product identifiers across regional stores
CREATE TABLE public.product_regional_slugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id UUID NOT NULL REFERENCES public.filaments(id) ON DELETE CASCADE,
  region_code VARCHAR(5) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  verified BOOLEAN DEFAULT false,
  http_status INTEGER,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_filament_region UNIQUE (filament_id, region_code)
);

-- Create indexes for efficient lookups
CREATE INDEX idx_regional_slugs_filament ON public.product_regional_slugs(filament_id);
CREATE INDEX idx_regional_slugs_region ON public.product_regional_slugs(region_code);
CREATE INDEX idx_regional_slugs_verified ON public.product_regional_slugs(verified) WHERE verified = true;

-- Enable RLS
ALTER TABLE public.product_regional_slugs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (slug mappings are not sensitive)
CREATE POLICY "Anyone can read regional slugs"
ON public.product_regional_slugs
FOR SELECT
USING (true);

-- Create policy for service role to manage slugs (edge functions)
CREATE POLICY "Service role can manage regional slugs"
ON public.product_regional_slugs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.product_regional_slugs IS 'Maps product slugs to region-specific slugs for accurate regional store URLs';