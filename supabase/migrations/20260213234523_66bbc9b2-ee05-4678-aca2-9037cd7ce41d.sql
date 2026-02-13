
-- ============================================================
-- Affiliate Management System — Full Migration
-- ============================================================

-- 1. affiliate_programs
CREATE TABLE public.affiliate_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.automated_brands(id) ON DELETE CASCADE,
  brand_name text NOT NULL,
  region_code text NOT NULL,
  affiliate_network text NOT NULL,
  affiliate_id text,
  referral_handle text,
  account_email text,
  portal_url text,
  store_base_url text NOT NULL,
  tracking_parameter text NOT NULL,
  tracking_value text NOT NULL,
  link_template text NOT NULL,
  commission_rate numeric(5,2),
  commission_type text DEFAULT 'percentage',
  commission_notes text,
  cookie_duration_hours integer DEFAULT 24,
  cart_persistence_days integer,
  attribution_model text DEFAULT 'last_click',
  payout_schedule text,
  payout_method text,
  payout_currency text,
  deep_linking_supported boolean DEFAULT true,
  account_status text DEFAULT 'active',
  status_notes text,
  is_active boolean DEFAULT true,
  program_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (brand_name, region_code)
);

-- 2. affiliate_program_restrictions
CREATE TABLE public.affiliate_program_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE CASCADE,
  restriction_type text NOT NULL,
  description text NOT NULL,
  severity text DEFAULT 'mandatory',
  created_at timestamptz DEFAULT now()
);

-- 3. affiliate_discount_codes
CREATE TABLE public.affiliate_discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE CASCADE,
  code text,
  discount_type text,
  discount_value numeric(10,2),
  description text,
  display_text text,
  applicable_products text[],
  min_purchase_amount numeric(10,2),
  max_uses integer,
  is_exclusive boolean DEFAULT false,
  is_assigned boolean DEFAULT false,
  assignment_notes text,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  posting_restrictions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. affiliate_campaigns
CREATE TABLE public.affiliate_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE CASCADE,
  campaign_name text NOT NULL,
  campaign_description text,
  campaign_url text,
  campaign_type text DEFAULT 'promotion',
  associated_discount_code_id uuid REFERENCES public.affiliate_discount_codes(id),
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean DEFAULT true,
  creative_asset_count integer DEFAULT 0,
  creative_assets_location text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. affiliate_clicks
CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.affiliate_programs(id),
  brand_name text NOT NULL,
  region_code text NOT NULL,
  product_type text,
  product_id uuid,
  product_name text,
  source_page text NOT NULL,
  source_component text,
  destination_url text NOT NULL,
  session_id text,
  user_agent text,
  ip_country text,
  clicked_at timestamptz DEFAULT now(),
  utm_source text DEFAULT 'filascope',
  utm_medium text DEFAULT 'affiliate',
  utm_campaign text
);

-- 6. affiliate_product_overrides
CREATE TABLE public.affiliate_product_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE CASCADE,
  product_id uuid,
  product_handle text,
  custom_affiliate_url text,
  is_excluded boolean DEFAULT false,
  override_commission_rate numeric(5,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_program_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_product_overrides ENABLE ROW LEVEL SECURITY;

-- Programs: public read, admin write
CREATE POLICY "Anyone can read affiliate_programs" ON public.affiliate_programs FOR SELECT USING (true);
CREATE POLICY "Admins can insert affiliate_programs" ON public.affiliate_programs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update affiliate_programs" ON public.affiliate_programs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete affiliate_programs" ON public.affiliate_programs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Restrictions: public read, admin write
CREATE POLICY "Anyone can read affiliate_program_restrictions" ON public.affiliate_program_restrictions FOR SELECT USING (true);
CREATE POLICY "Admins can insert affiliate_program_restrictions" ON public.affiliate_program_restrictions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update affiliate_program_restrictions" ON public.affiliate_program_restrictions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete affiliate_program_restrictions" ON public.affiliate_program_restrictions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Discount codes: public read, admin write
CREATE POLICY "Anyone can read affiliate_discount_codes" ON public.affiliate_discount_codes FOR SELECT USING (true);
CREATE POLICY "Admins can insert affiliate_discount_codes" ON public.affiliate_discount_codes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update affiliate_discount_codes" ON public.affiliate_discount_codes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete affiliate_discount_codes" ON public.affiliate_discount_codes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Campaigns: public read, admin write
CREATE POLICY "Anyone can read affiliate_campaigns" ON public.affiliate_campaigns FOR SELECT USING (true);
CREATE POLICY "Admins can insert affiliate_campaigns" ON public.affiliate_campaigns FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update affiliate_campaigns" ON public.affiliate_campaigns FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete affiliate_campaigns" ON public.affiliate_campaigns FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Clicks: public insert (tracking), admin-only read
CREATE POLICY "Anyone can insert affiliate_clicks" ON public.affiliate_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can read affiliate_clicks" ON public.affiliate_clicks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Product overrides: public read, admin write
CREATE POLICY "Anyone can read affiliate_product_overrides" ON public.affiliate_product_overrides FOR SELECT USING (true);
CREATE POLICY "Admins can insert affiliate_product_overrides" ON public.affiliate_product_overrides FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update affiliate_product_overrides" ON public.affiliate_product_overrides FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete affiliate_product_overrides" ON public.affiliate_product_overrides FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_affiliate_programs_brand_name ON public.affiliate_programs (brand_name);
CREATE INDEX idx_affiliate_programs_region_code ON public.affiliate_programs (region_code);
CREATE INDEX idx_affiliate_programs_brand_region ON public.affiliate_programs (brand_name, region_code);

CREATE INDEX idx_affiliate_clicks_clicked_at ON public.affiliate_clicks (clicked_at);
CREATE INDEX idx_affiliate_clicks_brand_name ON public.affiliate_clicks (brand_name);
CREATE INDEX idx_affiliate_clicks_program_id ON public.affiliate_clicks (program_id);
CREATE INDEX idx_affiliate_clicks_region_code ON public.affiliate_clicks (region_code);
CREATE INDEX idx_affiliate_clicks_source_page ON public.affiliate_clicks (source_page);

CREATE INDEX idx_affiliate_discount_codes_active ON public.affiliate_discount_codes (program_id, is_active);
CREATE INDEX idx_affiliate_campaigns_active ON public.affiliate_campaigns (program_id, is_active);

-- ============================================================
-- Triggers (reuse existing update_updated_at_column if exists, else create)
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_affiliate_programs_updated_at
  BEFORE UPDATE ON public.affiliate_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_discount_codes_updated_at
  BEFORE UPDATE ON public.affiliate_discount_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_campaigns_updated_at
  BEFORE UPDATE ON public.affiliate_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Seed Data: Anycubic CA
-- ============================================================

INSERT INTO public.affiliate_programs (
  brand_name, region_code, affiliate_network, affiliate_id, referral_handle,
  account_email, portal_url, store_base_url, tracking_parameter, tracking_value,
  link_template, commission_rate, commission_type, commission_notes,
  cookie_duration_hours, cart_persistence_days, attribution_model,
  payout_schedule, payout_method, payout_currency, deep_linking_supported,
  account_status, status_notes
) VALUES (
  'Anycubic', 'CA', 'GoAffPro', '19374300', 'JEANJACQUESBOILEAU',
  'Admin@Filascope.com', 'anycubic-ca.goaffpro.com', 'https://ca.anycubic.com',
  'ref', 'JEANJACQUESBOILEAU',
  '{store_url}{path}?ref={tracking_value}', 5.00, 'percentage',
  'Up to 5% on all qualifying products', 24, 89, 'last_click',
  'Monthly — approximately 60 days after month end', 'PayPal', 'CAD',
  true, 'pending_verification',
  'Under verification (24-48 hrs). Link format confirmed via Product Links tool.'
);

-- Restrictions
WITH prog AS (SELECT id FROM public.affiliate_programs WHERE brand_name = 'Anycubic' AND region_code = 'CA')
INSERT INTO public.affiliate_program_restrictions (program_id, restriction_type, description, severity) VALUES
  ((SELECT id FROM prog), 'ppc_prohibited', 'No bidding on brand keywords or paid search', 'mandatory'),
  ((SELECT id FROM prog), 'coupon_sites_prohibited', 'Posting on coupon websites is strictly prohibited', 'mandatory'),
  ((SELECT id FROM prog), 'trademark_restriction', 'Cannot use Anycubic trademarks in domains or social IDs', 'mandatory'),
  ((SELECT id FROM prog), 'redirect_links_prohibited', 'Indirect links without user action are prohibited', 'mandatory'),
  ((SELECT id FROM prog), 'incentivized_traffic_prohibited', 'Offering incentives for using referral links is prohibited', 'mandatory'),
  ((SELECT id FROM prog), 'ftc_disclosure_required', 'Must clearly state affiliate participation on site', 'mandatory'),
  ((SELECT id FROM prog), 'content_restriction', 'Site must not contain explicit, violent, or illegal content', 'mandatory'),
  ((SELECT id FROM prog), 'mobile_app_approval', 'Require separate approval; must be free to download', 'mandatory');

-- Discount code placeholder
WITH prog AS (SELECT id FROM public.affiliate_programs WHERE brand_name = 'Anycubic' AND region_code = 'CA')
INSERT INTO public.affiliate_discount_codes (program_id, is_assigned, assignment_notes, posting_restrictions) VALUES
  ((SELECT id FROM prog), false, 'Not yet assigned. Request via Contact Us form on portal.', 'Posting coupon codes on coupon websites is strictly prohibited. Click-to-reveal coupon mechanisms are also prohibited.');

-- Campaigns
WITH prog AS (SELECT id FROM public.affiliate_programs WHERE brand_name = 'Anycubic' AND region_code = 'CA')
INSERT INTO public.affiliate_campaigns (program_id, campaign_name, campaign_description, campaign_type, is_active) VALUES
  ((SELECT id FROM prog), 'Kobra X New Product Launch', 'Deposit $15, Get $45 Off, CAD $390 Early Bird', 'launch', true),
  ((SELECT id FROM prog), 'Kobra X Coming Soon', 'Anycubic New Product Launch', 'launch', true),
  ((SELECT id FROM prog), 'Christmas Filament/Resin Sale', 'Bulk sale from $12.00/kg', 'seasonal', true),
  ((SELECT id FROM prog), 'Kobra S1 Max Combo', 'Extra $42 off with code KS1MC + Free 2 PLA', 'promotion', true);
