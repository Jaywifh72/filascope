
# Printer URL Health Validation System

## Overview
Build a dedicated URL health monitoring system for printer store URLs, extending the existing filament link health infrastructure. This includes a new database table, a new edge function, and a new admin page.

## Existing Infrastructure (What We Build On)
- **validate-product-links** edge function: Already validates filament listing URLs with HEAD requests, redirect following, and break-type classification. We'll follow the same patterns.
- **validate-url** edge function + regional-fetch shared module: Provides geo-redirect bypass with region-appropriate headers. We'll reuse this.
- **AdminLinkHealth page** (/admin/link-health): Existing broken link dashboard for filaments. The new printer URL health page will follow a similar design but be printer-focused.
- **UrlHealthTab component**: Simpler URL validation UI using the `url_validation_cache` table. We can cross-reference this cache.
- Printers have 6 URL columns: `product_url`, `product_url_ca`, `product_url_uk`, `product_url_eu`, `product_url_au`, `product_url_jp`.

## Changes

### 1. Database: New `printer_url_validations` Table
Create a table to store per-printer, per-region URL validation results:

- `id` (uuid, PK)
- `printer_id` (uuid, FK to printers)
- `region` (text) -- US, CA, UK, EU, AU, JP
- `url` (text)
- `status_code` (integer, nullable)
- `status` (text) -- valid, invalid, redirect, unknown
- `redirect_url` (text, nullable)
- `error_message` (text, nullable)
- `price_found` (numeric, nullable) -- price extracted from store page
- `price_in_db` (numeric, nullable) -- price in our DB at check time
- `price_mismatch` (boolean, default false)
- `validated_at` (timestamptz)
- Unique constraint on (printer_id, region)

RLS: Admin-only read/write via `has_role(auth.uid(), 'admin')`.

### 2. Edge Function: `validate-printer-urls`
New edge function that:

- Accepts `{ printerId?: string, region?: string }` (omit printerId for batch "all")
- Queries printers table for all non-null URL columns
- For each printer+region combo, performs a HEAD request using the existing `regional-fetch` module
- For Shopify-hosted stores (Bambu Lab, Anycubic, etc.), also fetches `{url}.json` to extract the current price from the Shopify product JSON
- Classifies results: 200 = valid, 301/302 = redirect (stores redirect_url), 404/410 = invalid
- Compares extracted price against database values; flags price mismatches (>5% difference)
- Upserts results into `printer_url_validations` table
- Returns a summary (total checked, broken count, redirects, price mismatches)

Uses the existing `_shared/regional-fetch.ts` module for geo-redirect bypass.

### 3. Admin Page: `/admin/printer-url-health`
New page with the following sections:

**Summary Cards:**
- Total URLs tracked (across all printers x regions)
- Valid (green), Broken (red), Redirects (yellow), Unchecked (grey), Price Mismatches (orange)

**Filters:**
- Status filter (All / Valid / Broken / Redirect / Unchecked / Price Mismatch)
- Region filter (All / US / CA / UK / EU / AU / JP)
- Brand filter
- Search by printer name

**Main Table:**
- Columns: Printer Name, Brand, then one sub-column per region (US, CA, UK, EU, AU, JP)
- Each region cell shows a colored dot: green (200), yellow (301), red (404), grey (never checked)
- Hovering on a dot shows the URL + last validated time
- If a redirect was detected, show the redirect URL
- If a price mismatch was found, show an orange warning icon with the DB vs store price

**Actions:**
- "Validate All" button -- triggers batch validation for all printers
- Per-printer "Validate" button -- validates all regions for that printer
- Per-printer "Fix URLs" button -- opens an inline edit form for all 6 regional URL columns
- Bulk URL template: input pattern like `{region}.store.bambulab.com/products/{slug}` to auto-generate regional URLs for a selected brand

**Price Mismatch Section:**
- Collapsible section showing all printers where extracted store price differs from DB by >5%
- Shows: Printer, Region, DB Price, Store Price, Difference %
- "Accept Store Price" button to update the DB value

### 4. Route & Navigation
- Add route `/admin/printer-url-health` in App.tsx
- Add sidebar entry under the existing admin nav, near "Link Health"

## Technical Details

### Files Created
1. **`supabase/functions/validate-printer-urls/index.ts`** -- Edge function for printer URL validation with Shopify price extraction
2. **`src/pages/admin/PrinterUrlHealth.tsx`** -- Admin page component
3. **Database migration** -- `printer_url_validations` table with RLS policies

### Files Modified
1. **`src/App.tsx`** -- Add route for `/admin/printer-url-health`
2. **`src/components/admin/AdminSidebar.tsx`** -- Add "Printer URL Health" nav item
3. **`supabase/config.toml`** -- will auto-update for new edge function (no manual edit needed)

### Edge Function: Price Extraction Strategy
For Shopify stores (Bambu Lab, Anycubic, Creality, etc.):
1. Fetch `{product_url}.json` -- returns Shopify product JSON with `variants[0].price`
2. Compare against the appropriate DB column based on region (e.g., `current_price_cad_store` for CA)

For non-Shopify stores:
1. Fetch the page HTML
2. Look for JSON-LD `Product` schema with `offers.price`
3. Fall back to Open Graph `product:price:amount` meta tag

### Region-to-Column Mapping in Edge Function
```text
Region | URL Column      | Price Column               | MSRP Column
-------|-----------------|---------------------------|------------
US     | product_url     | current_price_usd_store    | msrp_usd
CA     | product_url_ca  | current_price_cad_store    | msrp_cad
UK     | product_url_uk  | current_price_gbp_store    | msrp_gbp
EU     | product_url_eu  | current_price_eur_store    | msrp_eur
AU     | product_url_au  | current_price_aud_store    | msrp_aud
JP     | product_url_jp  | current_price_jpy_store    | msrp_jpy
```
