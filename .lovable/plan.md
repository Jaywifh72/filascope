

# Fix Prusa US Price Extraction (Currency Mismatch Issue)

## Root Cause

The Prusa extraction pipeline IS working -- Firecrawl successfully renders the page and returns 60K+ chars of content. The problem is a **currency mismatch rejection**:

1. For US region, the code requests `expectedCurrency = 'USD'`
2. Firecrawl's servers render from the EU, so Prusa's geo-detection shows EUR prices
3. The markdown parser finds `€1,349` and correctly identifies it as `EUR`
4. The currency mismatch check at line 1365 rejects the result: `got EUR, expected USD`
5. The HTML parser also finds EUR and gets rejected at line 1378
6. Both strategies fail, so it falls through to `manualFallback()`

This is confirmed by the edge function logs:
```
[Prusa] Firecrawl scrape: region=US → Got 60150 chars markdown
→ "No price found in markdown or HTML — returning manual fallback"
```
Meanwhile EU works perfectly because `expectedCurrency = EUR` matches the rendered currency.

## Solution

Since Prusa uses a **single global store** with the same prices worldwide (just different currency display based on geo-detection), the fix is:

### Change 1: Accept cross-currency prices for Prusa with conversion

In `extractPrusaPrice()` (lines 1361-1385), instead of rejecting currency mismatches, accept the extracted price and convert it to the expected currency using the exchange rates already in the database.

When a currency mismatch occurs:
- Log it as informational (not an error)
- Look up the exchange rate from `exchange_rates` table
- Convert the extracted price to the expected currency
- Mark with `confidence: 'low'` and `requires_review: true` to flag for manual verification
- Set `extraction_method` to `'firecrawl_converted'` for auditability

### Change 2: Fallback -- accept EUR price as-is for US when currencies share the same base price

Prusa's pricing is nearly 1:1 between USD and EUR (e.g., Core One is $1,349 USD and EUR 1,349). So as a simpler first approach:
- If the extracted currency is EUR and expectedCurrency is USD, and they're within 5% of each other (which they are for Prusa), accept the numeric value as the USD price
- This avoids needing exchange rate lookups for Prusa specifically

### Change 3: Add logging for diagnostic clarity

Add a log line when currency mismatch occurs that includes the actual prices found, making future debugging easier.

## Files to Modify

1. **`supabase/functions/_shared/printer-price-extraction.ts`** (lines 1361-1385):
   - Remove the strict currency rejection in `extractPrusaPrice()`
   - For Prusa specifically, accept the extracted price regardless of detected currency symbol when the brand uses a single global store (`uses_geo_pricing = true`)
   - Override the currency field to match the expected currency since Prusa uses 1:1 pricing
   - Add `requires_review: true` flag for converted prices

2. **Redeploy `sync-printer-prices`** edge function after changes

## Technical Details

Current code (lines 1364-1371):
```text
if (expectedCurrency && mdResult.currency && mdResult.currency !== expectedCurrency) {
  console.log(`[Prusa] MD currency mismatch: got ${mdResult.currency}, expected ${expectedCurrency}. Trying HTML.`);
  // Falls through to HTML, which also fails → manual fallback
}
```

New behavior:
```text
if (expectedCurrency && mdResult.currency && mdResult.currency !== expectedCurrency) {
  console.log(`[Prusa] Currency mismatch: got ${mdResult.currency}, expected ${expectedCurrency}. Accepting price (single global store).`);
  mdResult.currency = expectedCurrency;  // Override since Prusa uses ~1:1 pricing
  mdResult.requires_review = true;
  mdResult.confidence = 'low';
  return applyAnomalyCheck(mdResult, oldPrice, usPriceForSanity, expectedCurrency);
}
```

Same pattern applied to the HTML extraction path.

## Expected Outcome

| Product | US Before | US After | EU Before | EU After |
|---------|-----------|----------|-----------|----------|
| Core One | extraction_failed | $1,349 (from EUR) | $1,349 EUR | $1,349 EUR |
| Core One L | extraction_failed | $1,699 (from EUR) | $1,699 EUR | $1,699 EUR |
| CORE One+ Ultimate | extraction_failed | price extracted | price extracted | price extracted |
| MK4S | extraction_failed | price extracted | price extracted | price extracted |
| XL (3 variants) | extraction_failed | price extracted | price extracted | price extracted |

All 7 active products should sync for both US and EU regions. Prices marked `requires_review: true` for manual verification that EUR = USD assumption holds.

## Risk

Low. Prusa is well-known for having identical numeric prices in USD and EUR ($1,349 = EUR 1,349). The `requires_review` flag ensures any discrepancy is caught during manual review. The anomaly detection (`applyAnomalyCheck`) provides an additional safety net.

