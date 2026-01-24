-- =============================================
-- Regional Store System - Database Infrastructure
-- =============================================

-- Table 1: brand_regional_stores
-- Links brands to their regional storefronts
CREATE TABLE public.brand_regional_stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.automated_brands(id) ON DELETE CASCADE,
  region_code TEXT NOT NULL,
  store_name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  product_url_pattern TEXT,
  currency_code TEXT NOT NULL,
  ships_from_country TEXT,
  free_shipping_threshold DECIMAL(10,2),
  estimated_shipping_days INTEGER,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT brand_regional_stores_brand_region_unique UNIQUE (brand_id, region_code),
  CONSTRAINT brand_regional_stores_region_check CHECK (region_code IN ('US', 'CA', 'UK', 'EU', 'AU', 'JP', 'CN'))
);

-- Indexes for brand_regional_stores
CREATE INDEX idx_brand_regional_stores_brand_id ON public.brand_regional_stores(brand_id);
CREATE INDEX idx_brand_regional_stores_region ON public.brand_regional_stores(region_code);
CREATE INDEX idx_brand_regional_stores_active ON public.brand_regional_stores(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.brand_regional_stores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brand_regional_stores
CREATE POLICY "Allow public read on brand_regional_stores" 
  ON public.brand_regional_stores FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated write on brand_regional_stores" 
  ON public.brand_regional_stores FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on brand_regional_stores" 
  ON public.brand_regional_stores FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on brand_regional_stores" 
  ON public.brand_regional_stores FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER update_brand_regional_stores_updated_at
  BEFORE UPDATE ON public.brand_regional_stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Table 2: currency_exchange_rates
-- =============================================
CREATE TABLE public.currency_exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  target_currency TEXT NOT NULL,
  rate DECIMAL(12,6) NOT NULL,
  inverse_rate DECIMAL(12,6) NOT NULL,
  source TEXT DEFAULT 'manual',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT currency_exchange_rates_unique UNIQUE (base_currency, target_currency),
  CONSTRAINT currency_exchange_rates_rate_positive CHECK (rate > 0),
  CONSTRAINT currency_exchange_rates_inverse_positive CHECK (inverse_rate > 0)
);

-- Enable RLS
ALTER TABLE public.currency_exchange_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for currency_exchange_rates
CREATE POLICY "Allow public read on currency_exchange_rates" 
  ON public.currency_exchange_rates FOR SELECT 
  USING (true);

-- Seed initial exchange rates
INSERT INTO public.currency_exchange_rates (base_currency, target_currency, rate, inverse_rate, source) VALUES
('USD', 'USD', 1.000000, 1.000000, 'manual'),
('USD', 'CAD', 1.360000, 0.735294, 'manual'),
('USD', 'EUR', 0.920000, 1.086957, 'manual'),
('USD', 'GBP', 0.790000, 1.265823, 'manual'),
('USD', 'AUD', 1.530000, 0.653595, 'manual'),
('USD', 'JPY', 149.500000, 0.006689, 'manual'),
('USD', 'CNY', 7.240000, 0.138122, 'manual'),
('USD', 'CHF', 0.880000, 1.136364, 'manual'),
('USD', 'SEK', 10.450000, 0.095694, 'manual'),
('USD', 'KRW', 1320.000000, 0.000758, 'manual'),
('USD', 'INR', 83.120000, 0.012031, 'manual');

-- =============================================
-- Table 3: user_region_preferences
-- =============================================
CREATE TABLE public.user_region_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  region_code TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  detected_method TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_region_preferences_has_identifier CHECK (user_id IS NOT NULL OR session_id IS NOT NULL),
  CONSTRAINT user_region_preferences_region_check CHECK (region_code IN ('US', 'CA', 'UK', 'EU', 'AU', 'JP', 'CN')),
  CONSTRAINT user_region_preferences_method_check CHECK (detected_method IN ('geolocation', 'ip', 'browser_locale', 'manual'))
);

-- Indexes
CREATE INDEX idx_user_region_preferences_user_id ON public.user_region_preferences(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_user_region_preferences_session_id ON public.user_region_preferences(session_id) WHERE session_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.user_region_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_region_preferences
CREATE POLICY "Users can read own region preferences" 
  ON public.user_region_preferences FOR SELECT 
  USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can insert region preferences" 
  ON public.user_region_preferences FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update own region preferences" 
  ON public.user_region_preferences FOR UPDATE 
  USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can delete own region preferences" 
  ON public.user_region_preferences FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_region_preferences_updated_at
  BEFORE UPDATE ON public.user_region_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();