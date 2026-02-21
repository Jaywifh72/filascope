-- Activate Anycubic Canada Affiliate Program
-- Applied via Lovable data tools on 2026-02-20
-- This migration captures the changes for version control

-- 1. Activate the program status
UPDATE public.affiliate_programs
SET 
  account_status = 'active',
  status_notes = 'Program active as of Feb 2026. Account confirmed on GoAffPro portal. Referral link and coupon code verified.',
  updated_at = now()
WHERE brand_name = 'Anycubic' 
  AND region_code = 'CA';

-- 2. Populate the discount code placeholder with actual coupon data
UPDATE public.affiliate_discount_codes
SET
  code = 'JEANJACQUESBOIL',
  discount_type = 'fixed_amount',
  discount_value = 20.00,
  description = '$20 off any purchase on ca.anycubic.com',
  display_text = 'Save $20 with code JEANJACQUESBOIL',
  is_active = true,
  is_assigned = true,
  is_exclusive = true,
  scope = 'store_wide',
  coupon_source = 'goaffpro_portal',
  assignment_notes = 'Assigned via GoAffPro affiliate portal. Code JEANJACQUESBOIL gives $20 off. Purchases using this code also generate affiliate commission.',
  posting_restrictions = 'Posting coupon codes on coupon websites is strictly prohibited per program terms.',
  tracking_link = 'https://ca.anycubic.com/?ref=JEANJACQUESBOILEAU',
  updated_at = now()
WHERE program_id = (
  SELECT id FROM public.affiliate_programs 
  WHERE brand_name = 'Anycubic' AND region_code = 'CA'
);