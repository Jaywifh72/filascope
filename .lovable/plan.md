
# NinjaTek Scraping Pipeline Audit

## 1. Platform Detection

| Domain | `detectPlatform()` returns | Correct? |
|--------|--------------------------|----------|
| `ninjatek.com` | `"shopify"` (default fallback) | **NO** -- WooCommerce store |
| `ninjatek.ca` | `"shopify"` (default fallback) | **YES** -- Shopify store |

`ninjatek.com` is not listed in any detection rule, so it falls through to the default `return "shopify"`. This causes all price syncs to attempt `ninjatek.com/shop/ninjaflex/.json` which returns **HTTP 404**. The `is404` guard then blocks the Firecrawl fallback.

## 2. Live Test Results

### US Store (ninjatek.com/shop/ninjaflex/)
```text
{
  "success": false,
  "price": null,
  "error": "HTTP 404",
  "is404": true,
  "source": "shopify"
}
```
**Expected**: $102.46 USD (1kg, 1.75mm). Page renders price correctly in HTML but:
- No JSON-LD structured data on page
- WC Store API (`/wp-json/wc/store/v1/products?slug=ninjaflex`) returns **empty array** `[]`
- This means the WC extractor's primary method (Store API) will not work even after fixing platform detection
- Firecrawl fallback would be required, or the JSON-LD fallback in the WC handler needs to parse the raw HTML price

### CA Store (ninjatek.ca Shopify JSON)
`ninjatek.ca/products/shop-ninjaflex.json` returns valid Shopify JSON with product data. This store would work correctly with the existing Shopify extractor since `detectPlatform("ninjatek.ca")` already returns `"shopify"`.

## 3. Database State

| Metric | Value |
|--------|-------|
| Total NinjaTek variants | 72 |
| With non-null `variant_price` (USD) | **0** |
| With non-null `price_cad` | **0** |
| With `product_url_ca` | **0** |
| Regional URLs (`product_regional_urls`) | **0** |
| `sync_status` | `synced` (misleading -- no prices stored) |
| `automated_brands` config | `platform_type: 'shopify'`, `supported_regions: ['EU', 'US']` |

All 72 variants have `variant_price = NULL`. Despite `sync_status = 'synced'`, no prices have ever been successfully extracted. The `products_with_prices: 0` field in `automated_brands` confirms this.

### Stored URLs (all US store, WooCommerce `/shop/` pattern):
- `https://ninjatek.com/shop/ninjaflex/`
- `https://ninjatek.com/shop/cheetah/`
- `https://ninjatek.com/shop/chinchilla/`
- `https://ninjatek.com/shop/armadillo/`
- `https://ninjatek.com/shop/edge/`
- `https://ninjatek.com/shop/colorfabb-pla/`
- `https://ninjatek.com/shop/colorfabb-asa/`
- `https://ninjatek.com/shop/colorfabb-co-polyesters/`
- `https://ninjatek.com/shop/colorfabb-specials/`

No CA store URLs are stored anywhere.

## 4. Critical Issues

1. **Platform misidentification**: `ninjatek.com` detected as Shopify instead of WooCommerce. All syncs 404.
2. **WC Store API returns empty**: Even after fixing platform detection, the WC Store API slug lookup returns `[]` for NinjaTek products. The store appears to use a custom WooCommerce page builder that doesn't expose products through the standard Store API.
3. **No JSON-LD on page**: The WC handler's JSON-LD fallback will also fail because ninjatek.com pages contain no `application/ld+json` structured data.
4. **Price only in rendered HTML**: The price `$102.46` appears in the rendered DOM but requires HTML parsing or Firecrawl to extract.
5. **Variable product with weight variants**: Each product page has 0.5kg/1kg/2kg spool weight options. The correct target is the 1kg price. Firecrawl would need to correctly identify which price corresponds to which weight.
6. **No CA store coverage**: `ninjatek.ca` (Shopify, CAD pricing) is not configured anywhere. `supported_regions` includes EU but not CA.
7. **`automated_brands` misconfigured**: Lists `platform_type: 'shopify'` and `supported_regions: ['EU', 'US']`. Should be WooCommerce for US, and CA should be added for the Shopify store.

## 5. Proposed Fixes

### Fix 1: Add `ninjatek.com` to platform detection as WooCommerce
**File**: `supabase/functions/_shared/price-platforms.ts`
- Add `if (l.includes("ninjatek.com") && !l.includes("ninjatek.ca")) return "woocommerce";`

### Fix 2: Add HTML price extraction fallback to WC handler
**File**: `supabase/functions/_shared/price-extract-wc.ts`
- After the JSON-LD fallback fails, add an HTML regex fallback that looks for common WC price patterns in the rendered HTML
- NinjaTek renders prices in a format like `$102.46` within product summary sections
- Target pattern: look for price inside `.summary .price`, `.woocommerce-Price-amount`, or raw `$XX.XX` near "Add to Cart"

### Fix 3: Ensure Firecrawl fallback is not blocked
**File**: `supabase/functions/get-current-price-v2/index.ts`
- The WooCommerce case already falls through to Firecrawl fallback (no `is404` guard), so once platform detection is fixed, Firecrawl will be tried if WC extraction fails

### Fix 4: Add NinjaTek CA store
- Add `ninjatek.ca` URLs to `product_url_ca` column for matching products
- Update `automated_brands.supported_regions` from `['EU', 'US']` to `['US', 'CA']` (EU is unlikely to work without a EU-specific store)
- CA store uses standard Shopify and will work out of the box

### Fix 5: Update `automated_brands` config
- Change `platform_type` from `shopify` to `woocommerce` (or `firecrawl` to force Firecrawl path)
- Fix `supported_regions` to `['US', 'CA']`

### Fix 6: Weight variant selection
- When extracting from Firecrawl markdown, the existing `removeSavingsAmounts()` and price selection logic should pick the default-selected variant (1kg). However, NinjaTek's page lists all variants as a dropdown, so Firecrawl may capture the pre-selected default price ($102.46 for 1kg). This needs verification after the fix is deployed.
