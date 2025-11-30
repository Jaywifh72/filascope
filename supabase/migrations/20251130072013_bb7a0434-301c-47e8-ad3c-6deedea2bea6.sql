-- Create affiliate_configs table for storing affiliate link patterns
CREATE TABLE public.affiliate_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name text NOT NULL UNIQUE,
  affiliate_url_pattern text,
  amazon_us_tag text,
  amazon_uk_tag text,
  amazon_de_tag text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliate_configs ENABLE ROW LEVEL SECURITY;

-- Admins can manage affiliate configs
CREATE POLICY "Admins can view affiliate configs"
  ON public.affiliate_configs
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert affiliate configs"
  ON public.affiliate_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update affiliate configs"
  ON public.affiliate_configs
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete affiliate configs"
  ON public.affiliate_configs
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_affiliate_configs_updated_at
  BEFORE UPDATE ON public.affiliate_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();