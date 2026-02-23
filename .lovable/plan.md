

# Fix Regional Pricing for Printers

## Problem
The printer detail page shows converted USD prices for non-US regions (e.g., "~C$955.64 Converted from $699.00") instead of actual regional store prices (e.g., C$499.00 sale / C$899.00 MSRP). This destroys user trust.

## Root Cause
1. Missing MSRP columns: `msrp_gbp`, `msrp_aud`, `msrp_jpy` don't exist on the printers table
2. The "Price by Region" section only shows MSRP, not sale prices
3. The Current Price section doesn't switch to regional store prices based on user region
4. The Buy button doesn't link to regional store URLs
5. The `useUnifiedRegionalPricing` hook correctly prioritizes actual regional prices, but only receives `current_price_X_store` data, not MSRP data for the regional comparison grid

## Changes

### 1. Database Migration
Add missing MSRP columns to the printers table:
- `msrp_gbp` (numeric)
- `msrp_aud` (numeric)
- `msrp_jpy` (numeric)

### 2. Populate Bambu Lab CA Prices
Insert verified CA store prices (from ca.store.bambulab.com, Feb 22 2026):
- A1 Mini: current_price_cad_store=239, msrp_cad=389
- A1: current_price_cad_store=339, msrp_cad=519
- P1S: current_price_cad_store=499, msrp_cad=899
- P2S: current_price_cad_store=799, msrp_cad=799
- H2S: current_price_cad_store=1649, msrp_cad=1649
- H2D: current_price_cad_store=2269, msrp_cad=2599
- H2C: current_price_cad_store=3149, msrp_cad=3149

### 3. Update PricingTabContent.tsx — "Price by Region" Section
Replace the current MSRP-only grid with a richer display showing both sale price and MSRP per region:
- Add AU region (currently missing from the grid)
- For each region, show `current_price_X_store` as the main price, with `msrp_X` as strikethrough if different
- Label "Official store price" when real data exists
- Label "Converted from USD" only when falling back to conversion
- Highlight the user's current region

### 4. Update PricingTabContent.tsx — "Current Price" Section
The Store price card currently always shows `current_price_usd_store`. Change it to show the regional store price based on user region:
- CA region: show `current_price_cad_store` formatted as CAD
- EU region: show `current_price_eur_store` formatted as EUR
- UK region: show `current_price_gbp_store` formatted as GBP
- AU region: show `current_price_aud_store` formatted as AUD
- US/default: show `current_price_usd_store` formatted as USD

### 5. Update PricingTabContent.tsx — "Where to Buy" Section
The Official Store button currently uses `printer.official_store_url` (US). Change to use regional URL based on user region:
- CA: `product_url_ca`
- EU: `product_url_eu`
- UK: `product_url_uk`
- AU: `product_url_au`
- Default: `product_url` or `official_store_url`

### 6. Update PrinterDetail.tsx — Regional Data Passing
Pass regional MSRP data to PricingTabContent so it can display regional MSRPs without conversion. The printer query already uses `SELECT *`, so all columns are available.

---

## Technical Details

### Files Modified
1. **Database migration** — Add `msrp_gbp`, `msrp_aud`, `msrp_jpy` columns
2. **Database data update** — Populate Bambu Lab CA prices
3. **`src/components/printer/tabs/PricingTabContent.tsx`** — Main changes:
   - "Price by Region" section: show sale price + MSRP per region with proper labels
   - "Current Price" Store card: show regional price based on user region
   - "Where to Buy" Official Store button: use regional URL
4. **`src/pages/PrinterDetail.tsx`** — Minor: pass regional MSRP fields to PricingTabContent props (may not need changes since printer object is passed directly)

### Region-to-Column Mapping
```text
Region  | Sale Price Column          | MSRP Column  | URL Column
--------|---------------------------|--------------|----------------
US      | current_price_usd_store   | msrp_usd     | product_url
CA      | current_price_cad_store   | msrp_cad     | product_url_ca
EU      | current_price_eur_store   | msrp_eur     | product_url_eu
UK      | current_price_gbp_store   | msrp_gbp     | product_url_uk
AU      | current_price_aud_store   | msrp_aud     | product_url_au
JP      | current_price_jpy_store   | msrp_jpy     | product_url_jp
```

### No Changes Needed
- `useUnifiedRegionalPricing.ts` — Already correctly prioritizes actual regional prices via `getActualRegionalPrice()`
- `PrinterDetail.tsx` — Already passes `regionalPrices` to the unified hook with the correct field mapping
- Edge function — No changes needed; regional price fetching already works
