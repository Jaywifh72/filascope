

# Fix QIDI Tech Printer Pricing Sync

## Overview
QIDI Tech printer sync is failing because the backend configuration only knows about 2 regional stores (US + EU), uses the wrong extraction method (JSON-LD instead of Shopify JSON), and is missing regional URL templates. Additionally, X-Smart 3 needs to be marked as discontinued.

## Root Cause Analysis

| Issue | Current State | Required State |
|-------|--------------|----------------|
| Regional stores | US + EU only | US, CA, UK, EU, AU |
| US store URL | `www.qidi3d.com` | `us.qidi3d.com` |
| Extraction method | `json_ld` (blocked) | `shopify_json` (bypasses geo-fence) |
| Shopify JSON flag | `false` | `true` |
| Regional URL templates | US only | All 5 regions with `{slug}` templates |
| X-Smart 3 status | Active | Discontinued |
| AU handle for Q2C | Not configured | Needs slug cache entry |

## Implementation Steps

### Step 1: Update `brand_sync_config` for QIDI Tech

Update the existing row (id: `6e997ff9-f680-4ebf-8ef2-4578c183cd95`) to:
- Set `primary_extraction` = `shopify_json`
- Set `shopify_json_available` = `true`
- Set `uses_geo_pricing` = `true`
- Add all 5 regional URL templates:
  - `store_url_us`: `https://us.qidi3d.com/products/{slug}`
  - `store_url_ca`: `https://ca.qidi3d.com/products/{slug}`
  - `store_url_uk`: `https://uk.qidi3d.com/products/{slug}`
  - `store_url_eu`: `https://eu.qidi3d.com/products/{slug}`
  - `store_url_au`: `https://au.qidi3d.com/products/{slug}`
- Update `sync_notes` to reflect Shopify JSON strategy

### Step 2: Add missing regional stores to `brand_regional_stores`

Insert 3 new rows for QIDI's brand_id (`dc238e56-e0a8-471b-a785-66e984f41a4c`):
- CA: `ca.qidi3d.com`, CAD, ships_from: CA
- UK: `uk.qidi3d.com`, GBP, ships_from: GB
- AU: `au.qidi3d.com`, AUD, ships_from: AU

Also update the existing US store base_url from `https://www.qidi3d.com` to `https://us.qidi3d.com`.

### Step 3: Mark X-Smart 3 as discontinued

Update printer `504ec5a8-951d-4810-86a3-fd475b52593e`:
- Set `status` = `discontinued`
- Set `is_discontinued` = `true`
- Set `msrp_usd` = `419`
- Set `discontinued_note` = `No longer available in any QIDI regional store`

### Step 4: Cache AU slug for Q2C

Insert into `product_regional_slugs`:
- `printer_id`: `0c3566eb-275d-45c0-9ad2-1eaba4da270c` (Q2C)
- `region_code`: `AU`
- `slug`: `qidi-q2c-3d-printer`
- `verified`: `true`

### Step 5: Add QIDI to frontend `BRAND_REGIONAL_CONFIGS`

In `src/pages/admin/pricing/constants.ts`, add a QIDI Tech subdomain config so the admin UI can derive regional URLs for display:

```typescript
'QIDI Tech': {
  pattern: 'subdomain',
  baseDomain: 'qidi3d.com',
  regions: {
    CA: { subdomain: 'ca' },
    UK: { subdomain: 'uk' },
    EU: { subdomain: 'eu' },
    AU: { subdomain: 'au' },
  }
},
```

## Technical Details

- All changes are database data updates (Steps 1-4) plus one frontend constants file edit (Step 5)
- No edge function code changes needed -- the sync engine already supports Shopify JSON extraction and `{slug}` URL templates; it just needs the correct config data
- The Shopify JSON endpoint (`/products/{handle}.json`) bypasses QIDI's geo-fencing that blocks HTML page scraping
- After these changes, syncing QIDI should produce 30 successful regional price extractions (6 printers x 5 regions) plus 1 discontinued skip (X-Smart 3)

