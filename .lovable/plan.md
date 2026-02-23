
# Bambu Lab Printer Price Resync System

## Overview
Automated Shopify-based price syncing for Bambu Lab printers across all regional stores (US, CA, EU, UK, AU), with an admin dashboard for monitoring and manual triggers.

## What Gets Built

### 1. Edge Function: `resync-bambu-prices`
Fetches live pricing from Bambu Lab's Shopify stores and updates the database.

**How it works:**
- Queries all non-discontinued Bambu Lab printers from the database
- Extracts the product slug from each `product_url` (e.g., `a1-mini` from `us.store.bambulab.com/products/a1-mini`)
- For each regional store (US, CA, EU, UK, AU), fetches `{region}.store.bambulab.com/products/{slug}.json`
- Parses the Shopify product JSON to find the base variant (cheapest variant, or first variant whose title does NOT contain "Combo")
- Updates `current_price_X_store` with the variant price and `msrp_X` with `compare_at_price` (or the variant price if no compare_at)
- Stores the Shopify `variant_id` on the printer row for future tracking
- Logs every price change to the `price_history` table with `product_type = 'printer'`
- Handles 404s gracefully (logs a warning, does not crash)
- Flags price changes exceeding 20% as anomalies in the response

**Regional store mapping:**
```text
Region | Store Domain                    | Price Column              | MSRP Column
-------|---------------------------------|--------------------------|------------
US     | us.store.bambulab.com           | current_price_usd_store   | msrp_usd
CA     | ca.store.bambulab.com           | current_price_cad_store   | msrp_cad
EU     | eu.store.bambulab.com           | current_price_eur_store   | msrp_eur
UK     | uk.store.bambulab.com           | current_price_gbp_store   | msrp_gbp
AU     | au.store.bambulab.com           | current_price_aud_store   | msrp_aud
```

**Variant matching logic:**
- Get all variants from the Shopify product JSON
- Filter out variants with titles containing "Combo", "Bundle", "AMS"
- Take the cheapest remaining variant (the standalone printer)
- Store its `variant_id` for consistent future syncs

### 2. Database Changes
- Add `shopify_variant_id` column (text) to `printers` table to track the matched Shopify variant per region
  - Actually, since variant IDs may differ per region, we'll store a JSONB column: `shopify_variant_ids` mapping region to variant ID
- No other schema changes needed -- all price columns and `price_history` support already exist

### 3. Admin Page: `/admin/price-sync`
A monitoring dashboard showing:

**Summary section:**
- Last sync timestamp (from most recent `price_history` entry with source = 'bambu-resync')
- Number of prices updated in last sync
- Error count

**Brand sync table:**
- Row per brand (starting with Bambu Lab, extensible)
- Columns: Brand, Last Synced, Prices Updated, Errors, Status
- "Sync Now" button per brand

**Diff view (collapsible per sync run):**
- Table showing: Printer, Region, Old Price, New Price, Change %, Status
- Color coding: green for small changes, orange for >10%, red for >20%
- 404 errors shown in red

### 4. Route and Navigation
- New route `/admin/price-sync` in App.tsx
- New sidebar entry "Price Sync" under Operations group

## Technical Details

### Files Created
1. **`supabase/functions/resync-bambu-prices/index.ts`** -- Edge function
2. **`src/pages/admin/PriceSync.tsx`** -- Admin monitoring page

### Files Modified
1. **`src/App.tsx`** -- Add lazy import and route
2. **`src/components/admin/AdminSidebar.tsx`** -- Add nav item

### Database Migration
- Add `shopify_variant_ids JSONB DEFAULT '{}'` to `printers` table (stores `{"US": "variant_123", "CA": "variant_456", ...}`)

### Edge Function Details

The function accepts:
```json
{ "brand": "bambu-lab" }
```

It returns:
```json
{
  "success": true,
  "brand": "bambu-lab",
  "timestamp": "2026-02-23T...",
  "results": [
    {
      "printer": "P1S",
      "slug": "p1s",
      "regions": {
        "US": { "oldPrice": 399, "newPrice": 399, "msrp": 699, "status": "unchanged" },
        "CA": { "oldPrice": 499, "newPrice": 479, "msrp": 899, "status": "updated" }
      }
    }
  ],
  "summary": {
    "printersChecked": 8,
    "pricesUpdated": 3,
    "errors": 0,
    "anomalies": 0
  }
}
```

Authentication: Validates admin JWT or service_role key (dual-auth pattern for manual + CRON).

### Admin Page Design

The page uses the existing `AdminLayout` wrapper and follows existing admin page patterns:
- Summary cards at top (Total Brands, Last Sync, Prices Updated, Errors)
- Brand table with sync controls
- Expandable diff view showing what changed in the last sync
- Results are fetched from `price_history` table filtered by `source = 'bambu-resync'`

### CRON Setup (Post-Deploy)
After deployment, a CRON job can be configured to run weekly:
```sql
SELECT cron.schedule(
  'resync-bambu-prices-weekly',
  '0 6 * * 1',  -- Every Monday at 6am UTC
  $$ SELECT net.http_post(...) $$
);
```
This will be set up via the insert tool after the edge function is deployed.
