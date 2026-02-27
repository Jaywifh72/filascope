
# Paramount 3D Scraping Pipeline -- Audit Report

## 1. Platform Detection

| Domain | `detectPlatform()` returns | Correct? |
|--------|--------------------------|----------|
| `paramount-3d.com` | `"shopify"` (default fallback) | **NO** -- Wix eCommerce store |

There is **no Wix handler** anywhere in the codebase. The `Platform` type only includes: shopify, woocommerce, magento, odoo, creality, extrudr, treed, prusa, geeetech, bambulab, bigcommerce. Paramount falls through to the default `return "shopify"`, which attempts `paramount-3d.com/product-page/....json` and gets HTTP 404. The `is404` flag then **blocks the Firecrawl fallback**.

## 2. Live Test Results

### PLA Enzo Red (`/product-page/pla-enzo-red-...`)
```text
{
  "success": false,
  "price": null,
  "error": "HTTP 404",
  "is404": true,
  "source": "shopify"
}
```

### ABS Black Cherry (`/product-page/abs-black-cherry-...`)
```text
{
  "success": false,
  "price": null,
  "error": "HTTP 404",
  "is404": true,
  "source": "shopify"
}
```

Both fail identically: Shopify JSON endpoint returns 404, `is404: true` blocks Firecrawl fallback.

## 3. Database State

| Metric | Value |
|--------|-------|
| Total variants | **113** |
| With non-null `variant_price` | **113** (all have prices) |
| `price_source` | `manual` (all manually entered) |
| Most recent sync | 2026-02-27 14:27:20 |
| `automated_brands.platform_type` | `amazon` |
| `extraction_method` | `auto` |
| `supported_regions` | `['US']` |
| `products_with_prices` | 113 |
| `last_scrape_at` | NULL (never auto-scraped) |

### Stored URLs -- Critical Issue

All 113 variants use **material-level category URLs**, not per-color product page URLs:

- `https://www.paramount-3d.com/abs` (18 colors share this URL)
- `https://www.paramount-3d.com/pla` (many colors share this URL)
- `https://www.paramount-3d.com/petg`
- `https://www.paramount-3d.com/asa`
- `https://www.paramount-3d.com/pva`
- `https://www.paramount-3d.com/flexpla`
- `https://www.paramount-3d.com/copy-of-pva`
- `https://www.paramount-3d.com/copy-of-flexpla`

These are **category listing pages** on the Wix store, not individual product pages. They list all colors/variants for a material type on one page, making per-color price extraction impossible with the current URL structure.

The correct per-product URLs should be like:
- `https://www.paramount-3d.com/product-page/pla-enzo-red-1-75mm-1kg-filament-trrl3020485c`

## 4. Critical Issues

1. **Platform misidentification**: `paramount-3d.com` falls through to Shopify, causing 404 + blocked Firecrawl fallback.
2. **No Wix handler**: There is no `"wix"` platform type or extractor. Wix has no standard product API -- prices must come from Firecrawl HTML scraping or JSON-LD.
3. **Wrong product URLs**: All 113 variants point to category pages (`/abs`, `/pla`) instead of individual `/product-page/[slug]` URLs. Multiple colors share the same URL, so even with working extraction, you'd get the same price for every color variant.
4. **Prices are manual-only**: All 113 prices were entered manually (`price_source: 'manual'`). No automated sync has ever succeeded (`last_scrape_at: NULL`).
5. **`platform_type: amazon`**: The brand is configured as `amazon` in `automated_brands`, which is incorrect -- it's a Wix store.
6. **No shipping-price guard**: The Firecrawl extractor's generic `$XX.XX` regex could match "Free Ground Shipping" adjacent prices or promotional text. There's a `removeSavingsAmounts()` helper but it doesn't specifically guard against shipping costs appearing as product prices.

## 5. Proposed Fixes

### Fix 1: Route paramount-3d.com directly to Firecrawl
Add a check in `price-platforms.ts` to return a platform that routes to Firecrawl (or add `"wix"` as a new platform type). Alternatively, handle it in the v2 router by detecting `paramount-3d.com` and dispatching directly to `extractFirecrawlPrice()`.

### Fix 2: Replace category URLs with per-product URLs
All 113 variants need their `product_url` updated from `/abs`, `/pla`, etc. to the correct `/product-page/[slug]` format. This requires scraping the category pages to discover the individual product page URLs, or manual mapping.

### Fix 3: Update `automated_brands` config
- Change `platform_type` from `amazon` to `wix` (or `firecrawl`)
- This brand has never been auto-scraped; the manual prices are the only data

### Fix 4: Validate Firecrawl extraction on Wix pages
Test Firecrawl against actual `/product-page/` URLs to confirm:
- Correct price extraction ($23.99, $21.99)
- No false matches from shipping/promo text
- Correct stock status detection (in stock vs out of stock)
