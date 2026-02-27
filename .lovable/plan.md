
# FormFutura Sync Pipeline -- Full Audit Report

## 1. Platform Detection and Routing

**`detectPlatform()` in `price-platforms.ts` (line 19):**
```typescript
if (l.includes("formfutura.com")) return "magento";
```
Result: FormFutura correctly routes to `"magento"`.

**`case "magento":` handler in `get-current-price-v2/index.ts` (line 81):**
```typescript
case "magento":
  result = await extractFirecrawlPrice(urlToFetch, expectedCurrency, productType, 5000);
  break;
```
Result: Correctly calls Firecrawl with 5000ms wait. No issues here.

---

## 2. Firecrawl Extractor (price-extract-firecrawl.ts)

**European decimal parsing:** Present and working. The `parseExtractedPrice()` helper (line 64) correctly handles comma-as-decimal for EUR and formfutura.com via `isEuropeanStore` flag.

**Max price threshold (line 61):**
```typescript
const priceRange = productType === "printer"
  ? { min: 99, max: 10000 }
  : { min: 10, max: isColorFabb ? 300 : 150 };
```
**BUG FOUND:** FormFutura's max is capped at **150**. But the database shows 195 variants with `variant_price > 30` and a max of **312.39**. FormFutura sells large-format spools (e.g., 8kg spools at EUR 250+). Any price above EUR 150 is silently rejected by the range filter, returning "No valid price found."

**Live test confirms extraction works for normal products:**
```json
{
  "success": true,
  "price": 16.52,
  "currency": "EUR",
  "source": "firecrawl",
  "available": true
}
```

---

## 3. Sync-Prices Pipeline (sync-prices/index.ts)

**EUR-only brand list (line 534):**
```typescript
const isEurOnlyBrand = ['extrudr', 'formfutura'].includes(vendor.toLowerCase());
```
Present and correct.

**URL deduplication cache (line 480):**
```typescript
const urlExtractionCache = new Map<string, ExtractionResult>();
```
Present and working in the regional-fallback legacy path (lines 542-554).

**Price column routing (line 536-579):**
When `isEurOnlyBrand` is true, it writes to `price_eur`. This works correctly.

---

## 4. CRITICAL BUG: Case-sensitive vendor query

**The brand sync query (line 402):**
```typescript
query = query.eq('vendor', brandSlug);
```

The `brandSlug` from `automated_brands` is `"formfutura"` (lowercase), but **all 460 filaments have `vendor = 'FormFutura'`** (mixed case). The query `WHERE vendor = 'formfutura'` returns **0 rows**.

This means: when calling sync-prices with `brandSlug: "formfutura"`, the query finds 0 products and exits immediately with `total: 0`. The sync appears "successful" but processes nothing.

**Evidence:** Only 4 out of 460 variants have `price_eur` populated. These were likely from single-product manual syncs or test runs, not batch brand syncs.

---

## 5. Database State

| Metric | Value |
|--------|-------|
| Total FormFutura variants | 460 |
| Unique product URLs | 80 |
| Regional URL entries | 80 |
| Variants with `price_eur` | **4** (0.9%) |
| Variants with `variant_price` | **460** (100%) -- but these are stale/wrong values |
| Last scraped | 2026-02-27 02:48 UTC (recent, from manual tests) |

**Price distribution in `variant_price`:** min=9.50, max=312.39. These are EUR prices incorrectly stored in the USD column from old syncs before the EUR-only fix.

---

## 6. Legacy path also broken

The legacy path (lines 806-942, `useRegionalUrls = false`) has the **same case-sensitivity bug** at line 402, plus it does NOT use `isEurOnlyBrand` -- it writes directly to `variant_price` (USD column), not `price_eur`.

---

## 7. Extraction log analysis (last 24h)

| Status | Count | Detail |
|--------|-------|--------|
| Success | ~1,300+ | Most extracted price: 11.56 (1,177 hits -- suspicious, likely same product URL cached) |
| "No valid price found" | 281 | Likely products with prices above EUR 150 max threshold |
| "HTTP 404" | 123 | Broken product URLs |
| "OUT_OF_STOCK_NO_PRICE" | 45 | Discontinued products |

---

## Summary of Bugs Found

### Bug 1: Case-sensitive vendor matching (CRITICAL -- sync processes 0 products)
- `automated_brands.brand_slug` = `"formfutura"` (lowercase)
- `filaments.vendor` = `"FormFutura"` (mixed case)
- Query uses `eq('vendor', brandSlug)` which is case-sensitive
- **Fix:** Use `.ilike('vendor', brandSlug)` or normalize the vendor value

### Bug 2: Price range max too low (HIGH -- rejects ~30% of products)
- FormFutura max filament price is EUR 312, but Firecrawl extractor caps at 150
- Products priced EUR 150+ return "No valid price found"
- **Fix:** Raise max for FormFutura or make it configurable per-brand. FormFutura sells bulk spools up to 8kg at EUR 300+.

### Bug 3: EUR prices stuck in variant_price (USD) column
- 460 variants have EUR prices in `variant_price` from pre-fix syncs
- Only 4 have correct `price_eur` values
- **Fix:** After fixing bugs 1-2, run a migration to null out incorrect `variant_price` values for FormFutura and re-sync

### Bug 4: 123 broken/404 product URLs
- ~15% of URLs return 404 -- likely discontinued products or URL format changes
- **Fix:** Flag these with `sync_status = 'broken_url'` and exclude from future syncs

