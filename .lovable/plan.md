
# ✅ COMPLETED: Fix Creality Regional Pricing

All 4 fixes from the plan have been implemented and deployed.

## What was done

### Fix 1: Price sanity check against US price ✅
- Added `CREALITY_ROUGH_EXCHANGE_RATES` constant (CA: 1.36, UK: 0.79, EU: 0.92, AU: 1.55, JP: 150)
- Added `usPriceForSanity` parameter through `extractPrice()` → `extractCrealityRegionalPrice()`
- Cross-region validation: ratio < 0.15 = reject (accessory), ratio > 5.0 = flag for review

### Fix 2: Expanded EXCLUDE_KEYWORDS + minimum price filter ✅
- Added: kit|mount|cover|tube|clip|screw|bolt|motor|wheel|pulley|rail|guide|adapter|connector|mod|part|component|extrusion
- Added minimum price filter: products where ALL variants are < $30 are filtered out

### Fix 3: Custom storefront search fallback ✅
- New function `discoverCrealityHandleViaSearch(region, productTitle)`
- Fetches `store.creality.com/{region}/search?q={title}` and parses product links
- Integrated as step 3 in the extraction pipeline (after myshopify, before giving up)

### Fix 4: Pass US price through sync orchestrator ✅
- `sync-printer-prices/index.ts` tracks `usSalePrice` after US region sync
- Passes it to `extractPrice()` for non-US Creality regions
- Falls back to `current_price_usd_store` from the printer row if US sync hasn't run yet

## Files modified
- `supabase/functions/_shared/printer-price-extraction.ts`
- `supabase/functions/sync-printer-prices/index.ts`
