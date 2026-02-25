
# Fix Printer Price Sync Failures

## Issues Identified

### 1. Bambu Lab P1P -- Discontinued (All 5 Regions Failed)
The P1P has been removed from Bambu Lab's store entirely. The URL `us.store.bambulab.com/products/p1p` now shows a product listing page (no P1P product). This printer needs to be marked as discontinued in the database.

**Fix:** Set `status = 'discontinued'` and `product_url = 'DISCONTINUED'` for the P1P printer record.

### 2. Bambu Lab X1 Carbon -- Wrong URL Format (US Failed + 5 Regions Geo-Blocked)
The US product_url is `bambulab.com/en/x1` which is the marketing page, NOT the store page. The store URL should be `us.store.bambulab.com/products/x1-carbon`. The geo-blocking on CA/UK/EU/AU/JP is a downstream effect of having no valid store URL to derive regional URLs from.

**Fix:** Update `product_url` to `https://us.store.bambulab.com/products/x1-carbon` and populate regional URL columns (`product_url_ca`, `_uk`, `_eu`, `_au`, `_jp`) using the standard `{region}.store.bambulab.com/products/x1-carbon` pattern.

### 3. Bambu Lab H2C EU/AU -- Accessory Price Matched (Critical Anomaly)
The EU/AU stores are geo-redirecting to the US store for our server's location. The extraction then picks up an accessory price (EUR139 hotend) instead of the printer price (EUR2,399). The anomaly detector correctly caught this (5% of US price), but the root issue is geo-blocking.

The H2C page on `eu.store.bambulab.com/products/h2c` renders but shows USD prices (geo-redirect to US). The extraction engine needs Firecrawl with EU location spoofing for this product.

**Fix:** This is already handled by the existing Firecrawl geo-bypass path. The issue is that the H2C and H2S are newer models and their EU/AU store pages may not have regional pricing yet, OR the Firecrawl extraction is not being triggered because the initial fetch "succeeds" (returns HTML but with wrong-region prices). Add H2C and H2S regional URLs to `product_url_eu` and `product_url_au` columns so the Firecrawl path gets the correct regional domain hint.

### 4. Bambu Lab H2S EU/AU -- Same Issue as H2C
Identical geo-redirect problem. EUR89 is clearly a hotend accessory, not the H2S printer (US: $1,499).

**Fix:** Same approach as H2C above.

### 5. Bambu Lab P1S AU: A$69 -- WRONG Price Marked as OK
This is the most dangerous issue. P1S costs $399 USD, but the AU column shows A$69, which would be ~$45 USD (11% of US price). This should have triggered the critical anomaly check, but it shows as "UNCHANGED" meaning this bad price was already in the database from a previous sync and is now persisting unchecked.

The AU store page (`au.store.bambulab.com/products/p1s`) shows "$639.00 USD" -- it's displaying US prices due to geo-redirect. The A$69 is likely from a previous extraction that picked up a "from $69" accessory price.

**Fix:** Clear `current_price_aud_store` for P1S (set to NULL). Add a "re-validate unchanged prices" check that runs the anomaly detector on existing prices, not just new extractions.

### 6. Bambu Lab P2S AU: A$69 -- Same Issue as P1S
P2S costs $549 USD; A$69 is clearly wrong (13% of US price).

**Fix:** Clear `current_price_aud_store` for P2S (set to NULL).

### 7. Creality K1 UK/EU/AU -- Extraction Failed
The Creality dedicated extraction pipeline tries JSON-LD on the custom storefront, then falls back to myshopify.com catalog discovery. For K1 specifically, the handle `k1-3d-printer` may not match on the regional myshopify backends (they often use different handles like `k1-3d-printer-1` or `creality-k1`).

**Fix:** The K1 is an older model that may be delisted from UK/EU/AU stores. Check if K1 still appears on regional Creality stores. If not found, mark as `not_in_region` for those territories. If found, cache the correct regional slug in `product_regional_slugs`.

## Implementation Plan

### Phase 1: Database Data Fixes (via insert tool)

1. **P1P Discontinuation**
   - UPDATE printers SET status = 'discontinued', discontinued_note = 'Removed from Bambu Lab store catalog as of Feb 2026' WHERE model_name = 'P1P' AND brand matches Bambu Lab

2. **X1 Carbon URL Fix**
   - UPDATE printers SET product_url = 'https://us.store.bambulab.com/products/x1-carbon', product_url_ca = 'https://ca.store.bambulab.com/products/x1-carbon', product_url_uk = 'https://uk.store.bambulab.com/products/x1-carbon', product_url_eu = 'https://eu.store.bambulab.com/products/x1-carbon', product_url_au = 'https://au.store.bambulab.com/products/x1-carbon', product_url_jp = 'https://jp.store.bambulab.com/products/x1-carbon' WHERE model_name matches X1 Carbon

3. **Clear Bad AU Prices**
   - UPDATE printers SET current_price_aud_store = NULL WHERE model_name IN ('P1S', 'P2S') AND brand matches Bambu Lab

4. **Creality K1 Regional Status**
   - Check if K1 exists on regional stores. If confirmed missing, UPDATE to set sync_status = 'not_in_region' for UK/EU/AU and clear the regional URLs.

### Phase 2: Extraction Engine Improvement (Code Change)

**File: `supabase/functions/_shared/printer-price-extraction.ts`**

Add an "unchanged price re-validation" function that can be called during sync to catch stale bad prices that were marked OK because they matched the (already wrong) database value. This prevents the P1S/P2S AU situation from recurring.

The logic: when a price is "unchanged", still run the cross-region anomaly check if a valid US price exists. If the unchanged price triggers a critical anomaly, flag it for clearing rather than silently passing.

**File: `supabase/functions/sync-printer-prices/index.ts`**

In the region sync loop, after extracting a price and finding it "unchanged", add a secondary check:
```
if (status === "unchanged" && usSalePrice && newPrice > 0) {
  // Re-validate existing price against US price
  const rate = TO_USD_RATE[regionMeta.currency];
  if (rate) {
    const ratio = (newPrice * rate) / usSalePrice;
    if (ratio < 0.15) {
      // Existing price is critically wrong -- clear it
      priceUpdates[regionMeta.priceCol] = null;
      status = "anomaly_cleared";
    }
  }
}
```

### Phase 3: Verify Creality K1 Regional Handles

Attempt to discover the K1 handle on each regional myshopify backend:
- `crealityuk.myshopify.com/products.json?title=K1` 
- `crealityeu.myshopify.com/products.json?title=K1`
- `crealityau.myshopify.com/products.json?title=K1`

If found, cache the handle in `product_regional_slugs`. If not found, confirm K1 as not_in_region for those territories.

## Summary of Changes

| Issue | Product | Regions | Fix Type |
|-------|---------|---------|----------|
| Discontinued | P1P | All | DB: status update |
| Wrong URL | X1 Carbon | US + all regional | DB: URL correction |
| Bad cached price | P1S | AU | DB: clear price |
| Bad cached price | P2S | AU | DB: clear price |
| Geo-redirect | H2C | EU, AU | DB: ensure regional URLs + Firecrawl path |
| Geo-redirect | H2S | EU, AU | DB: ensure regional URLs + Firecrawl path |
| Handle mismatch | K1 | UK, EU, AU | DB: discover + cache handle or mark not_in_region |
| Systemic | All printers | All | Code: add unchanged-price re-validation |
