
# Seed Data for brand_regional_stores Table

## Overview

This plan creates a SQL migration to populate the `brand_regional_stores` table with accurate regional store information for all major brands in FilaScope. The data will be derived from the existing `BRAND_REGIONAL_STORES` static configuration in `src/lib/brandRegionalStores.ts`, ensuring consistency between the client-side URL generation and database-backed regional pricing.

## Current State

- **Table**: `brand_regional_stores` exists but is empty
- **Source Data**: `automated_brands` table contains ~40 brands
- **Reference Config**: `src/lib/brandRegionalStores.ts` has comprehensive store URL patterns
- **Constraint**: Only regions `US`, `CA`, `UK`, `EU`, `AU`, `JP`, `CN` are allowed
- **Unique Constraint**: One entry per brand + region combination

## Database Migration

A new SQL migration file will be created that:

1. Uses subqueries to resolve `brand_id` from `automated_brands.brand_slug`
2. Inserts regional store records for all brands with accurate URLs and shipping info
3. Uses `ON CONFLICT DO NOTHING` to safely handle re-runs

### Brands to Seed

| Brand | Regions | Primary |
|-------|---------|---------|
| Bambu Lab | US, CA, EU, UK, AU, JP, CN | US |
| Polymaker | US, CA, EU | US |
| Creality | US, CA, EU, UK, AU | US |
| Anycubic | US, CA, EU, UK, AU | US |
| Elegoo | US, CA, EU, UK, AU | US |
| eSun | US, EU | US |
| Hatchbox | US | US |
| Overture | US | US |
| Prusament | US, EU | EU |
| ColorFabb | EU, US | EU |
| Fillamentum | EU | EU |
| Fiberlogy | EU, US | EU |
| Extrudr | EU | EU |
| 3DXTech | US | US |
| NinjaTek | US | US |
| Atomic Filament | US | US |
| Proto-Pasta | US | US |
| Push Plastic | US | US |
| Matter3D | CA, US | CA |
| AzureFilm | EU | EU |
| Kingroon | US, EU | US |
| Eryone | US, EU | US |
| Sovol | US, EU | US |
| Geeetech | US | US |
| 3D-Fuel | US | US |
| IC3D Printers | US | US |
| Numakers | US | US |
| Amolen | US | US |
| FormFutura | EU | EU |
| Siraya Tech | US | US |
| Recreus | EU | EU |
| Duramic 3D | US | US |
| Fusion Filaments | US | US |
| Gizmo Dorks | US | US |

## Implementation Details

### File to Create

```text
supabase/migrations/[timestamp]_seed_brand_regional_stores.sql
```

### Migration Structure

```sql
-- Seed regional store data
-- Uses brand_slug to resolve brand_id dynamically

-- BAMBU LAB (7 regions)
INSERT INTO brand_regional_stores (brand_id, region_code, store_name, base_url, product_url_pattern, currency_code, ships_from_country, free_shipping_threshold, estimated_shipping_days, is_primary)
SELECT id, 'US', 'Bambu Lab US', 'https://us.store.bambulab.com', 'https://us.store.bambulab.com/products/{sku}', 'USD', 'US', 50.00, 5, true
FROM automated_brands WHERE brand_slug = 'bambu-lab'
ON CONFLICT (brand_id, region_code) DO NOTHING;

-- Repeat for CA, EU, UK, AU, JP, CN...

-- POLYMAKER (3 regions)
INSERT INTO brand_regional_stores (...)
SELECT id, 'US', 'Polymaker US', 'https://us.polymaker.com', ...
FROM automated_brands WHERE brand_slug = 'polymaker'
ON CONFLICT (brand_id, region_code) DO NOTHING;

-- ... Continue for all brands
```

### Data Accuracy

Each record will include:
- **store_name**: Human-readable store identifier (e.g., "Bambu Lab US")
- **base_url**: Store homepage URL
- **product_url_pattern**: Template for product links using `{sku}` placeholder
- **currency_code**: Native store currency
- **ships_from_country**: 2-letter country code for shipping origin
- **free_shipping_threshold**: Minimum order for free shipping (based on typical values)
- **estimated_shipping_days**: Typical delivery time (3-7 days domestic, 10-21 international)
- **is_primary**: True for the brand's main/home market store

### Estimated Record Count

Approximately **70-80 records** across ~35 brands, covering:
- 7 global brands with full regional presence (Bambu Lab, Anycubic, Elegoo, etc.)
- 20+ US-focused brands (single region)
- 10+ EU-centric brands

## Technical Considerations

1. **Idempotency**: `ON CONFLICT DO NOTHING` ensures safe re-runs
2. **FK Resolution**: Subqueries resolve `brand_slug` to `brand_id` dynamically
3. **Missing Brands**: If a brand doesn't exist in `automated_brands`, the INSERT is skipped
4. **URL Patterns**: Use `{sku}` as placeholder for product SKU/handle

## Testing

After migration:
```sql
-- Verify seed data
SELECT ab.brand_name, brs.region_code, brs.store_name, brs.currency_code
FROM brand_regional_stores brs
JOIN automated_brands ab ON ab.id = brs.brand_id
ORDER BY ab.brand_name, brs.region_code;
```

Expected: ~70-80 rows across all seeded brands.
