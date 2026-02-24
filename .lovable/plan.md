

# Fix FLSUN Regional Price Sync (10 failures across 9 products)

## Summary

FLSUN uses subdomain-per-region Shopify stores (`{region}.store.flsun3d.com`) with **varying product handles across regions**. Currently only US is configured in `brand_sync_config`, no `brand_regional_stores` entries exist, and all regional URLs on the `printers` table are null. One product (Q5) is discontinued.

## Current State

- `brand_sync_config`: Has FLSUN entry but only `store_url_us` is set -- CA/UK/EU/AU templates are all null
- `brand_regional_stores`: No entries for FLSUN at all
- `printers` table: All 9 products have only `product_url` (US) set; all regional URL columns are null
- Q5 is marked `is_discontinued = false` but should be discontinued

## Changes

### 1. Update `brand_sync_config` -- add regional URL templates

Update the existing FLSUN row (id: `93690e20-9aae-4f04-8e72-fddc17be3622`) to add URL templates for all 5 regions. These templates serve as fallbacks; per-printer `product_url_XX` columns take precedence.

| Column | Value |
|--------|-------|
| store_url_us | `https://us.store.flsun3d.com/products/{slug}` (already set) |
| store_url_ca | `https://ca.store.flsun3d.com/products/{slug}` |
| store_url_uk | `https://uk.store.flsun3d.com/products/{slug}` |
| store_url_eu | `https://eu.store.flsun3d.com/products/{slug}` |
| store_url_au | `https://au.store.flsun3d.com/products/{slug}` |
| uses_geo_pricing | true |

### 2. Insert `brand_regional_stores` entries for FLSUN

Insert 5 rows for brand_id `44e1ba43-a259-4fc2-b710-777e566860f9`:

| Region | Base URL | Currency | Active | Shopify Domain |
|--------|----------|----------|--------|----------------|
| US | `https://us.store.flsun3d.com` | USD | yes | us.store.flsun3d.com |
| CA | `https://ca.store.flsun3d.com` | CAD | yes | ca.store.flsun3d.com |
| UK | `https://uk.store.flsun3d.com` | GBP | yes | uk.store.flsun3d.com |
| EU | `https://eu.store.flsun3d.com` | EUR | yes | eu.store.flsun3d.com |
| AU | `https://au.store.flsun3d.com` | AUD | yes | au.store.flsun3d.com |

### 3. Update product URLs per printer (only for regions where the product exists)

Each printer gets explicit `product_url_XX` values based on the verified handle map. Products NOT available in a region get no URL for that region (the sync engine will skip them).

| Product | US | CA | UK | EU | AU |
|---------|----|----|----|----|-----|
| **Q5** | Mark discontinued | - | - | - | - |
| **S1** | flsun-s1 | flsun-s1 | - | flsun-s1 | - |
| **S1 Pro** | flsun-s1-pro | flsun-s1-pro | flsun-s1-pro | flsun-s1-pro | flsun-s1-pro |
| **Super Racer** | flsun-sr-3d-printer | - | - | super-racer-sr | - |
| **T1** | - | flsun-t1 | - | - | flsun-t1 |
| **T1 Max** | flsun-t1-max-3d-printer | flsun-t1-max-3d-printer | flsun-t1-max-3d-printer | flsun-t1-max-3d-printer | flsun-t1-max-3d-printer |
| **T1 Pro** | - | flsun-t1-pro | - | flsun-t1-pro | flsun-t1-pro |
| **V400** | flsun-v400 | flsun-v400 | - | - | - |
| **V400 Max** | flsun-v400-max-3d-printer-custom-built-edition | flsun-v400-max-3d-printer | - | flsun-v400-max-3d-printer-custom-built-edition | flsun-v400-max-3d-printer |

Special cases:
- **Q5** (`22ac1ab9`): Set `is_discontinued = true`, `sync_status = 'discontinued'`
- **T1** (`40b8d0d4`): Update `product_url` (US) to null since it's NOT in the US store. Set `product_url_ca` and `product_url_au` instead.
- **T1 Pro** (`83dab145`): Update `product_url` (US) to null since it's NOT in the US store. Set CA/EU/AU URLs.
- **Super Racer** (`86a0dbd8`): Fix US URL from `flsun-super-racer-sr` to `flsun-sr-3d-printer`

### 4. No code changes needed

The existing sync engine already:
- Uses per-printer `product_url_XX` columns with priority over `brand_sync_config` templates
- Skips regions without URLs
- Has `selectBestVariant` with `cheapest_standalone` strategy and exclude patterns (`combo`, `bundle`, `kit`, `pack`, `set`, `2*`, `3*`) already configured for FLSUN

## Expected Outcome

| Product | Prices | Regions |
|---------|--------|---------|
| Q5 | 0 (discontinued) | - |
| S1 | 3 | US, CA, EU |
| S1 Pro | 5 | US, CA, UK, EU, AU |
| Super Racer | 2 | US, EU |
| T1 | 2 | CA, AU |
| T1 Max | 5 | US, CA, UK, EU, AU |
| T1 Pro | 3 | CA, EU, AU |
| V400 | 2 | US, CA |
| V400 Max | 4 | US, CA, EU, AU |
| **Total** | **26 prices** | **0 failures** |

