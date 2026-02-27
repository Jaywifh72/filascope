
# IC3D Printers Scraping Pipeline Audit

## 1. Platform Detection and Routing

**`detectPlatform("ic3dprinters.com")` returns `"shopify"` (incorrect).** IC3D is not listed in any platform detection rule, so it falls through to the default `return "shopify"`. IC3D is a WooCommerce store.

**Live test result** for `https://www.ic3dprinters.com/shop/pla-filaments/`:
```json
{
  "success": false,
  "price": null,
  "error": "HTTP 404",
  "is404": true,
  "source": "shopify"
}
```
The Shopify JSON fetch (`/shop/pla-filaments/.json`) returns 404, and the `is404` guard in the router blocks the Firecrawl fallback. No price is extracted.

## 2. WooCommerce Handler Analysis

The existing WooCommerce extractor (`price-extract-wc.ts`) has a critical limitation for IC3D:
- **Slug extraction** uses `/product/` path: `pathname.split("/product/")` -- but IC3D uses `/shop/` URLs (e.g., `/shop/pla-filaments/`), so `extractSlug()` returns `null`
- Without a slug, the WC Store API call is skipped, falling through to JSON-LD fallback only
- **No handling for WooCommerce price ranges** (e.g., "$34.99 -- $199.99") -- the JSON-LD fallback takes `offers[0].price` which should be the lowest price

## 3. Sync Pipeline

- **`automated_brands` config**: `brand_slug: 'ic3d-printers'`, `platform_type: 'firecrawl'`, `supported_regions: ['US']`, `scraping_enabled: true`
- Sync-prices routes `firecrawl` platform type through `callGetCurrentPrice()` which calls `get-current-price-v2`, where IC3D hits the Shopify default path and fails
- Prices write to `variant_price` (USD) on the `filaments` table
- **No entries in `product_regional_urls`** (0 rows)

## 4. Database State

| Metric | Value |
|--------|-------|
| Total IC3D variants | 55 |
| With non-null variant_price | 55 |
| Last successful sync | 2026-02-25 07:11:39 |
| Regional URLs | 0 |

Prices range from $33.00 to $37.00. All 55 variants have prices from the initial catalog scrape (`method: auto`). All 21 subsequent `v2_shopify` sync attempts have **failed**.

**URL pattern**: Material-level category pages, not per-variant:
- `https://www.ic3dprinters.com/shop/pla-filaments/`
- `https://www.ic3dprinters.com/shop/petg/`
- `https://www.ic3dprinters.com/shop/abs-filaments/`

Multiple color variants share the same product URL (e.g., 2 PLA variants both point to `/shop/ic3d-pla-3d-printer-filament/`).

## 5. Critical Issues

1. **Platform misidentification**: IC3D detected as Shopify instead of WooCommerce -- all price syncs fail with 404
2. **WooCommerce slug extraction fails**: IC3D uses `/shop/slug/` not `/product/slug/`, so `extractSlug()` returns null
3. **Price range risk**: IC3D product pages display price ranges ("$34.99 -- $199.99" for 1kg vs 10kg). If WC Store API is used with variations, it should pick the cheapest. If JSON-LD is used, the lowest offer price should be correct. But Firecrawl markdown parsing could grab the wrong price.
4. **Promo code risk**: The "WelcomeTo2026" 50% promo code is a coupon code, not a site-wide displayed price change -- it should NOT affect the scraped price unless the site renders a sale price on the product page itself.

## Proposed Fix (for future implementation)

1. **Add `ic3dprinters.com` to platform detection** as `"woocommerce"`
2. **Fix WooCommerce slug extraction** to also handle `/shop/slug/` pattern (not just `/product/slug/`)
3. **Verify WC Store API works** for IC3D (test `/wp-json/wc/store/v1/products?slug=pla-filaments`)
4. **Ensure variation handling picks cheapest 1kg variant**, not the 10kg bulk price
