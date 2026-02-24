

# Fix Elegoo Regional Price Sync (28 failures)

## Root Cause Found

The `uses_geo_pricing` flag in `brand_sync_config` is set to `true` for Elegoo. In the sync orchestrator (`sync-printer-prices/index.ts`, line 203), this flag **prevents all non-US regions from being added** to the sync list:

```text
if (!effectiveConfig?.uses_geo_pricing) {
    // Add non-US regions... 
}
```

When `uses_geo_pricing = true`, the code skips this block entirely, so only US is ever synced. This is the sole reason all 28 non-US entries fail with "No price found."

The flag's original intent was to mark stores that serve different prices per region (as opposed to a single global price). But the code incorrectly treats it as "don't sync non-US regions."

## Fix Plan (3 changes)

### 1. Fix the region-selection logic in `sync-printer-prices/index.ts`

The `uses_geo_pricing` guard should be **removed** (or inverted). When a brand has `uses_geo_pricing = true` AND has URL templates in `brand_sync_config`, those regions MUST be synced -- that's the whole point. The condition should add non-US regions whenever there's a config URL template or a printer URL, regardless of the `uses_geo_pricing` flag.

Change lines 202-213 to always check for available regional URLs.

### 2. Add `brand_regional_stores` entries for Elegoo

Insert 7 rows so the inactive-store skipping works correctly for JP and CN:

| Region | Domain | Active | Currency |
|--------|--------|--------|----------|
| US | us.elegoo.com | yes | USD |
| CA | ca.elegoo.com | yes | CAD |
| UK | uk.elegoo.com | yes | GBP |
| EU | eu.elegoo.com | yes | EUR |
| AU | au.elegoo.com | yes | AUD |
| JP | elegoo.co.jp | **no** | JPY |
| CN | www.elegoo.cn | **no** | CNY |

### 3. Add verbose logging to extraction pipeline

Add `console.log` lines in `extractPrice` and `extractFromShopifyJson` to trace the region selection and extraction flow for easier future debugging. This includes logging:
- Which regions were selected for sync
- The constructed URL for each region
- Shopify JSON fetch response status
- Whether variant selection succeeded

## Technical Details

### File: `supabase/functions/sync-printer-prices/index.ts`

**Lines 201-213** -- Remove the `uses_geo_pricing` guard so non-US regions are always evaluated:

```text
Before:
  const regionsToSync: RegionCode[] = ["US"];
  if (!effectiveConfig?.uses_geo_pricing) {
    for (const rc of ["CA", "UK", "EU", "AU", "JP"]) {
      ...
    }
  }

After:
  const regionsToSync: RegionCode[] = ["US"];
  for (const rc of ["CA", "UK", "EU", "AU", "JP"]) {
    const regionMeta = REGION_MAP[rc];
    const configUrl = effectiveConfig ? effectiveConfig[regionMeta.configUrlCol] : null;
    const printerUrl = printer[regionMeta.urlCol];
    if (configUrl || printerUrl) {
      regionsToSync.push(rc);
    }
  }
```

### Database: `brand_regional_stores`

Insert 7 rows for Elegoo (brand_id: `358b8f96-4d46-44c1-9988-95d252e856f6`) with JP and CN marked `is_active = false`.

### File: `supabase/functions/_shared/printer-price-extraction.ts`

Add a `console.log` at the top of `extractPrice()` and inside `_fetchShopifyJson()` to log the URL being fetched and the response status, for traceability.

## Expected Outcome

After these changes:
- 7 products x 5 active regions = **35 prices** will sync via Shopify JSON
- JP and CN will show as **"N/A" (not_in_region)** via the inactive store mechanism
- The `uses_geo_pricing` flag will no longer block regional syncing

