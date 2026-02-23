
# Robust Printer Price Sync for All Brands

## Problem Summary

After thorough analysis of every brand's website, database URLs, and sync configuration, I found significant issues preventing reliable "Resync Selected" across all brands. Here's the brand-by-brand status:

| Brand | Status | Issue |
|-------|--------|-------|
| Bambu Lab | Partial | Working via Firecrawl for most regions |
| Anycubic | Working | JSON-LD extraction works |
| Creality | Partial | 2 printers have broken/wrong-domain URLs |
| Elegoo | Broken | Some product URLs return 404 (discontinued pages) |
| FlashForge | ALL BROKEN | Every URL uses dead domain `flashforgeshop.com`; correct domain is `flashforge.com` |
| FLSUN | Blocked | Marked `manual_only` but has working Shopify store |
| Prusa Research | Blocked | Marked `manual_only` but Firecrawl can extract prices |
| QIDI Tech | Broken | Config points to `qidi3d.com` but store is now `us.qidi3d.com` |
| Snapmaker | Broken | Config URL pattern is wrong; actual store is `us.snapmaker.com` |
| Sovol | Partial | Some URLs are 404 for discontinued models |
| LDO Motors | No config | Third-party reseller, no brand_sync_config entry |

## Plan

### Phase 1: Fix All Broken Product URLs in Database

Update the `printers` table with correct URLs for every active, non-discontinued printer:

- **FlashForge**: Update all 5 active product URLs from `flashforgeshop.com/product/...` to `flashforge.com/products/...` with correct new slugs. Mark Guider 4 and Guider 4 Pro with corrected URLs or as upcoming/unavailable.
- **QIDI Tech**: Update URLs from `qidi3d.com` to `us.qidi3d.com` for all 4 models.
- **Creality**: Fix `Sermoon D3` URL (wrong domain) and `Sermoon D3 Pro` URL (has `/ca/` prefix causing wrong-region extraction).
- **Snapmaker**: Update URLs to use `us.snapmaker.com` and verify each product slug works. The Snapmaker U1 uses a non-standard path (`/en/snapmaker-u1`) -- needs special handling.
- **Sovol**: Remove or mark discontinued models (SV06 returns 404). Verify remaining URLs.

### Phase 2: Update `brand_sync_config` Table

Add or update configuration for every brand so the sync engine knows the correct extraction strategy:

- **FlashForge**: Update `store_url_us` to `https://www.flashforge.com/products/{slug}`, set `shopify_json_available: true` (new Shopify store), change `primary_extraction` to `shopify_json`.
- **FLSUN**: Change from `manual_only` to `shopify_json`, set `shopify_json_available: true`, update `store_url_us` to `https://us.store.flsun3d.com/products/{slug}`.
- **QIDI Tech**: Update `store_url_us` to `https://us.qidi3d.com/products/{slug}`. Test Shopify JSON availability.
- **Snapmaker**: Update `store_url_us` to `https://us.snapmaker.com/products/{slug}`, test Shopify JSON.
- **Prusa Research**: Change from `manual_only` to `json_ld` with Firecrawl markdown fallback. Prusa's WooCommerce site has prices visible in markdown (e.g., "$1199 USD" in comparison tables). The Firecrawl markdown parser can extract these.
- **LDO Motors**: Add config entry for Fabreeko (Shopify store) or keep as manual.

### Phase 3: Enhance Extraction Engine for Edge Cases

Updates to `printer-price-extraction.ts`:

1. **Prusa WooCommerce support**: The current `extractSlug` function handles `/product/{slug}/` (WooCommerce format) already, but Prusa's site doesn't use Shopify JSON or standard JSON-LD. Prices appear in the page HTML as text like "$1,199" and in comparison tables. Add a Firecrawl markdown strategy that looks for price patterns like `$X,XXX USD` near product configuration sections.

2. **Snapmaker non-standard URLs**: The Snapmaker U1 uses `/en/snapmaker-u1` instead of `/products/{slug}`. The slug extractor needs to handle this. Add fallback to use the full `product_url` directly rather than building from template.

3. **FlashForge regional stores**: FlashForge now has regional subdomains (`ca.flashforge.com`, `eu.flashforge.com`, `uk.flashforge.com`, `au.flashforge.com`). Add these to `brand_sync_config` regional URL templates.

4. **FLSUN regional stores**: FLSUN has regional Shopify stores (`us.store.flsun3d.com`). Add geo-aware spoof headers if needed, or add regional URL templates.

5. **Improved markdown price parser**: Enhance `parseMarkdownPrices` to also handle:
   - Inline price patterns like `Sale price$299.00 USDRegular price$399.00 USD` (FlashForge format)
   - Table-based pricing (Prusa comparison tables)
   - Strikethrough patterns like `~~$1,499.00~~\n$599.00` (FLSUN format)

### Phase 4: Add `REGION_SPOOF_HEADERS` for New Geo-Blocking Domains

Several brands use regional subdomains that may geo-redirect:
- `us.qidi3d.com`, `eu.qidi3d.com`
- `us.store.flsun3d.com`
- `us.snapmaker.com`, `eu.snapmaker.com`

Add these to the `REGION_SPOOF_HEADERS` map so the Firecrawl fallback triggers correctly when direct fetch is geo-blocked.

## Technical Details

### Database Migrations

**URL fixes** (SQL UPDATE statements):
```text
-- FlashForge URL migration
UPDATE printers SET product_url = 'https://www.flashforge.com/products/flashforge-ad5x-3d-printer' WHERE model_name = 'AD5X' AND brand_id = (SELECT id FROM printer_brands WHERE brand = 'FlashForge');
UPDATE printers SET product_url = 'https://www.flashforge.com/products/adventurer-5m-3d-printer' WHERE model_name = 'Adventurer 5M' AND ...;
-- (similar for all FlashForge models)

-- QIDI Tech URL migration  
UPDATE printers SET product_url = 'https://us.qidi3d.com/products/q1-pro-3d-printer' WHERE model_name = 'Q1 PRO' AND ...;
-- (similar for all QIDI models)

-- Creality fixes
UPDATE printers SET product_url = 'https://store.creality.com/products/sermoon-d3-3d-printer' WHERE model_name = 'Sermoon D3' AND ...;
UPDATE printers SET product_url = 'https://store.creality.com/products/sermoon-d3-pro-3d-printer' WHERE model_name = 'Sermoon D3 Pro' AND ...;
```

**brand_sync_config updates**:
```text
-- FlashForge: new Shopify store
UPDATE brand_sync_config SET 
  store_url_us = 'https://www.flashforge.com/products/{slug}',
  shopify_json_available = true,
  primary_extraction = 'shopify_json',
  store_platform = 'shopify'
WHERE brand_id = 'flashforge';

-- FLSUN: enable auto-sync
UPDATE brand_sync_config SET
  primary_extraction = 'shopify_json',
  shopify_json_available = true,
  store_url_us = 'https://us.store.flsun3d.com/products/{slug}'
WHERE brand_id = 'flsun';

-- Prusa: enable Firecrawl-based sync
UPDATE brand_sync_config SET
  primary_extraction = 'json_ld',
  fallback_extraction = 'meta_tags'
WHERE brand_id = 'prusa-research';

-- QIDI Tech: fix store URL
UPDATE brand_sync_config SET
  store_url_us = 'https://us.qidi3d.com/products/{slug}'
WHERE brand_id = 'qidi-tech';

-- Snapmaker: fix store URL  
UPDATE brand_sync_config SET
  store_url_us = 'https://us.snapmaker.com/products/{slug}'
WHERE brand_id = 'snapmaker';
```

### Edge Function Changes

**`printer-price-extraction.ts`**:
- Add new domains to `REGION_SPOOF_HEADERS` for QIDI, FLSUN, Snapmaker, FlashForge regional stores
- Enhance `parseMarkdownPrices` with 2 new strategies:
  - Strategy 3: Inline sale/regular price pattern (`Sale price$XXX...Regular price$YYY`)
  - Strategy 4: Strikethrough markdown pattern (`~~$OLD~~\n$NEW`)
- Improve currency detection for CAD/AUD (both use `$` symbol)

**`sync-printer-prices/index.ts`**:
- No structural changes needed -- the existing extraction pipeline handles the fallback correctly once configs and URLs are fixed

### Expected Outcome After Implementation

| Brand | Before | After |
|-------|--------|-------|
| Bambu Lab | Partial (geo-blocked regions) | Full (Firecrawl bypass) |
| Anycubic | Working | Working (no change) |
| Creality | 2 broken URLs | Full (URLs fixed) |
| Elegoo | Some 404s | Full (URLs updated) |
| FlashForge | ALL broken (dead domain) | Full (new Shopify JSON) |
| FLSUN | Manual only | Full (Shopify JSON auto-sync) |
| Prusa Research | Manual only | Full (Firecrawl markdown) |
| QIDI Tech | Wrong domain | Full (Shopify JSON) |
| Snapmaker | Wrong domain | Full (Shopify JSON) |
| Sovol | Partial (dead URLs) | Full (cleanup + Shopify JSON) |
| LDO Motors | No config | Firecrawl markdown fallback |

All brands will support "Resync Selected" with automatic price extraction, using the tiered strategy: Shopify JSON, JSON-LD, Meta Tags, Firecrawl Markdown.
