

# Configure Pricing Sync for 6 Brands: Raise3D, RatRig, Snapmaker, Sovol, UltiMaker, Voron Design

## Overview

Six brands need sync configuration changes ranging from "add new Shopify sync" to "mark as unsyncable." The work spans Edge Function config files and database updates.

---

## Part A: Syncable Brands (Edge Function + DB changes)

### 1. Raise3D -- NEW sync config (US + EU Shopify)

**Edge Functions:**
- `sync-regional-prices/index.ts` -- Add to `BRAND_REGIONAL_DOMAINS`:
  ```text
  'raise3d': { US: 'shop.raise3d.com', EU: 'eu.raise3d.com' }
  ```
- `sync-brand-products/index.ts` -- Same entry
- `_shared/printer-price-extraction.ts`:
  - `REGION_SPOOF_HEADERS`: Add `shop.raise3d.com` (US) and `eu.raise3d.com` (EU)
  - `DOMAIN_REGION_MAP`: Add both domains
- `_shared/regional-fetch.ts`: Add `shop.raise3d.com` and `eu.raise3d.com` to `GEO_REDIRECT_DOMAINS`
- `fetch-printer-prices/index.ts`: Add URL correction rule for Raise3D (`shop.raise3d.com`)

**Database:**
- Add `brand_sync_config` row for Raise3D (shopify_json, US + EU URLs)
- Fix E2 Series price: $90 is a placeholder -- needs correct MSRP or mark for sync
- Fix Pro3 Series price: $90 is a placeholder -- same
- Pro2: product_url points to `www.raise3d.com` (non-Shopify) -- update to `shop.raise3d.com` if available, or mark discontinued
- RMF Series: $69,999 MSRP -- verify and keep as-is (industrial printer)

### 2. RatRig -- NEW sync config (EU-only Shopify, EUR currency)

**Edge Functions:**
- `sync-regional-prices/index.ts` -- Add:
  ```text
  'ratrig': { EU: 'www.ratrig.com' }
  ```
- `sync-brand-products/index.ts` -- Same
- `_shared/printer-price-extraction.ts`:
  - `REGION_SPOOF_HEADERS`: Add `www.ratrig.com` (EU)
  - `DOMAIN_REGION_MAP`: Add `www.ratrig.com` -> `EU`
- `_shared/regional-fetch.ts`: Add `www.ratrig.com` to `GEO_REDIRECT_DOMAINS`

**Database:**
- Add `brand_sync_config` row for RatRig (shopify_json, EU-only)
- V-Core 4: Fix product_url from `us.ratrig.com/rat-rig-v-core-4.html` to correct Shopify URL
- V-Minion: Mark `is_discontinued = true`, set `msrp_usd = 660`, clear `product_url`

### 3. Sovol -- Remove dead EU store

**Edge Functions:**
- `sync-regional-prices/index.ts`: Change `'sovol'` entry to US-only (remove `EU: 'eu.sovol3d.com'`)
- `sync-brand-products/index.ts`: Same change

**Database:**
- Update `brand_sync_config` for Sovol: clear `store_url_eu`
- SV07 and SV07 KLIPPER DIRECT DRIVE appear to be duplicates (same product_url) -- deduplicate

### 4. Snapmaker -- Mark 3 discontinued, fix prices

**No Edge Function changes needed** (already has US + EU spoof headers and domain mappings).

**Database only:**
- Mark **2.0 A250T** as `is_discontinued = true`
- Mark **2.0 A350T** as `is_discontinued = true`
- Mark **J1s** as `is_discontinued = true`, set `msrp_usd = 89` (placeholder was last known)
- Fix **U1** price: `current_price_usd_store` from $2,799 to correct store price (needs verification via sync)
- **Artisan** stays active

---

## Part B: Non-Syncable Brands (DB-only changes)

### 5. UltiMaker -- Enterprise "Request A Quote" model

**Database:**
- Set `sync_status = 'manual_only'` on all 10 UltiMaker printers
- Preserve existing MSRP values as static prices
- No `brand_sync_config` entry needed (or add one with `primary_extraction = 'manual'`)

### 6. Voron Design -- Open-source, no official pricing

**Database:**
- Set `sync_status = 'manual_only'` on all 3 Voron Design printers
- Add a note that prices are community-estimated BOM costs, not retail
- No sync config needed

---

## File Change Summary

| File | Changes |
|------|---------|
| `sync-regional-prices/index.ts` | Add `raise3d`, `ratrig`; remove Sovol EU |
| `sync-brand-products/index.ts` | Same 3 changes |
| `_shared/printer-price-extraction.ts` | Add 3 spoof headers + 3 domain mappings (Raise3D x2, RatRig x1) |
| `_shared/regional-fetch.ts` | Add 3 domains to GEO_REDIRECT_DOMAINS |
| `fetch-printer-prices/index.ts` | Add URL correction for Raise3D and RatRig |
| Database (printers) | Mark 4 discontinued, fix placeholder prices, set manual_only on 13 printers |
| Database (brand_sync_config) | Add Raise3D + RatRig rows |

## Deployment

All modified edge functions will be deployed automatically. After deployment, Raise3D (US+EU) and RatRig (EU) will be syncable, Sovol will sync US-only, and UltiMaker/Voron will be permanently skipped.

