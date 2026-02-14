
-- Add Impact.com-specific fields to affiliate_programs
ALTER TABLE affiliate_programs ADD COLUMN IF NOT EXISTS impact_campaign_id text DEFAULT NULL;
ALTER TABLE affiliate_programs ADD COLUMN IF NOT EXISTS impact_media_partner_id text DEFAULT NULL;
ALTER TABLE affiliate_programs ADD COLUMN IF NOT EXISTS tracking_domain text DEFAULT NULL;
ALTER TABLE affiliate_programs ADD COLUMN IF NOT EXISTS default_tracking_link text DEFAULT NULL;
ALTER TABLE affiliate_programs ADD COLUMN IF NOT EXISTS link_generation_method text DEFAULT 'url_parameter';

-- Make tracking_parameter and tracking_value nullable (Impact.com doesn't use them)
ALTER TABLE affiliate_programs ALTER COLUMN tracking_parameter DROP NOT NULL;
ALTER TABLE affiliate_programs ALTER COLUMN tracking_value DROP NOT NULL;

-- Add new fields to affiliate_discount_codes
ALTER TABLE affiliate_discount_codes ADD COLUMN IF NOT EXISTS tracking_link text DEFAULT NULL;
ALTER TABLE affiliate_discount_codes ADD COLUMN IF NOT EXISTS scope text DEFAULT 'all_stores';
ALTER TABLE affiliate_discount_codes ADD COLUMN IF NOT EXISTS coupon_source text DEFAULT NULL;

-- Add new fields to affiliate_campaigns
ALTER TABLE affiliate_campaigns ADD COLUMN IF NOT EXISTS deal_scope text DEFAULT NULL;
ALTER TABLE affiliate_campaigns ADD COLUMN IF NOT EXISTS target_audience text DEFAULT NULL;
ALTER TABLE affiliate_campaigns ADD COLUMN IF NOT EXISTS region_specific text DEFAULT NULL;
