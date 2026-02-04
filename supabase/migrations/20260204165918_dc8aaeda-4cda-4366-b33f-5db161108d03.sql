-- =====================================================
-- PHASE 1: ADD PRIORITY BRAND REGIONAL STORES
-- =====================================================

-- 1.1 BAMBU LAB REGIONAL STORES
INSERT INTO stores (name, slug, store_type, region, country_code, currency_code, base_url, is_active, ships_from, ships_to)
VALUES 
  ('Bambu Lab US', 'bambu-lab-us', 'brand_direct', 'US', 'US', 'USD', 'https://us.store.bambulab.com', true, ARRAY['US'], ARRAY['US', 'CA']),
  ('Bambu Lab CA', 'bambu-lab-ca', 'brand_direct', 'CA', 'CA', 'CAD', 'https://ca.store.bambulab.com', true, ARRAY['CA'], ARRAY['CA']),
  ('Bambu Lab UK', 'bambu-lab-uk', 'brand_direct', 'UK', 'GB', 'GBP', 'https://uk.store.bambulab.com', true, ARRAY['GB'], ARRAY['GB']),
  ('Bambu Lab EU', 'bambu-lab-eu', 'brand_direct', 'EU', 'DE', 'EUR', 'https://eu.store.bambulab.com', true, ARRAY['DE'], ARRAY['EU']),
  ('Bambu Lab AU', 'bambu-lab-au', 'brand_direct', 'AU', 'AU', 'AUD', 'https://au.store.bambulab.com', true, ARRAY['AU'], ARRAY['AU', 'NZ']),
  ('Bambu Lab JP', 'bambu-lab-jp', 'brand_direct', 'JP', 'JP', 'JPY', 'https://jp.store.bambulab.com', true, ARRAY['JP'], ARRAY['JP'])
ON CONFLICT (slug) DO NOTHING;

-- 1.2 CREALITY REGIONAL STORES
INSERT INTO stores (name, slug, store_type, region, country_code, currency_code, base_url, is_active, ships_from)
VALUES 
  ('Creality US', 'creality-us', 'brand_direct', 'US', 'US', 'USD', 'https://store.creality.com', true, ARRAY['US', 'CN']),
  ('Creality EU', 'creality-eu', 'brand_direct', 'EU', 'DE', 'EUR', 'https://store.creality.com/eu', true, ARRAY['DE']),
  ('Creality UK', 'creality-uk', 'brand_direct', 'UK', 'GB', 'GBP', 'https://store.creality.com/uk', true, ARRAY['GB']),
  ('Creality AU', 'creality-au', 'brand_direct', 'AU', 'AU', 'AUD', 'https://store.creality.com/au', true, ARRAY['AU'])
ON CONFLICT (slug) DO NOTHING;

-- 1.3 ANYCUBIC REGIONAL STORES
INSERT INTO stores (name, slug, store_type, region, country_code, currency_code, base_url, is_active, ships_from)
VALUES 
  ('Anycubic US', 'anycubic-us', 'brand_direct', 'US', 'US', 'USD', 'https://store.anycubic.com', true, ARRAY['US', 'CN']),
  ('Anycubic CA', 'anycubic-ca', 'brand_direct', 'CA', 'CA', 'CAD', 'https://ca.anycubic.com', true, ARRAY['CA']),
  ('Anycubic UK', 'anycubic-uk', 'brand_direct', 'UK', 'GB', 'GBP', 'https://uk.anycubic.com', true, ARRAY['GB']),
  ('Anycubic EU', 'anycubic-eu', 'brand_direct', 'EU', 'DE', 'EUR', 'https://eu.anycubic.com', true, ARRAY['DE']),
  ('Anycubic AU', 'anycubic-au', 'brand_direct', 'AU', 'AU', 'AUD', 'https://www.anycubic.au', true, ARRAY['AU'])
ON CONFLICT (slug) DO NOTHING;

-- 1.4 POLYMAKER REGIONAL STORES (expand existing)
INSERT INTO stores (name, slug, store_type, region, country_code, currency_code, base_url, is_active, ships_from)
VALUES 
  ('Polymaker CA', 'polymaker-ca', 'brand_direct', 'CA', 'CA', 'CAD', 'https://ca.polymaker.com', true, ARRAY['CA']),
  ('Polymaker EU', 'polymaker-eu', 'brand_direct', 'EU', 'NL', 'EUR', 'https://eu.polymaker.com', true, ARRAY['NL'])
ON CONFLICT (slug) DO NOTHING;

-- 1.5 ELEGOO REGIONAL STORES
INSERT INTO stores (name, slug, store_type, region, country_code, currency_code, base_url, is_active, ships_from)
VALUES 
  ('Elegoo US', 'elegoo-us', 'brand_direct', 'US', 'US', 'USD', 'https://us.elegoo.com', true, ARRAY['US', 'CN']),
  ('Elegoo CA', 'elegoo-ca', 'brand_direct', 'CA', 'CA', 'CAD', 'https://ca.elegoo.com', true, ARRAY['CA']),
  ('Elegoo UK', 'elegoo-uk', 'brand_direct', 'UK', 'GB', 'GBP', 'https://uk.elegoo.com', true, ARRAY['GB']),
  ('Elegoo EU', 'elegoo-eu', 'brand_direct', 'EU', 'DE', 'EUR', 'https://eu.elegoo.com', true, ARRAY['DE']),
  ('Elegoo AU', 'elegoo-au', 'brand_direct', 'AU', 'AU', 'AUD', 'https://au.elegoo.com', true, ARRAY['AU'])
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- PHASE 2: DEACTIVATE OLD GLOBAL ENTRY
-- =====================================================
UPDATE stores SET is_active = false WHERE slug = 'bambu-lab' AND region = 'GLOBAL';