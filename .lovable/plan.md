

# Fix All Bambu Lab Printer Data: URLs, Prices, Sync Engine, and Display

## Overview
There are 4 interconnected bugs affecting all Bambu Lab printers. This plan addresses broken store URLs, wrong regional prices, sync engine extraction logic, and display component issues.

---

## Bug 1: Fix Store URLs in Database

The `product_url` fields are already correct (e.g., `/products/a1`, not `/products/bambu-lab-a1`). However, several regional prices and discontinued printer URLs need cleanup.

**Data updates** (via SQL UPDATE statements):

| Printer | What's Wrong Now | Correct Values |
|---------|-----------------|----------------|
| A1 Mini | CA price=150 (garbage), GBP price=299 (wrong) | CA=239, GBP=149 |
| A1 | CA price=519 (strikethrough!), GBP=379 (wrong) | CA=339, GBP=209 |
| P1S | CA=1367 (garbage), GBP=120 (garbage) | CA=499, GBP=339 |
| P2S | CA=1049 (wrong) | CA=799 |
| H2S | CA=1999 (wrong), GBP=1199 (wrong) | CA=1649, GBP=999 |
| H2D | CA=330 (garbage!) | CA=2269, GBP=1449 |
| H2C | All correct | No change |
| X1E | All prices null | Set sync_status='reseller_only' |
| P1P | Has stale regional prices | Null out all regional prices |
| X1 Carbon | Has stale regional prices | Null out all regional prices |

**For EU and AU**: Set `current_price_eur_store`, `msrp_eur`, `current_price_aud_store`, `msrp_aud` to NULL for all active Bambu Lab printers. These are currently showing garbage USD-converted values.

**For P1P and X1 Carbon**: Null out all regional price and URL fields since stores are removed.

---

## Bug 2: Sync Engine -- Already Correct

After reviewing `supabase/functions/_shared/printer-price-extraction.ts`, the extraction logic is already implemented correctly:
- It handles `ProductGroup` with `hasVariant[]` (lines 250-280)
- It uses `offers.price` as current price, `priceSpecification` as strikethrough (lines 307-343)
- It filters combo variants via `selectBestVariant` (lines 72-128)
- The `brand_sync_config` for Bambu Lab already sets `shopify_json_available = false` and `primary_extraction = 'json_ld'`

No code changes needed in the extraction engine.

---

## Bug 3: Fix All Regional Prices via Data Update

Run UPDATE statements for each Bambu Lab printer with verified prices:

**A1 Mini** (`bambu-lab-a1-mini`):
- US: $219 / MSRP $299
- CA: C$239 / MSRP C$389
- UK: L149 / MSRP L169
- EU/AU: NULL (unverified)

**A1** (`bambu-lab-a1`):
- US: $299 / MSRP $399
- CA: C$339 / MSRP C$519
- UK: L209 / MSRP L259
- EU/AU: NULL

**P1S** (`bambu-lab-p1s`):
- US: $399 / MSRP $699
- CA: C$499 / MSRP C$899
- UK: L339 / MSRP L429
- EU/AU: NULL

**P2S** (`bambu-lab-p2s`):
- US: $549 / MSRP $549
- CA: C$799 / MSRP C$799
- UK: L479 / MSRP L479
- EU/AU: NULL

**H2S** (`bambu-lab-h2s`):
- US: $1,249 / MSRP $1,249
- CA: C$1,649 / MSRP C$1,649
- UK: L999 / MSRP L999
- EU/AU: NULL

**H2D** (`bambu-lab-h2d`):
- US: $1,749 / MSRP $1,999
- CA: C$2,269 / MSRP C$2,599
- UK: L1,449 / MSRP L1,599
- EU/AU: NULL

**H2C** (`bambu-lab-h2c`):
- US: $2,399 / MSRP $2,399
- CA: C$3,149 / MSRP C$3,149
- UK: L1,999 / MSRP L1,999
- EU/AU: NULL

**X1E** (`bambu-lab-x1e`):
- All prices: NULL
- sync_status: 'reseller_only'
- discontinued_note: 'Available exclusively through authorized resellers'

**P1P** (`bambu-lab-p1p`):
- All regional prices/URLs: NULL (already discontinued)

**X1 Carbon** (`bambu-lab-x1-carbon`):
- All regional prices/URLs: NULL (already discontinued)

All active printers: set `last_synced_at = NOW()`, `sync_status = 'manual'`, `sync_method = 'manual'`

---

## Bug 4: Display Component Update

### File: `src/components/printer/tabs/PricingTabContent.tsx`

**Price by Region section** (lines 400-473):

Current behavior for regions with no data: falls back to converting USD MSRP, showing misleading "~" prices.

Changes needed:
1. When a region has `salePrice = null` AND `msrp = null` (EU, AU after our data fix), show "Check store" with a link to the regional store URL instead of a converted USD estimate
2. Keep existing logic for regions with real data (sale price + strikethrough MSRP)
3. Add a "Check regional store" link button for regions without verified prices

The specific change is in the `mainPrice` fallback logic (line 422): instead of computing `estimatedFromUsd` when no real data exists, show a "Visit store" link using the printer's `product_url_eu` / `product_url_au` column.

### Regional Stores section (lines 528-681):

This section uses `interpolateProductUrl` with `productSlug` to build URLs from `product_url_pattern`. For Bambu Lab, the `product_url` fields are already correct in the DB, so the "Where to Buy" section at line 317 correctly uses `regionalStoreUrl` from the `regionalPriceMap`.

No changes needed here -- the buy button already reads directly from `product_url_XX` columns.

---

## Technical Details

### Files Modified
1. `src/components/printer/tabs/PricingTabContent.tsx` -- Update "Price by Region" section to show "Check store" for unverified regions instead of fake conversions

### Data Updates (via database tool)
- 10 UPDATE statements for Bambu Lab printers (7 active + X1E + P1P + X1 Carbon)

### No Changes Needed
- `supabase/functions/_shared/printer-price-extraction.ts` -- extraction logic already correct
- `supabase/functions/sync-printer-prices/index.ts` -- orchestrator already correct
- `src/components/printer/CTAButtons.tsx` -- already uses URL from props, not auto-generated
- Store URLs in DB are already correct (short slugs like `/products/a1`)

