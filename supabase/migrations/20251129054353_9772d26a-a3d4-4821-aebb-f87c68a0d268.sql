-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create printers table
CREATE TABLE public.printers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand, model)
);

ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Printers are publicly readable"
  ON public.printers FOR SELECT
  USING (true);

-- Create filaments table with comprehensive fields from CSV
CREATE TABLE public.filaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT UNIQUE,
  product_title TEXT NOT NULL,
  product_handle TEXT,
  vendor TEXT,
  material TEXT,
  published_at TIMESTAMPTZ,
  featured_image TEXT,
  variant_sku TEXT,
  variant_price DECIMAL(10,2),
  variant_available BOOLEAN DEFAULT true,
  product_url TEXT,
  amazon_link_us TEXT,
  amazon_link_uk TEXT,
  amazon_link_de TEXT,
  tds_url TEXT,
  
  -- Mechanical properties
  density_g_cm3 DECIMAL(10,3),
  tensile_strength_xy_mpa DECIMAL(10,2),
  tensile_modulus_xy_mpa DECIMAL(10,2),
  elongation_break_xy_percent DECIMAL(10,2),
  flexural_strength_mpa DECIMAL(10,2),
  shore_hardness_d DECIMAL(10,2),
  
  -- Thermal properties
  tg_c DECIMAL(10,2),
  melt_temp_c DECIMAL(10,2),
  nozzle_temp_min_c INTEGER,
  nozzle_temp_max_c INTEGER,
  nozzle_temp_sweetspot_c INTEGER,
  bed_temp_min_c INTEGER,
  bed_temp_max_c INTEGER,
  
  -- Print settings
  print_speed_max_mms INTEGER,
  fan_min_percent INTEGER,
  fan_max_percent INTEGER,
  
  -- Physical properties
  diameter_nominal_mm DECIMAL(10,3),
  net_weight_g INTEGER,
  spool_outer_d_mm DECIMAL(10,2),
  spool_width_mm DECIMAL(10,2),
  
  -- Appearance
  color_hex TEXT,
  color_family TEXT,
  finish_type TEXT,
  
  -- Compatibility flags
  is_nozzle_abrasive BOOLEAN DEFAULT false,
  recommended_nozzle_type TEXT,
  spool_ams_fit BOOLEAN,
  
  -- Ratings & scores
  ease_of_printing_score INTEGER CHECK (ease_of_printing_score BETWEEN 1 AND 10),
  dimensional_accuracy_score INTEGER CHECK (dimensional_accuracy_score BETWEEN 1 AND 10),
  strength_index DECIMAL(10,2),
  printability_index DECIMAL(10,2),
  value_score DECIMAL(10,2),
  
  -- Care requirements
  moisture_sensitivity_level TEXT,
  drying_temp_c INTEGER,
  drying_time_hours INTEGER,
  nozzle_care TEXT,
  moisture_care TEXT,
  
  -- Use cases
  use_case_tags TEXT[],
  industry_tags TEXT[],
  food_contact_rating TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.filaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Filaments are publicly readable"
  ON public.filaments FOR SELECT
  USING (true);

-- Create printer_compatibility junction table
CREATE TABLE public.printer_compatibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID REFERENCES public.printers(id) ON DELETE CASCADE,
  filament_id UUID REFERENCES public.filaments(id) ON DELETE CASCADE,
  brass_safe BOOLEAN DEFAULT true,
  ams_fit BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(printer_id, filament_id)
);

ALTER TABLE public.printer_compatibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Compatibility is publicly readable"
  ON public.printer_compatibility FOR SELECT
  USING (true);

-- Create deals table
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id UUID REFERENCES public.filaments(id) ON DELETE CASCADE,
  region TEXT NOT NULL,
  original_price DECIMAL(10,2),
  deal_price DECIMAL(10,2) NOT NULL,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  affiliate_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deals are publicly readable"
  ON public.deals FOR SELECT
  USING (true);

-- Create price_history table
CREATE TABLE public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id UUID REFERENCES public.filaments(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  region TEXT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Price history is publicly readable"
  ON public.price_history FOR SELECT
  USING (true);

-- Create user_favorites table for saved comparisons
CREATE TABLE public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  filament_id UUID REFERENCES public.filaments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, filament_id)
);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON public.user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON public.user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON public.user_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_filaments_material ON public.filaments(material);
CREATE INDEX idx_filaments_vendor ON public.filaments(vendor);
CREATE INDEX idx_filaments_price ON public.filaments(variant_price);
CREATE INDEX idx_deals_region ON public.deals(region);
CREATE INDEX idx_deals_end_date ON public.deals(end_date);
CREATE INDEX idx_price_history_filament ON public.price_history(filament_id, recorded_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_filaments_updated_at
  BEFORE UPDATE ON public.filaments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();