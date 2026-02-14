export interface AffiliateProgram {
  id: string;
  brand_id: string | null;
  brand_name: string;
  region_code: string;
  affiliate_network: string;
  affiliate_id: string | null;
  referral_handle: string | null;
  account_email: string | null;
  portal_url: string | null;
  store_base_url: string;
  tracking_parameter: string;
  tracking_value: string;
  link_template: string;
  commission_rate: number | null;
  commission_type: string | null;
  commission_notes: string | null;
  cookie_duration_hours: number | null;
  cart_persistence_days: number | null;
  attribution_model: string | null;
  payout_schedule: string | null;
  payout_method: string | null;
  payout_currency: string | null;
  deep_linking_supported: boolean | null;
  account_status: string | null;
  status_notes: string | null;
  is_active: boolean | null;
  program_notes: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  commission_tiers: CommissionTier[] | any | null;
  source_parameter: string | null;
  source_value: string | null;
  impact_campaign_id: string | null;
  impact_media_partner_id: string | null;
  tracking_domain: string | null;
  default_tracking_link: string | null;
  link_generation_method: string | null;
  awin_merchant_id: string | null;
  awin_publisher_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CommissionTier {
  stage: number;
  rate: number;
  min_sales: number;
  max_sales: number | null;
  label: string;
}

export interface AffiliateDiscountCode {
  id: string;
  program_id: string;
  code: string | null;
  discount_type: string | null;
  discount_value: number | null;
  description: string | null;
  display_text: string | null;
  applicable_products: string[] | null;
  min_purchase_amount: number | null;
  max_uses: number | null;
  is_exclusive: boolean | null;
  is_assigned: boolean | null;
  assignment_notes: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean | null;
  posting_restrictions: string | null;
  tracking_link: string | null;
  scope: string | null;
  coupon_source: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AffiliateCampaign {
  id: string;
  program_id: string;
  campaign_name: string;
  campaign_description: string | null;
  campaign_url: string | null;
  campaign_type: string | null;
  associated_discount_code_id: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean | null;
  creative_asset_count: number | null;
  creative_assets_location: string | null;
  notes: string | null;
  deal_scope: string | null;
  target_audience: string | null;
  region_specific: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AffiliateClick {
  id: string;
  program_id: string | null;
  brand_name: string;
  region_code: string;
  product_type: string | null;
  product_id: string | null;
  product_name: string | null;
  source_page: string;
  source_component: string | null;
  destination_url: string;
  session_id: string | null;
  user_agent: string | null;
  ip_country: string | null;
  clicked_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

export interface GenerateAffiliateLinkRequest {
  brand_name: string;
  region_code: string;
  path?: string;
  product_name?: string;
  source_page?: string;
  source_component?: string;
  utm_campaign?: string;
}

export interface GenerateAffiliateLinkResponse {
  affiliate_url: string | null;
  has_affiliate: boolean;
  program_status?: string;
  discount_codes?: Array<{
    code: string | null;
    display_text: string | null;
    valid_until: string | null;
  }>;
}
