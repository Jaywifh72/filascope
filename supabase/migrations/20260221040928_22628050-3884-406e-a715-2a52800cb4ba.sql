-- ================================================================
-- Seed Data: Amolen US (GoAffPro Affiliate Program)
-- ================================================================

INSERT INTO public.affiliate_programs (
  brand_name, region_code, affiliate_network, affiliate_id, referral_handle,
  account_email, portal_url, store_base_url, tracking_parameter, tracking_value,
  link_template, commission_rate, commission_type, commission_notes,
  cookie_duration_hours, cart_persistence_days, attribution_model,
  payout_schedule, payout_method, payout_currency, deep_linking_supported,
  account_status, status_notes
) VALUES (
  'Amolen', 'US', 'GoAffPro', '19374300', 'qzaelowj',
  'Admin@Filascope.com', 'amolen.goaffpro.com', 'https://www.amolen.com',
  'ref', 'qzaelowj',
  '{store_url}{path}?ref={tracking_value}', 5.00, 'percentage',
  'Up to 5% on all qualifying products',
  24, 89, 'last_click',
  'Monthly – approximately 60 days after month end', 'PayPal', 'USD',
  true, 'active',
  'Program active as of Feb 2026. Account confirmed on GoAffPro portal. Referral link and coupon code verified.'
);

-- Restrictions (same standard GoAffPro terms)
WITH prog AS (SELECT id FROM public.affiliate_programs WHERE brand_name = 'Amolen' AND region_code = 'US')
INSERT INTO public.affiliate_program_restrictions (program_id, restriction_type, description, severity)
VALUES
  ((SELECT id FROM prog), 'coupon_sites', 'Posting coupon codes on coupon websites is strictly prohibited.', 'mandatory'),
  ((SELECT id FROM prog), 'trademark', 'Affiliates must not bid on Amolen trademark terms in paid search.', 'mandatory'),
  ((SELECT id FROM prog), 'content_restriction', 'Content must not be misleading, defamatory, or violate applicable laws.', 'mandatory'),
  ((SELECT id FROM prog), 'ftc_disclosure', 'Affiliate relationship must be clearly disclosed per FTC guidelines.', 'mandatory');

-- Discount Code
INSERT INTO public.affiliate_discount_codes (
  program_id, code, discount_type, discount_value,
  description, display_text,
  is_active, is_assigned, is_exclusive, scope,
  coupon_source, assignment_notes, posting_restrictions,
  tracking_link
) VALUES (
  (SELECT id FROM public.affiliate_programs WHERE brand_name = 'Amolen' AND region_code = 'US'),
  'JEANJACQUESBOIL', 'percentage', 5.00,
  '5% off any purchase on amolen.com',
  'Save 5% with code JEANJACQUESBOIL',
  true, true, true, 'store_wide',
  'goaffpro_portal',
  'Assigned via GoAffPro affiliate portal. Code JEANJACQUESBOIL gives customers 5% off. Purchases using this code also generate affiliate commission.',
  'Posting coupon codes on coupon websites is strictly prohibited per program terms.',
  'https://www.amolen.com/?ref=qzaelowj'
);