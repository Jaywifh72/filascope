
# NinjaTek Scraping Pipeline — FIXED

## Changes Made

### 1. Platform Detection (`price-platforms.ts`)
- Added `ninjatek.com` → `"woocommerce"` (excludes `ninjatek.ca`)

### 2. WC Currency Config (`price-extract-wc.ts`)
- Added `"ninjatek.com": "USD"` to `WC_STORE_CURRENCIES`

### 3. Firecrawl Fallback (`get-current-price-v2/index.ts`)
- Added Firecrawl fallback to the WooCommerce case (was missing — WC case had no fallback unlike Shopify/Extrudr/Geeetech)
- This was the **critical missing piece** — WC Store API returns empty `[]` and no JSON-LD exists on NinjaTek pages

### 4. Database Config (`automated_brands`)
- Updated `platform_type`: `shopify` → `woocommerce`
- Updated `extraction_method`: `auto` → `firecrawl`
- Updated `supported_regions`: `['EU', 'US']` → `['US']`

## Verification Results

| Product | Price | Source | Status |
|---------|-------|--------|--------|
| NinjaFlex (US) | $102.46 | firecrawl | ✅ Correct 1kg price |
| Cheetah (US) | $102.46 | firecrawl | ✅ |

## CA Store (ninjatek.ca) — NOT VIABLE
- All variants priced at **$0.00** and marked **sold out** in Shopify
- Store appears to be an inactive/placeholder authorized reseller
- No CA URLs added; `supported_regions` set to `['US']` only
