-- Extend safety_alerts table with new columns
ALTER TABLE public.safety_alerts 
ADD COLUMN IF NOT EXISTS affected_batches JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS manufacturer_statement TEXT,
ADD COLUMN IF NOT EXISTS manufacturer_contact TEXT,
ADD COLUMN IF NOT EXISTS recall_url TEXT,
ADD COLUMN IF NOT EXISTS replacement_process TEXT,
ADD COLUMN IF NOT EXISTS disposal_instructions TEXT,
ADD COLUMN IF NOT EXISTS resolution_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS community_report_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Create safety_alert_subscriptions table
CREATE TABLE IF NOT EXISTS public.safety_alert_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  alert_levels TEXT[] DEFAULT ARRAY['critical', 'warning'],
  brand_filters TEXT[] DEFAULT ARRAY[]::TEXT[],
  sms_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on safety_alert_subscriptions
ALTER TABLE public.safety_alert_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for safety_alert_subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.safety_alert_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
ON public.safety_alert_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
ON public.safety_alert_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
ON public.safety_alert_subscriptions
FOR DELETE
USING (auth.uid() = user_id);

-- Create community_safety_reports table
CREATE TABLE IF NOT EXISTS public.community_safety_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  brand TEXT NOT NULL,
  material TEXT NOT NULL,
  batch_number TEXT,
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'moderate',
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  filament_id UUID REFERENCES public.filaments(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  upvote_count INTEGER DEFAULT 0
);

-- Enable RLS on community_safety_reports
ALTER TABLE public.community_safety_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for community_safety_reports
CREATE POLICY "Community reports publicly readable"
ON public.community_safety_reports
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert reports"
ON public.community_safety_reports
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage reports"
ON public.community_safety_reports
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create community_report_upvotes table
CREATE TABLE IF NOT EXISTS public.community_report_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.community_safety_reports(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(report_id, user_id)
);

-- Enable RLS on community_report_upvotes
ALTER TABLE public.community_report_upvotes ENABLE ROW LEVEL SECURITY;

-- RLS policies for community_report_upvotes
CREATE POLICY "Upvotes publicly readable"
ON public.community_report_upvotes
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can upvote"
ON public.community_report_upvotes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own upvotes"
ON public.community_report_upvotes
FOR DELETE
USING (auth.uid() = user_id);

-- Update existing safety alert with sample enhanced data
UPDATE public.safety_alerts
SET 
  affected_batches = '["#400", "#401", "#402", "#403", "2024-08", "LOT400-403"]'::jsonb,
  manufacturer_statement = 'We have identified a contamination issue in batches produced during August 2024. We are offering full replacements for all affected spools.',
  manufacturer_contact = 'support@esun3d.com | 1-888-ESUN-3DP',
  recall_url = 'https://www.esun3d.com/recalls/pla-white-aug2024',
  replacement_process = '1. Contact support with your batch number. 2. Provide proof of purchase. 3. Receive prepaid shipping label. 4. Send spool back for full replacement.',
  disposal_instructions = 'Do not burn or incinerate. Place in regular plastic recycling or dispose with household waste. Keep away from heat sources.',
  resolution_status = 'ongoing'
WHERE brand = 'eSun' AND material = 'PLA+' AND is_active = true;