-- Extend affiliate_configs table with network-specific fields
ALTER TABLE public.affiliate_configs 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES automated_brands(id),
ADD COLUMN IF NOT EXISTS affiliate_network TEXT, -- 'amazon', 'awin', 'impact', 'shareasale', 'goaffpro', 'direct', 'none'
ADD COLUMN IF NOT EXISTS affiliate_id TEXT,
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC,
ADD COLUMN IF NOT EXISTS cookie_duration_days INTEGER,
ADD COLUMN IF NOT EXISTS tracking_url_template TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS signup_url TEXT,
ADD COLUMN IF NOT EXISTS amazon_ca_tag TEXT,
ADD COLUMN IF NOT EXISTS amazon_au_tag TEXT,
ADD COLUMN IF NOT EXISTS amazon_jp_tag TEXT,
ADD COLUMN IF NOT EXISTS awin_advertiser_id TEXT,
ADD COLUMN IF NOT EXISTS awin_affiliate_id TEXT,
ADD COLUMN IF NOT EXISTS impact_program_id TEXT,
ADD COLUMN IF NOT EXISTS impact_media_partner_id TEXT;

-- Create index on brand_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_configs_brand_id ON public.affiliate_configs(brand_id);

-- Create index on vendor_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_configs_vendor_name ON public.affiliate_configs(vendor_name);

-- Create index on affiliate_network
CREATE INDEX IF NOT EXISTS idx_affiliate_configs_network ON public.affiliate_configs(affiliate_network);