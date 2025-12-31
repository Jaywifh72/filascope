-- Create brand scraper profiles table for AI-informed scraping
CREATE TABLE public.brand_scraper_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_slug TEXT UNIQUE NOT NULL,
  brand_id UUID REFERENCES public.automated_brands(id) ON DELETE CASCADE,
  
  -- Website Architecture Understanding
  product_structure TEXT DEFAULT 'multi_color_variants', -- 'one_product_per_color' | 'multi_color_variants' | 'hybrid'
  variant_schema JSONB DEFAULT '{}', -- { option1: 'material', option2: 'diameter', option3: 'color' }
  swatch_type TEXT DEFAULT 'none', -- 'css_color' | 'image_alt' | 'cross_product_link' | 'none'
  
  -- Extraction Patterns (AI-generated)
  title_format_pattern TEXT, -- Description for extracting product line from title
  color_extraction_rules JSONB DEFAULT '[]', -- AI-generated rules for color extraction
  product_line_extraction_rules JSONB DEFAULT '[]', -- AI-generated rules for product line extraction
  price_interpretation TEXT DEFAULT 'per_spool', -- 'per_spool' | 'per_kg' | 'varies'
  
  -- Known Mappings (AI-discovered)
  product_line_synonyms JSONB DEFAULT '{}', -- AI-discovered synonyms
  color_hex_mappings JSONB DEFAULT '{}', -- AI-discovered color hex codes
  material_patterns JSONB DEFAULT '{}', -- AI-discovered material detection patterns
  discovered_product_lines JSONB DEFAULT '[]', -- List of discovered product lines
  discovered_colors JSONB DEFAULT '[]', -- List of discovered colors with hex codes
  special_cases JSONB DEFAULT '[]', -- Special handling notes
  
  -- Learning Metadata
  last_analyzed_at TIMESTAMPTZ,
  analysis_confidence FLOAT DEFAULT 0, -- 0-1 confidence score
  sample_products JSONB DEFAULT '[]', -- Example products used for learning
  analysis_notes TEXT, -- AI-generated notes about the brand
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  last_updated_by UUID
);

-- Enable RLS
ALTER TABLE public.brand_scraper_profiles ENABLE ROW LEVEL SECURITY;

-- Admins can manage profiles
CREATE POLICY "Admins can manage scraper profiles"
ON public.brand_scraper_profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public read for edge functions (service role)
CREATE POLICY "Service role can read profiles"
ON public.brand_scraper_profiles
FOR SELECT
USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_brand_scraper_profiles_updated_at
BEFORE UPDATE ON public.brand_scraper_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for brand_slug lookups
CREATE INDEX idx_brand_scraper_profiles_brand_slug ON public.brand_scraper_profiles(brand_slug);

-- Add comment
COMMENT ON TABLE public.brand_scraper_profiles IS 'AI-generated profiles for intelligent brand scraping';