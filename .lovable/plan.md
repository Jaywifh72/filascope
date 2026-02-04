

# Regional Store Coverage Expansion Plan

## Current State Analysis

### Stores Table Schema
The `stores` table has the following structure:
| Column | Type | Required |
|--------|------|----------|
| id | uuid | Yes (auto-generated) |
| name | text | Yes |
| slug | text | Yes (unique) |
| store_type | text | Yes ('marketplace', 'brand_direct', 'retailer') |
| region | text | Yes ('US', 'CA', 'UK', 'EU', 'AU', 'JP', 'GLOBAL') |
| country_code | text | No |
| currency_code | text | No |
| base_url | text | Yes |
| affiliate_tag | text | No |
| affiliate_network | text | No |
| ships_from | text[] | No |
| ships_to | text[] | No |
| logo_url | text | No |
| is_active | boolean | Yes (default: true) |
| notes | text | No |

### Current Store Distribution
| Region | Count | Stores |
|--------|-------|--------|
| EU | 8 | 3DJake EU, Amazon (FR/DE/IT/ES), ColorFabb, FormFutura, Prusament |
| US | 3 | Amazon US, Polymaker US, PrintedSolid |
| UK | 2 | 3DJake UK, Amazon UK |
| CA | 2 | Amazon Canada, Filaments.ca |
| GLOBAL | 1 | Bambu Lab |
| AU | 1 | Amazon Australia |
| JP | 1 | Amazon Japan |

### Priority Brands - Current Coverage

| Brand | Current Stores | Missing Regions |
|-------|----------------|-----------------|
| **Bambu Lab** | GLOBAL (1) | Need regional stores: US, CA, UK, EU, AU, JP |
| **Prusa/Prusament** | EU (1) | Need: US warehouse shipping |
| **Creality** | None | Need: US, EU, UK, AU |
| **Anycubic** | None | Need: US, CA, UK, EU, AU |
| **Polymaker** | US (1) | Need: CA, EU |
| **Elegoo** | None | Need: US, CA, UK, EU, AU |

### Secondary Data Source
The `brand_regional_stores` table contains regional URL patterns for brands (Eryone, Kingroon, Sovol, Sunlu, Matter3D). This is used for URL transformation but separate from the main `stores` table.

---

## Implementation Approach

### Strategy: Direct SQL Inserts
Use SQL INSERT statements with `ON CONFLICT DO NOTHING` to safely add stores without duplicates. This is preferred over a seed script because:
1. One-time bulk operation
2. Easy to verify results immediately
3. No code maintenance overhead

### Phase 1: Priority Brand Stores (High Impact)

#### 1.1 Bambu Lab Regional Stores
Replace GLOBAL entry with specific regional stores for accurate pricing:

```text
+------------------+--------+----------+---------------------+
| Store Name       | Region | Currency | Base URL            |
+------------------+--------+----------+---------------------+
| Bambu Lab US     | US     | USD      | us.store.bambulab.com |
| Bambu Lab CA     | CA     | CAD      | ca.store.bambulab.com |
| Bambu Lab UK     | UK     | GBP      | uk.store.bambulab.com |
| Bambu Lab EU     | EU     | EUR      | eu.store.bambulab.com |
| Bambu Lab AU     | AU     | AUD      | au.store.bambulab.com |
| Bambu Lab JP     | JP     | JPY      | jp.store.bambulab.com |
+------------------+--------+----------+---------------------+
```

#### 1.2 Creality Regional Stores

```text
+------------------+--------+----------+-------------------------+
| Store Name       | Region | Currency | Base URL                |
+------------------+--------+----------+-------------------------+
| Creality US      | US     | USD      | store.creality.com      |
| Creality EU      | EU     | EUR      | store.creality.com/eu   |
| Creality UK      | UK     | GBP      | store.creality.com/uk   |
| Creality AU      | AU     | AUD      | store.creality.com/au   |
+------------------+--------+----------+-------------------------+
```

#### 1.3 Anycubic Regional Stores

```text
+------------------+--------+----------+-------------------------+
| Store Name       | Region | Currency | Base URL                |
+------------------+--------+----------+-------------------------+
| Anycubic US      | US     | USD      | store.anycubic.com      |
| Anycubic CA      | CA     | CAD      | ca.anycubic.com         |
| Anycubic UK      | UK     | GBP      | uk.anycubic.com         |
| Anycubic EU      | EU     | EUR      | eu.anycubic.com         |
| Anycubic AU      | AU     | AUD      | www.anycubic.au         |
+------------------+--------+----------+-------------------------+
```

#### 1.4 Polymaker Regional Stores (Expand from US)

```text
+------------------+--------+----------+---------------------+
| Store Name       | Region | Currency | Base URL            |
+------------------+--------+----------+---------------------+
| Polymaker CA     | CA     | CAD      | ca.polymaker.com    |
| Polymaker EU     | EU     | EUR      | eu.polymaker.com    |
+------------------+--------+----------+---------------------+
```

#### 1.5 Elegoo Regional Stores

```text
+------------------+--------+----------+---------------------+
| Store Name       | Region | Currency | Base URL            |
+------------------+--------+----------+---------------------+
| Elegoo US        | US     | USD      | us.elegoo.com       |
| Elegoo CA        | CA     | CAD      | ca.elegoo.com       |
| Elegoo UK        | UK     | GBP      | uk.elegoo.com       |
| Elegoo EU        | EU     | EUR      | eu.elegoo.com       |
| Elegoo AU        | AU     | AUD      | au.elegoo.com       |
+------------------+--------+----------+---------------------+
```

---

### Phase 2: Update Existing Entries

#### 2.1 Bambu Lab GLOBAL to Regional Migration
- Keep GLOBAL entry as fallback
- Add regional-specific stores with proper currency/country codes
- Mark GLOBAL as `is_active = false` after regionals are verified

---

## Technical Details

### SQL Migration Script

```sql
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
```

### Verification Queries

```sql
-- Check new distribution
SELECT region, COUNT(*) as count FROM stores WHERE is_active = true GROUP BY region ORDER BY count DESC;

-- Verify priority brands
SELECT name, slug, region, currency_code FROM stores 
WHERE slug LIKE '%bambu%' OR slug LIKE '%creality%' OR slug LIKE '%anycubic%' 
   OR slug LIKE '%polymaker%' OR slug LIKE '%elegoo%'
ORDER BY name, region;
```

---

## Expected Results

### After Implementation

| Region | Before | After | Change |
|--------|--------|-------|--------|
| US | 3 | 8 | +5 (Bambu, Creality, Anycubic, Elegoo, Polymaker) |
| EU | 8 | 13 | +5 (Bambu, Creality, Anycubic, Elegoo, Polymaker) |
| UK | 2 | 6 | +4 (Bambu, Creality, Anycubic, Elegoo) |
| CA | 2 | 6 | +4 (Bambu, Anycubic, Elegoo, Polymaker) |
| AU | 1 | 5 | +4 (Bambu, Creality, Anycubic, Elegoo) |
| JP | 1 | 2 | +1 (Bambu) |
| GLOBAL | 1 | 0 | -1 (Bambu moved to regional) |

**Total Active Stores: 18 to 40 (+22)**

---

## Implementation Steps

1. **Run SQL migration** via database migration tool
2. **Verify inserts** with distribution query
3. **Deactivate Bambu Lab GLOBAL** entry
4. **Test in application** - verify stores appear in price comparison UI
5. **Optional: Add logo URLs** for new stores

---

## Future Considerations

- Add eSun regional stores (US, EU)
- Add Sunlu regional stores (already in `brand_regional_stores`)
- Consider adding more marketplace variants (Amazon NL, Amazon PL)
- Implement automated store validation (check base_url is reachable)

