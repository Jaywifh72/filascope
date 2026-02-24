

# Fix Anycubic Regional Printer Price Sync

## Summary
Anycubic printers fail to sync prices for CA, UK, EU, and AU because: (1) Shopify JSON is disabled in config despite working endpoints, (2) no regional URL templates exist, (3) product handles differ across regions, and (4) AU store URL is wrong.

## Phase 1: Update brand_sync_config for Anycubic

Change the Anycubic config to enable Shopify JSON and add regional URL templates:

- `shopify_json_available` -> `true`
- `primary_extraction` -> `shopify_json`
- `store_url_ca` -> `https://ca.anycubic.com/products/{slug}`
- `store_url_uk` -> `https://uk.anycubic.com/products/{slug}`
- `store_url_eu` -> `https://eu.anycubic.com/products/{slug}`
- `store_url_au` -> `https://www.anycubic.au/products/{slug}`
- Remove `store_url_jp` (no JP store)

## Phase 2: Fix AU Regional Store entry

Update `brand_regional_stores` for Anycubic Australia:
- Change `base_url` from `https://store.anycubic.com` to `https://www.anycubic.au`
- Change `product_url_pattern` from `https://store.anycubic.com/products/{slug}` to `https://www.anycubic.au/products/{slug}`

## Phase 3: Handle Regional Slug Mismatch in Extraction Engine

The core problem: when the sync engine builds a regional URL using the US slug (e.g., `anycubic-kobra-3`), the CA store may use a different slug (`kobra-3`), causing a 404 on the Shopify JSON endpoint.

**Solution: Add slug discovery fallback to `extractFromShopifyJson`**

When the `.json` endpoint returns 404:
1. Try stripping the brand prefix: `anycubic-kobra-3` -> `kobra-3`
2. Try adding the brand prefix: `kobra-3-max` -> `anycubic-kobra-3-max`
3. If both fail, return null (product not available in that region)

This is implemented directly in `printer-price-extraction.ts` inside `extractFromShopifyJson`, keeping it self-contained.

## Phase 4: Add Anycubic Regional Domains to Geo-Bypass Maps

Add these to `REGION_SPOOF_HEADERS` and `DOMAIN_REGION_MAP`:
- `store.anycubic.com` -> US
- `ca.anycubic.com` -> CA
- `uk.anycubic.com` -> UK
- `eu.anycubic.com` -> EU
- `www.anycubic.au` -> AU

## Phase 5: Populate Regional URLs for Existing Printers

For the 11 Anycubic printers that lack regional URLs, the sync engine will now auto-construct them from the brand_sync_config templates. No manual URL population needed -- the sync engine already builds URLs from `store_url_{region}` + slug.

However, the slug mismatch means some will 404 on first attempt and be resolved by the slug discovery fallback (Phase 3).

## Technical Details

### Database Changes (via insert tool, not migrations)

```sql
-- Update brand_sync_config
UPDATE brand_sync_config SET
  shopify_json_available = true,
  primary_extraction = 'shopify_json',
  store_url_ca = 'https://ca.anycubic.com/products/{slug}',
  store_url_uk = 'https://uk.anycubic.com/products/{slug}',
  store_url_eu = 'https://eu.anycubic.com/products/{slug}',
  store_url_au = 'https://www.anycubic.au/products/{slug}',
  sync_notes = 'Shopify JSON works on all regional stores. Handles may differ across regions — slug discovery fallback handles this.'
WHERE brand_id = 'anycubic';

-- Fix AU regional store
UPDATE brand_regional_stores SET
  base_url = 'https://www.anycubic.au',
  product_url_pattern = 'https://www.anycubic.au/products/{slug}'
WHERE id = 'f8d5ffb9-0505-4a34-ac8d-545c513123ca';
```

### Edge Function Changes (`printer-price-extraction.ts`)

1. **Modify `extractFromShopifyJson`**: On 404 response, try alternate slugs (strip/add brand prefix). Log the successful alternate slug for debugging.

2. **Add to `REGION_SPOOF_HEADERS`**:
   - `store.anycubic.com`, `ca.anycubic.com`, `uk.anycubic.com`, `eu.anycubic.com`, `www.anycubic.au`

3. **Add to `DOMAIN_REGION_MAP`**:
   - Same 5 domains mapped to their respective region codes

### Expected Results

| Region | Before | After |
|--------|--------|-------|
| US | Working (JSON-LD) | Working (Shopify JSON -- faster, more reliable) |
| CA | Failed (no URL template, wrong extraction) | Working (Shopify JSON + slug discovery) |
| UK | Failed | Working (Shopify JSON + slug discovery) |
| EU | Failed | Working (Shopify JSON + slug discovery) |
| AU | Failed (wrong store URL) | Working (correct AU domain + Shopify JSON) |
| JP | N/A (no store) | Skipped gracefully |

