

# Edge Function: `extract-filament-data`

## Overview
Create a single Edge Function that receives a product URL + adapter key, fetches product data from the store, normalizes it into filament records, checks for duplicates, and stores results in the onboarding tables.

## Architecture

```text
POST { job_id, source_url, adapter_key }
  │
  ├─ Load brand_scraping_configs by adapter_key
  ├─ Fetch product data (Shopify JSON or HTML+JSON-LD)
  │
  ├─ Route to adapter:
  │   ├─ adaptSunlu()    — mega-product, region×material×color variants
  │   └─ adaptGenericShopify() — one product = one filament
  │
  ├─ Normalize → array of filament objects
  ├─ Duplicate check (brand_id + material + title/SKU)
  ├─ Update filament_onboarding_jobs (status, raw_data, extracted_filaments)
  └─ Insert filament_onboarding_items rows
```

## Implementation Details

### File: `supabase/functions/extract-filament-data/index.ts`

**CORS + Auth**: Standard CORS headers, JWT verified in code (admin role check via `user_roles` table — same pattern as `fetch-fiberlogy-images`).

**Config Loading**: Query `brand_scraping_configs` by `adapter_key`. If not found, fail the job.

**Shopify Fetching**: Convert `/products/{handle}` → `/products/{handle}.json`, fetch with Chrome-like User-Agent. Non-Shopify: fetch HTML, extract JSON-LD using the existing `extractJsonLdPrice` pattern from `_shared/price-extract-jsonld.ts`.

**SUNLU Adapter** (`adaptSunlu`):
- Parse Shopify product JSON where option1=Region, option2=Material, option3=Color
- Group variants by color (option3), extract per-region prices from matching region variants
- Strip material prefix from color name ("PLA White" → "White")
- Parse specs from `body_html` using config's `spec_extraction` regexes
- Build regional URLs from config's `regional_url_pattern`

**Generic Shopify Adapter** (`adaptGenericShopify`):
- Uses `variant_mapping` from config to identify which option is color/region/material
- Extracts price from first available variant
- Parses specs from `body_html`

**Color Hex Map**: ~30 common filament colors → hex values, used for approximate `color_hex` assignment.

**Duplicate Detection**: For each extracted item, query `filaments` where `brand_id` matches AND (`variant_sku` matches OR normalized `product_title` is similar). Mark `is_duplicate` + `existing_filament_id`.

**Job Updates**: On success → update job `status='extracted'`, store `raw_data`, `extracted_filaments`, `extraction_errors`. Insert each item into `filament_onboarding_items`. On failure → set `status='failed'` with error.

**Price Warnings**: Flag prices ≤0 or >$500 in `extraction_errors`.

### Config: `supabase/config.toml`
Add `[functions.extract-filament-data]` with `verify_jwt = false` (auth checked in code).

## Files Changed

| File | Action |
|------|--------|
| `supabase/functions/extract-filament-data/index.ts` | **New** — complete Edge Function |
| `supabase/config.toml` | Add function entry |

