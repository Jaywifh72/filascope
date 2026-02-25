

# Fix UltiMaker Printer Sync Failures

## Root Cause

UltiMaker printers are all tagged `sync_status = 'manual_only'` in the database, but the sync engine's skip logic relies on `brand_sync_config.primary_extraction = 'manual_only'` -- and **no `brand_sync_config` row exists for Ultimaker**. So the skip check fails silently, and the engine proceeds with the default Shopify JSON extraction against a Magento store, producing JSON parse errors and Firecrawl fallback waste.

### What happens on each sync attempt (per the logs):
1. Shopify JSON: appends `.json` to URL, gets HTML back, throws `SyntaxError: Unexpected token '<'`
2. Falls to JSON-LD: no JSON-LD exists in the Magento HTML
3. Falls to Meta Tags: no `og:price:amount` tags on these pages
4. Falls to Firecrawl Markdown (Tier 4): **this actually works** and returns 8,000-47,000 chars of markdown, but the price parser may not reliably extract from Magento bundle pages
5. Result: "not_in_region" status because nothing matched -- expensive Firecrawl API calls wasted

## Platform Details

- **store.ultimaker.com**: Adobe Commerce (Magento 2), not Shopify
- **No JSON-LD** structured data on product pages
- **Price IS in HTML** via `data-price-amount="8999"` on `<span>` elements with class `price-wrapper`
- **US-only** store -- no regional subdomains exist
- **Some products point to wrong domains**: ultimaker.com (marketing site), dynamism.com (reseller)

## Current DB State (10 printers, all `manual_only`)

| Model | product_url domain | Price | Issue |
|-------|-------------------|-------|-------|
| Factor 4 | shop3duniverse.com (reseller) | $19,500 | Wrong domain |
| Method XL | store.ultimaker.com | $13,999 | OK |
| S3 | ultimaker.com (marketing) | $2,999 | Wrong domain |
| S5 | ultimaker.com (marketing) | $4,999 | Wrong domain |
| S6 | ultimaker.com (marketing) | $6,999 | Wrong domain |
| S6 Secure | ultimaker.com (marketing) | null | Wrong domain |
| S7 | store.ultimaker.com | null | May be discontinued |
| S8 | store.ultimaker.com | $8,999 | OK -- verified |
| S8 Pro Bundle | ultimaker.com (marketing) | null | Wrong domain |
| S8 Secure | dynamism.com (reseller) | $627 | Wrong domain, wrong price |

## Implementation Plan

### Step 1: Create `brand_sync_config` row for Ultimaker

Insert a config row with `primary_extraction = 'manual_only'` so the sync engine properly skips all UltiMaker products at line 200 of `sync-printer-prices/index.ts`. This is the surgical fix that stops all wasted Firecrawl calls and false failures.

Fields:
- `brand_id`: 'ultimaker' (slug-based lookup)
- `store_platform`: 'magento'
- `primary_extraction`: 'manual_only'
- `shopify_json_available`: false
- `store_url_us`: null (no auto-sync)
- `sync_notes`: 'Magento (Adobe Commerce) store at store.ultimaker.com. Enterprise quote-based pricing. No Shopify JSON, no JSON-LD. Prices are static MSRP maintained manually.'

### Step 2: Fix product URLs to point to the actual store

Update all printers to use `store.ultimaker.com` URLs where products exist. Based on the live store navigation and verified pages:

| Model | Corrected URL |
|-------|--------------|
| S3 | `https://store.ultimaker.com/3d-printers/s-series/ultimaker-s3-us` |
| S5 | `https://store.ultimaker.com/3d-printers/s-series/ultimaker-s5-3d-printer` |
| S6 | `https://store.ultimaker.com/3d-printers/s-series/ultimaker-s6-3d-printer-bundle` |
| S6 Secure | `https://store.ultimaker.com/3d-printers/s-series/ultimaker-secure` |
| S7 | `https://store.ultimaker.com/ultimaker-s7-3d-printer` (already correct) |
| S8 | `https://store.ultimaker.com/ultimaker-s8-3d-printer` (already correct) |
| Method XL | `https://store.ultimaker.com/method-xl-3d-printer` (already correct) |
| S8 Pro Bundle | `https://store.ultimaker.com/ultimaker-s8-pro-bundle` (needs verification) |
| S8 Secure | `https://store.ultimaker.com/ultimaker-s8-secure` (needs verification) |
| Factor 4 | `https://store.ultimaker.com/ultimaker-factor-4` (needs verification) |

### Step 3: Fix the S8 Secure price

Currently shows $627 (from dynamism.com reseller scrape). The actual MSRP is $11,499. Update both `current_price_usd_store` and `msrp_usd`.

### Step 4: Verify S7 status

The S7 page at store.ultimaker.com returns a product page (confirmed via logs showing Firecrawl got 8,222 chars of markdown). If it's being replaced by S8, consider marking as discontinued. If still actively sold, preserve the listing.

### Step 5: Ensure no EU/CA/UK/AU/JP sync attempts

Verify that no regional URL columns (`product_url_eu`, etc.) or `brand_regional_stores` rows exist for Ultimaker. The DB audit already shows all regional URL columns are null -- this is correct.

---

## Technical Details

### Why the existing `sync_status = 'manual_only'` doesn't prevent sync

The sync engine at `sync-printer-prices/index.ts` line 200 checks:
```
if (config?.primary_extraction === "manual_only") { skip }
```

It does NOT check `printer.sync_status`. The `sync_status` column is a UI/reporting field only. The actual skip logic requires a matching `brand_sync_config` row with `primary_extraction = 'manual_only'`.

### What this fix achieves
- Zero Firecrawl API calls wasted on Ultimaker products per sync run (saves ~10 calls x $0.01+ each)
- Zero false failures in sync logs
- Correct URLs for admin reference and "Buy" buttons
- Accurate pricing data for all models

### Files to modify
- **Database only**: `brand_sync_config` (INSERT), `printers` (UPDATE URLs and prices)
- **No edge function changes needed** -- the existing `manual_only` check at line 200 will work once the config row exists

