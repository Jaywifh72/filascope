
# Complete Regional Store Database Expansion Plan

## Current State Summary

### Two Data Sources for Regional Stores

| Table | Purpose | Current Records |
|-------|---------|-----------------|
| `stores` | Global retailer registry (Amazon, 3DJake, brand stores) | 39 active |
| `brand_regional_stores` | Brand-specific regional storefronts with URL patterns | 107 active |

### Current Distribution by Region

| Region | `stores` table | `brand_regional_stores` |
|--------|----------------|------------------------|
| US | 7 | 44 |
| EU | 13 | 30 |
| CA | 6 | 11 |
| UK | 6 | 10 |
| AU | 5 | 9 |
| JP | 2 | 2 |
| CN | 0 | 1 |

---

## Gap Analysis

### Brands with Missing Regional Coverage

Based on client-side config in `brandRegionalStores.ts` vs. database entries:

| Brand | Config Supports | DB Has | Missing |
|-------|-----------------|--------|---------|
| **Sunlu** | US, UK, EU | US, UK, EU | CA, AU |
| **Sovol** | US, EU | US, EU | UK, CA, AU |
| **Kingroon** | US, EU | US, EU | UK, CA, AU |
| **Eryone** | US, EU | US, EU | UK, CA, AU |
| **Jayo** | US, UK, EU | - | All (brand not in DB) |
| **Artillery** | US, EU | - | All (brand not in DB) |
| **QIDI** | US, EU | - | All (brand not in DB) |
| **Flashforge** | US, CA, UK, EU, AU | - | All (brand not in DB) |
| **Polymaker** | US, CA, EU | US, CA, EU, UK, AU | None - already complete! |

### US-Only Brands (Expansion Candidates)

These brands currently only have US stores but could potentially expand:

| Brand | Current | Notes |
|-------|---------|-------|
| 3D-Fuel | US | US manufacturer - global ships from US |
| Amolen | US | Amazon-focused brand |
| Atomic Filament | US | US manufacturer |
| Duramic 3D | US | Budget brand via Amazon |
| Gizmo Dorks | US | US-only manufacturer |
| IC3D Printers | US | US manufacturer |
| Push Plastic | US | US manufacturer |
| Ziro | US | Amazon-focused brand |

---

## Implementation Strategy

### Phase 1: Expand Existing Brands to Missing Regions

Add regional store entries for brands that have regional storefronts but incomplete database coverage.

#### 1.1 Sunlu Expansion (+2 regions)
```text
| Store Name | Region | Currency | Base URL |
|------------|--------|----------|----------|
| Sunlu CA   | CA     | CAD      | ca.sunlu.com |
| Sunlu AU   | AU     | AUD      | au.sunlu.com |
```

#### 1.2 Sovol Expansion (+3 regions)
```text
| Store Name | Region | Currency | Base URL |
|------------|--------|----------|----------|
| Sovol UK   | UK     | GBP      | uk.sovol3d.com |
| Sovol CA   | CA     | CAD      | ca.sovol3d.com |
| Sovol AU   | AU     | AUD      | au.sovol3d.com |
```

#### 1.3 Kingroon Expansion (+3 regions)
```text
| Store Name | Region | Currency | Base URL |
|------------|--------|----------|----------|
| Kingroon UK | UK    | GBP      | uk.kingroon.com |
| Kingroon CA | CA    | CAD      | ca.kingroon.com |
| Kingroon AU | AU    | AUD      | au.kingroon.com |
```

#### 1.4 Eryone Expansion (+3 regions)
```text
| Store Name | Region | Currency | Base URL |
|------------|--------|----------|----------|
| Eryone UK  | UK     | GBP      | uk.eryone3d.com |
| Eryone CA  | CA     | CAD      | ca.eryone3d.com |
| Eryone AU  | AU     | AUD      | au.eryone3d.com |
```

### Phase 2: Add New Brands

Create complete regional coverage for brands in `brandRegionalStores.ts` but missing from database.

#### 2.1 Jayo (3 regions)
```text
| Store Name | Region | Currency | Base URL |
|------------|--------|----------|----------|
| Jayo US    | US     | USD      | www.jayo3d.com |
| Jayo UK    | UK     | GBP      | uk.jayo3d.com |
| Jayo EU    | EU     | EUR      | eu.jayo3d.com |
```

#### 2.2 QIDI (2 regions)
```text
| Store Name | Region | Currency | Base URL |
|------------|--------|----------|----------|
| QIDI US    | US     | USD      | www.qidi3d.com |
| QIDI EU    | EU     | EUR      | eu.qidi3d.com |
```

#### 2.3 Flashforge (6 regions)
```text
| Store Name      | Region | Currency | Base URL |
|-----------------|--------|----------|----------|
| Flashforge US   | US     | USD      | www.flashforge.com |
| Flashforge CA   | CA     | CAD      | ca.flashforge.com |
| Flashforge UK   | UK     | GBP      | uk.flashforge.com |
| Flashforge EU   | EU     | EUR      | eu.flashforge.com |
| Flashforge AU   | AU     | AUD      | au.flashforge.com |
```

#### 2.4 Artillery (2 regions)
```text
| Store Name    | Region | Currency | Base URL |
|---------------|--------|----------|----------|
| Artillery US  | US     | USD      | www.artillery3d.com |
| Artillery EU  | EU     | EUR      | eu.artillery3d.com |
```

### Phase 3: Update `supported_regions` in automated_brands

Sync the `supported_regions` column to match actual store coverage.

---

## Technical Implementation

### SQL Migration Script

```sql
-- =====================================================
-- PHASE 1: EXPAND EXISTING BRANDS
-- =====================================================

-- 1.1 SUNLU EXPANSION
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Sunlu Canada', 'CA', 'CAD', 'https://ca.sunlu.com', 'CA', true, false
FROM automated_brands WHERE brand_slug = 'sunlu'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Sunlu Australia', 'AU', 'AUD', 'https://au.sunlu.com', 'AU', true, false
FROM automated_brands WHERE brand_slug = 'sunlu'
ON CONFLICT DO NOTHING;

-- 1.2 SOVOL EXPANSION  
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Sovol UK', 'UK', 'GBP', 'https://uk.sovol3d.com', 'UK', true, false
FROM automated_brands WHERE brand_slug = 'sovol'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Sovol Canada', 'CA', 'CAD', 'https://ca.sovol3d.com', 'CA', true, false
FROM automated_brands WHERE brand_slug = 'sovol'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Sovol Australia', 'AU', 'AUD', 'https://au.sovol3d.com', 'AU', true, false
FROM automated_brands WHERE brand_slug = 'sovol'
ON CONFLICT DO NOTHING;

-- 1.3 KINGROON EXPANSION
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Kingroon UK', 'UK', 'GBP', 'https://uk.kingroon.com', 'UK', true, false
FROM automated_brands WHERE brand_slug = 'kingroon'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Kingroon Canada', 'CA', 'CAD', 'https://ca.kingroon.com', 'CA', true, false
FROM automated_brands WHERE brand_slug = 'kingroon'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Kingroon Australia', 'AU', 'AUD', 'https://au.kingroon.com', 'AU', true, false
FROM automated_brands WHERE brand_slug = 'kingroon'
ON CONFLICT DO NOTHING;

-- 1.4 ERYONE EXPANSION
INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Eryone UK', 'UK', 'GBP', 'https://uk.eryone3d.com', 'UK', true, false
FROM automated_brands WHERE brand_slug = 'eryone'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Eryone Canada', 'CA', 'CAD', 'https://ca.eryone3d.com', 'CA', true, false
FROM automated_brands WHERE brand_slug = 'eryone'
ON CONFLICT DO NOTHING;

INSERT INTO brand_regional_stores (brand_id, store_name, region_code, currency_code, base_url, ships_from_country, is_active, is_primary)
SELECT 
  id, 'Eryone Australia', 'AU', 'AUD', 'https://au.eryone3d.com', 'AU', true, false
FROM automated_brands WHERE brand_slug = 'eryone'
ON CONFLICT DO NOTHING;

-- =====================================================
-- PHASE 2: UPDATE SUPPORTED REGIONS
-- =====================================================

UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK', 'CA', 'AU']
WHERE brand_slug = 'sunlu';

UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK', 'CA', 'AU']
WHERE brand_slug = 'sovol';

UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK', 'CA', 'AU']
WHERE brand_slug = 'kingroon';

UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK', 'CA', 'AU']
WHERE brand_slug = 'eryone';

-- Also update Polymaker which already has full coverage in DB
UPDATE automated_brands 
SET supported_regions = ARRAY['US', 'EU', 'UK', 'CA', 'AU']
WHERE brand_slug = 'polymaker';
```

### Verification Queries

```sql
-- Check new distribution
SELECT region_code, COUNT(*) as count 
FROM brand_regional_stores 
WHERE is_active = true 
GROUP BY region_code 
ORDER BY count DESC;

-- Verify expanded brands
SELECT ab.brand_name, ARRAY_AGG(brs.region_code ORDER BY brs.region_code) as regions
FROM automated_brands ab
JOIN brand_regional_stores brs ON ab.id = brs.brand_id AND brs.is_active = true
WHERE ab.brand_slug IN ('sunlu', 'sovol', 'kingroon', 'eryone', 'polymaker')
GROUP BY ab.brand_name
ORDER BY ab.brand_name;
```

---

## Expected Results

### After Phase 1

| Region | Before | After | Change |
|--------|--------|-------|--------|
| US | 44 | 44 | +0 |
| EU | 30 | 30 | +0 |
| UK | 10 | 14 | +4 |
| CA | 11 | 15 | +4 |
| AU | 9 | 13 | +4 |

**Total new entries: +12**

### Updated Brand Coverage

| Brand | Before | After |
|-------|--------|-------|
| Sunlu | US, UK, EU | US, UK, EU, CA, AU |
| Sovol | US, EU | US, EU, UK, CA, AU |
| Kingroon | US, EU | US, EU, UK, CA, AU |
| Eryone | US, EU | US, EU, UK, CA, AU |
| Polymaker | US, EU, CA, UK, AU | (unchanged, `supported_regions` synced) |

---

## Future Work (Out of Scope)

1. **Add Jayo, QIDI, Flashforge, Artillery** - Requires creating new entries in `automated_brands` first
2. **Add stores table entries** - Only needed for retailers/marketplaces, not brand direct stores
3. **URL validation** - Verify all regional URLs are reachable before deployment
4. **Shipping threshold research** - Add `free_shipping_threshold` values for new regions

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Regional URLs don't exist | All URLs follow established subdomain patterns from `brandRegionalStores.ts` |
| Duplicate entries | Using `ON CONFLICT DO NOTHING` prevents duplicates |
| Breaking existing data | Only INSERT new rows, no DELETE or UPDATE of existing prices |
