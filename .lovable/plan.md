

# Rewrite Price Sync as Universal `sync-printer-prices` Edge Function

## Overview
Replace the Bambu Lab-only `resync-bambu-prices` edge function with a new universal `sync-printer-prices` function that reads extraction settings from the `brand_sync_config` table and works for all brands. Update the admin UI to support per-brand sync triggers.

## Changes

### 1. New Edge Function: `sync-printer-prices`
**File: `supabase/functions/sync-printer-prices/index.ts`**

Accepts `{ brand_id?: string, printer_id?: string }`:
- If `printer_id` provided: sync just that one printer
- If `brand_id` provided (e.g. "bambu-lab"): sync all non-discontinued printers for that brand
- If neither: sync ALL printers that have a matching `brand_sync_config` entry

Logic per printer:
1. Look up brand's sync config from `brand_sync_config` using a join: `brand_sync_config.brand_id` is matched to `printer_brands.brand` via slugification (e.g. "Bambu Lab" becomes "bambu-lab" using `LOWER(REPLACE(brand, ' ', '-'))`)
2. If `primary_extraction = 'manual_only'`, skip with status log
3. Determine which regions to sync:
   - Brands with regional store URLs (store_url_ca, store_url_uk, etc. are non-null in config): sync each region separately
   - Brands with only store_url_us (single store): sync US only
   - For geo-pricing brands (uses_geo_pricing = true): sync US price only, note that regional prices may differ
4. For each region, build the URL:
   - Extract slug from the printer's `product_url` (existing `extractSlug` logic)
   - Replace `{slug}` in the config's `store_url_XX` template
   - If no regional template exists, use the printer's own `product_url_XX` column as fallback
5. Call the shared `extractPrice()` with the brand's `BrandSyncConfig`
6. Apply safety checks (null/0 rejection, >40% anomaly flagging)
7. Update the appropriate price columns on the `printers` table
8. Log to `price_history` with source = `'price-sync'` and include extraction method, variant name, and confidence

Regional column mapping (same as existing):

```text
Region | URL Column       | Price Column              | MSRP Column
-------|-----------------|---------------------------|------------
US     | product_url      | current_price_usd_store   | msrp_usd
CA     | product_url_ca   | current_price_cad_store   | msrp_cad
UK     | product_url_uk   | current_price_gbp_store   | msrp_gbp
EU     | product_url_eu   | current_price_eur_store   | msrp_eur
AU     | product_url_au   | current_price_aud_store   | msrp_aud
```

Auth: Same dual-auth pattern (admin JWT or service_role key).

Returns:
```json
{
  "success": true,
  "timestamp": "...",
  "results": [
    {
      "printer": "P1S",
      "brand": "bambu-lab",
      "slug": "p1s",
      "regions": {
        "US": { "oldPrice": 399, "newPrice": 399, "status": "unchanged", "extraction_method": "json_ld_product_group" },
        "CA": { "oldPrice": 499, "newPrice": 479, "status": "updated", "extraction_method": "json_ld_product_group" }
      }
    }
  ],
  "summary": {
    "printersChecked": 25,
    "pricesUpdated": 8,
    "skipped": 5,
    "errors": 2,
    "anomalies": 1,
    "manualOnly": 3
  }
}
```

### 2. Keep `resync-bambu-prices` as Thin Wrapper (Optional Deprecation)
The existing `resync-bambu-prices` function will be updated to simply forward to `sync-printer-prices` with `{ brand_id: "bambu-lab" }` logic inline, OR we deprecate it entirely and update the admin UI to call the new function. The plan is to deprecate it -- the new function replaces it completely.

### 3. Update Admin Page: `PriceSync.tsx`
**Modified file: `src/pages/admin/PriceSync.tsx`**

Changes:
- Fetch all brands from `brand_sync_config` table to populate the brand sync table (currently hardcoded to "Bambu Lab" only)
- Each brand row gets its own "Sync" button that calls `sync-printer-prices` with `{ brand_id: "..." }`
- "Sync All" button calls `sync-printer-prices` with no params (syncs everything)
- Show `primary_extraction` method and `store_platform` per brand
- Brands with `primary_extraction = 'manual_only'` show a "Manual Only" badge and disabled sync button
- Update the `source` filter in `price_history` queries from `'bambu-resync'` to `'price-sync'`
- The diff view works the same but now shows brand name per row

### 4. Brand-to-Config Mapping Strategy
The `brand_sync_config.brand_id` uses slugs like "bambu-lab" while `printer_brands.brand` uses display names like "Bambu Lab". The edge function will:
1. Load all `brand_sync_config` rows
2. Build a lookup map: slugified brand name to config
3. For each printer, slugify its `printer_brands.brand` name and look up the config
4. Slugification: `LOWER(REPLACE(REPLACE(brand, ' ', '-'), '.', ''))` -- handles "Bambu Lab" to "bambu-lab", "QIDI Tech" to "qidi-tech", "Prusa Research" to "prusa-research"

Note: Some brand names won't match exactly (e.g. "QIDI Tech" slugifies to "qidi-tech" but config has "qidi", "Prusa Research" to "prusa-research" but config has "prusa"). The edge function will try exact slug match first, then try matching just the first word as a fallback. Alternatively, we'll add the missing config entries or normalize the existing ones.

To handle this cleanly, we'll insert/update the config entries to use the exact slugified brand names from `printer_brands`:

```text
Current config brand_id | printer_brands.brand | Needs update?
bambu-lab              | Bambu Lab            | No (matches)
creality               | Creality             | No
elegoo                 | Elegoo               | No
sovol                  | Sovol                | No
anycubic               | Anycubic             | No
qidi                   | QIDI Tech            | Yes -> "qidi-tech"
flashforge             | FlashForge           | No
prusa                  | Prusa Research       | Yes -> "prusa-research"
flsun                  | FLSUN                | No
snapmaker              | Snapmaker            | No
```

We'll update the two mismatched config entries (qidi and prusa) to use the correct slugified brand names.

## Technical Details

### Files Created
1. `supabase/functions/sync-printer-prices/index.ts` -- New universal sync function

### Files Modified
1. `src/pages/admin/PriceSync.tsx` -- Multi-brand UI with per-brand sync buttons

### Files Deprecated
1. `supabase/functions/resync-bambu-prices/index.ts` -- Replaced by sync-printer-prices (will be deleted)

### Data Updates
- Update `brand_sync_config` row where `brand_id = 'qidi'` to `brand_id = 'qidi-tech'`
- Update `brand_sync_config` row where `brand_id = 'prusa'` to `brand_id = 'prusa-research'`

### Edge Function Flow

```text
Input: { brand_id?, printer_id? }
         |
[Load all brand_sync_config rows]
         |
[Query printers with brand join]
  - Filter by brand_id or printer_id if provided
  - Join printer_brands for brand name
         |
For each printer:
  |
  [Slugify brand name -> look up config]
  |
  config.primary_extraction === 'manual_only'?
    Yes -> skip, log "manual only"
    No  -> continue
  |
  [Determine regions to sync]
    - Check which store_url_XX are non-null in config
    - Also check printer's own product_url_XX columns
  |
  For each region:
    |
    [Build URL from config template or printer column]
    |
    [Call extractPrice(url, region, oldPrice, config)]
    |
    [Safety checks: null/0/negative -> reject]
    [>40% change -> flag requires_review]
    |
    [Update printers table price columns]
    [Insert price_history record]
```

