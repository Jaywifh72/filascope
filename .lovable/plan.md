

# Fix Gizmo Dorks Price Extraction

## Problem
Gizmo Dorks (BigCommerce store) is misidentified as Shopify, causing all price fetches to 404. No BigCommerce handler exists in the price router.

## Changes

### 1. Add `gizmodorks.com` to platform detection
**File**: `supabase/functions/_shared/price-platforms.ts`
- Add `"bigcommerce"` as a new Platform type
- Add detection rule: `gizmodorks.com` returns `"bigcommerce"`

### 2. Add BigCommerce handler in price-extract-direct.ts
**File**: `supabase/functions/_shared/price-extract-direct.ts`
- New `fetchBigCommercePrice(productUrl, expectedCurrency)` function
- Strategy: fetch HTML, try JSON-LD first (BigCommerce embeds structured data), then fall back to HTML regex
- JSON-LD should capture the correct product price directly
- No BigCommerce Storefront API needed -- JSON-LD in the page HTML is sufficient

### 3. Add Afterpay/installment price guard
**File**: `supabase/functions/_shared/price-utils.ts`
- Add installment removal to `removeSavingsAmounts()`:
  - Strip lines matching patterns like "4 payments of $X.XX", "pay in 4", "interest-free payments", "Afterpay", "Sezzle", "Klarna"
- This protects all extractors that use this utility, not just BigCommerce

### 4. Add `bigcommerce` case to the router
**File**: `supabase/functions/get-current-price-v2/index.ts`
- Import `fetchBigCommercePrice`
- Add `case "bigcommerce"` that calls the new handler with Firecrawl fallback (without the is404 guard)

### 5. Deploy and verify
- Redeploy `get-current-price-v2`
- Live test against `https://gizmodorks.com/pla-3d-printer-filament/`
- Confirm extracted price is $23.95 (not $5.99 installment)

## Technical Details

The BigCommerce handler will follow the same pattern as the Geeetech handler:

```text
fetchBigCommercePrice(url, currency)
  1. Fetch HTML with browser headers
  2. Try extractJsonLdPrice() -- BigCommerce embeds Product schema
  3. Return result or fail
```

Router case:
```text
case "bigcommerce":
  result = fetchBigCommercePrice(urlToFetch, expectedCurrency)
  if (!result.success) -> Firecrawl fallback (no is404 guard)
```

Installment guard additions to `removeSavingsAmounts()`:
```text
- /\d+\s*(interest-free\s+)?payments?\s+of\s+\$[\d,.]+/gi
- /pay\s+in\s+\d+/gi
- /(?:afterpay|sezzle|klarna|zip\s+pay)[^$]*\$[\d,.]+/gi
```

