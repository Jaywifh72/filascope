

# Fix: ColorFabb Sync Failures (All 25 Products)

## Root Cause

ColorFabb.us is a **Magento** e-commerce store, but the platform detector (`price-platforms.ts`) has no rule for it, so it defaults to `"shopify"`. This causes two cascading failures:

1. The Shopify extractor tries `https://colorfabb.us/pla-silk-red.json` -- Magento doesn't support this endpoint, so it returns **HTTP 404**
2. The `get-current-price-v2` router sees `is404: true` and **skips the Firecrawl fallback** entirely (the code says: `if (!result.success && !result.is404)` -- meaning Firecrawl is only tried when the page exists but Shopify JSON parsing failed)

Result: every single ColorFabb product fails with "HTTP 404" without ever attempting the Firecrawl HTML scraper that could actually read the Magento page.

## Solution

### 1. Add ColorFabb to platform detection as "magento" (Firecrawl-routed)

**File:** `supabase/functions/_shared/price-platforms.ts`
- Add `"magento"` to the `Platform` type
- Add detection rule: `if (l.includes("colorfabb.us") || l.includes("colorfabb.com"))` return `"magento"`

### 2. Route "magento" directly to Firecrawl in the v2 router

**File:** `supabase/functions/get-current-price-v2/index.ts`
- Add a `case "magento":` that calls `extractFirecrawlPrice()` directly, skipping the Shopify JSON attempt entirely

### 3. Increase Firecrawl wait time for Magento stores

**File:** `supabase/functions/_shared/price-extract-firecrawl.ts`
- The current `waitFor: 3000` may be insufficient for Magento's heavy JavaScript rendering. Pass `waitFor: 5000` for Magento domains to give the page time to render prices.

## Technical Details

```text
price-platforms.ts:   Add Platform "magento", detect colorfabb.us/colorfabb.com
get-current-price-v2: Add case "magento" -> extractFirecrawlPrice() directly
price-extract-firecrawl.ts: Accept optional waitFor override parameter
```

The Firecrawl extractor already handles price extraction from markdown, stock detection ("out of stock"), and currency matching -- it just was never being reached for ColorFabb URLs due to the premature 404 exit.

Note: Some ColorFabb products may genuinely be out of stock or discontinued (the store shows "Out of stock" or 404/405 pages). These will correctly return `available: false` or `is404: true` from Firecrawl, which is the expected behavior -- the fix ensures we at least *try* Firecrawl rather than failing at the Shopify JSON step.

