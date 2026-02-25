

# Regional Store Gap Resolution Plan

## Investigation Results Summary

### 1. EufyMake (AnkerMake M5/M5C)

**All 5 regional URLs load successfully** (HTTP 200) with correct regional routing:
- US: `eufymake.com/m5` and `/m5c`
- CA: `eufymake.com/ca/m5` and `/ca/m5c`
- UK: `eufymake.com/uk/m5` and `/uk/m5c`
- EU: `eufymake.com/eu-en/m5` and `/eu-en/m5c`
- AU: `eufymake.com/au/m5` and `/au/m5c`

**Extraction challenge:** EufyMake uses a Next.js SSR app (not Shopify). No JSON-LD Product schema, no `og:price:amount` meta tags, and no Shopify JSON endpoint. Prices are rendered client-side via JavaScript. The scraped markdown shows only accessory prices ($399.99 UV printer attachments) but NOT the M5/M5C printer price.

**Extraction method required:** Firecrawl with `waitFor` (JS rendering) + location spoofing per region. The price will need to be extracted from rendered HTML using CSS selectors or regex on the Firecrawl markdown output.

### 2. Raise3D

**EU store confirmed:** `eu.raise3d.com` redirects to `eushop.raise3d.com` (Shopify). Verified via `/products.json`.

**Product availability on EU store:**
| Model | EU Handle | Status | Price |
|-------|-----------|--------|-------|
| Pro3 Series | `raise3d-pro3-3d-printer-hyper-speed-package` | Available (sold out) | EUR 2,499 |
| E2 Series | `raise3d-e2-3d-printer` | 404 - Not found | N/A |
| Pro2 | `raise3d-pro2-3d-printer` | 404 - Not found | N/A |
| RMF Series | `raise3d-rmf500` | 404 - Not found | N/A |

**No CA/UK/AU stores exist.** Only US (`shop.raise3d.com`) and EU (`eushop.raise3d.com`).

### 3. FlashForge Missing Models

**Guider 4, Guider 4 Pro:** Both return 404 on `www.flashforge.com` with all tested handles (`guider-4`, `flashforge-guider-4-3d-printer`, `guider4`). The store navigation only lists Guider 3 Ultra under the Guider Series. These models are not yet released on the FlashForge store.

**Guider 3 Plus:** Also 404. The Guider 3 Plus is listed in the DB with MSRP $2,499 but has no store presence. The previous sync log already marked it as `[SKIPPED] Guider 3 Plus -- US -- Discontinued`.

### 4. FLSUN UK Coverage

**Database state for all 9 FLSUN printers (excluding discontinued Q5):**

| Model | US Handle | UK URL | UK Status |
|-------|-----------|--------|-----------|
| S1 | `flsun-s1` | NULL | Redirects to homepage -- NOT on UK store |
| S1 Pro | `flsun-s1-pro` | Populated | Working (has price) |
| Super Racer | `flsun-sr-3d-printer` | NULL | Redirects to homepage -- NOT on UK store |
| T1 | N/A (no US URL) | NULL | Redirects to homepage -- NOT on UK store |
| T1 Max | `flsun-t1-max-3d-printer` | Populated | Working (has price) |
| T1 Pro | N/A (no US URL) | NULL | **Found: handle `flsun-t1-pro`, price GBP 509** |
| V400 | `flsun-v400` | NULL | Redirects to homepage -- NOT on UK store |
| V400 Max | `flsun-v400-max-3d-printer-custom-built-edition` | NULL | Redirects to homepage -- NOT on UK store |

**Result:** Only 3 of 8 active FLSUN printers are on the UK store: S1 Pro, T1 Max, and T1 Pro. The rest genuinely aren't sold in UK.

---

## Implementation Plan

### Phase 1: EufyMake Regional URLs + Firecrawl Extraction

**Database updates:**
- Set `product_url_ca`, `_uk`, `_eu`, `_au` for M5 and M5C using confirmed path-based URLs
- Change `sync_status` from `manual_only` to `firecrawl_required`

**Code changes in `_shared/printer-price-extraction.ts`:**
- Add EufyMake to Firecrawl extraction path with `waitFor: 3000` for JS rendering
- Add CSS selector pattern for EufyMake price element (will need to inspect rendered DOM)
- Map regional paths to currencies: `/ca/` = CAD, `/uk/` = GBP, `/eu-en/` = EUR, `/au/` = AUD

**Code changes in `_shared/regional-fetch.ts`:**
- Add `eufymake.com` to `GEO_REDIRECT_DOMAINS` list

### Phase 2: Raise3D EU URL Population

**Database updates:**
- Set `product_url_eu` for Pro3 Series to `https://eu.raise3d.com/products/raise3d-pro3-3d-printer-hyper-speed-package`
- Set `product_url_eu = NULL` for E2, Pro2, RMF (confirmed 404 on EU store)
- Mark E2, Pro2, RMF as `not_in_region` for EU
- No CA/UK/AU stores exist -- leave those NULL

**Note:** The EU store domain `eu.raise3d.com` redirects to `eushop.raise3d.com`. Store the user-facing `eu.raise3d.com` URL (it resolves correctly).

### Phase 3: FlashForge Discontinued Models

**Database updates:**
- Set `is_discontinued = true` for Guider 4, Guider 4 Pro, and Guider 3 Plus
- Set `discontinued_note` explaining they are not listed on any FlashForge regional store
- Keep MSRP values for historical reference

### Phase 4: FLSUN UK URL Gaps

**Database updates:**
- Set `product_url_uk = 'https://uk.store.flsun3d.com/products/flsun-t1-pro'` for T1 Pro (confirmed working, GBP 509)
- Mark S1, Super Racer, T1, V400, V400 Max as `not_in_region` for UK (confirmed homepage redirects)
- Cache `flsun-t1-pro` in `product_regional_slugs` for UK region

### Phase 5: Sync Engine Updates

**File: `supabase/functions/_shared/printer-price-extraction.ts`**
- Add EufyMake domain handling to Firecrawl extraction tier
- Add `eufymake.com` region-path mapping: `{'/ca/': 'CA', '/uk/': 'UK', '/eu-en/': 'EU', '/au/': 'AU'}`

**File: `supabase/functions/_shared/regional-fetch.ts`**
- Add `eufymake.com` to `GEO_REDIRECT_DOMAINS`

**File: `supabase/functions/sync-printer-prices/index.ts`**
- Add EufyMake/AnkerMake to the brand routing logic so it uses Firecrawl with location parameter instead of Shopify JSON

---

## Technical Details

### EufyMake Extraction Strategy

EufyMake is NOT Shopify despite using `cdn.shopify.com` for images. It's a custom Next.js storefront. The extraction path will be:

1. Skip Shopify JSON (will fail)
2. Skip JSON-LD (none present)
3. Use Firecrawl with `waitFor: 3000` and `location: {country: region}` to render JS
4. Extract price from rendered markdown using regex pattern matching for currency + amount

### Files to Modify

| File | Changes |
|------|---------|
| `_shared/printer-price-extraction.ts` | Add EufyMake Firecrawl extraction logic + region-path mapping |
| `_shared/regional-fetch.ts` | Add `eufymake.com` to GEO_REDIRECT_DOMAINS |
| `sync-printer-prices/index.ts` | Add AnkerMake/EufyMake brand routing for Firecrawl path |
| Database: `printers` table | URL updates for M5, M5C, Raise3D Pro3, FLSUN T1 Pro |
| Database: `printers` table | Discontinue FlashForge Guider 4, 4 Pro, 3 Plus |
| Database: `printers` table | Mark not_in_region for confirmed missing FLSUN UK models |

