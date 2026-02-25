

# Comprehensive Regional Coverage Audit and Expansion Plan

## Executive Summary

After auditing all brands in the database, I identified **significant regional gaps** across both filament and printer brands. The biggest issues are:
- **FlashForge**: Has 4 confirmed Shopify regional stores (CA, EU, UK, AU) but only US+EU are configured
- **Creality printers**: 17 active printers with zero regional URLs despite having CA/EU/UK/AU stores
- **Anycubic printers**: 7 of 9 printers missing CA/EU/UK regional URLs despite stores being active
- **Polymaker**: CA store confirmed working (Shopify JSON) but not in filament sync config; UK/AU DNS failures
- **AnkerMake**: Migrated to EufyMake -- current URLs are stale redirects to a non-Shopify platform
- **Two BRAND_REGIONAL_DOMAINS maps are out of sync** between `sync-regional-prices` and `sync-brand-products`

---

## 1. Master Coverage Table -- Current State

### Filament Brands

| Brand | US | CA | EU | UK | AU | JP | Sync Method | Gap? |
|-------|----|----|----|----|----|----|-------------|------|
| Bambu Lab | Active | Active | Active | Active | Active | Active | firecrawl | No |
| Elegoo | Active | Active | Active | Active | Active | -- | shopify_json | No |
| Polymaker | Active | **MISSING** | Active | **DEAD** | **DEAD** | -- | shopify | **YES** |
| Creality | Active | Active | Active | Active | Active | Active | firecrawl | No |
| Anycubic | Active | Active | Active | Active | **DEAD** | -- | shopify | Partial |
| eSun | Active | -- | Active | Active | -- | -- | shopify | No |
| Eryone | Active | Active | Active | Active | Active | -- | shopify | No |
| Sunlu | Active | Active | Active | Active | Active | -- | shopify | No |
| Kingroon | Active | Active | Active | Active | Active | -- | shopify | No |
| FlashForge | Active | **MISSING** | Active | **MISSING** | **MISSING** | -- | shopify | **YES** |
| Jayo | Active | -- | Active | Active | -- | -- | shopify | No |
| Sovol | Active | -- | Active | -- | -- | -- | shopify | No |
| FLSUN | Active | Active | Active | Active | Active | -- | shopify | No |
| Hatchbox | Active | -- | -- | -- | -- | -- | shopify | US-only store |
| Fiberlogy | Active | -- | Active | -- | -- | -- | shopify | EU-only intl |
| Fillamentum | Active | -- | Active | -- | -- | -- | firecrawl | EU-only intl |
| FormFutura | Active | -- | Active | -- | -- | -- | firecrawl | EU-only store |
| Proto-Pasta | Active | -- | -- | -- | -- | -- | shopify | US-only store |
| Prusament | Active | -- | Active | -- | -- | -- | firecrawl | geo-pricing |
| 3DXTech | Active | -- | Active | -- | -- | -- | shopify | No |
| Amolen | Active | Active | Active | Active | -- | -- | shopify | No |
| ColorFabb | Active | -- | Active | -- | -- | -- | firecrawl | EU-only store |
| AzureFilm | Active | -- | Active | -- | -- | -- | woocommerce | EU-only store |
| Geeetech | Active | -- | Active | -- | -- | -- | firecrawl | No |
| 3D Fuel | Active | -- | -- | -- | -- | -- | shopify | US-only |
| Atomic Filament | Active | -- | -- | -- | -- | -- | shopify | US-only |
| Duramic 3D | Active | -- | -- | -- | -- | -- | shopify | US-only |
| Gizmo Dorks | Active | -- | -- | -- | -- | -- | bigcommerce | US-only |
| IC3D | Active | -- | -- | -- | -- | -- | firecrawl | US-only |

### Printer Brands

| Brand | US | CA | EU | UK | AU | JP | Sync Config? | Gap? |
|-------|----|----|----|----|----|----|--------------|------|
| Bambu Lab (8) | 8 URLs | 7 URLs | 7 URLs | 7 URLs | 7 URLs | -- | Yes | No |
| Elegoo (7) | 7 URLs | 7 URLs | 7 URLs | 7 URLs | 7 URLs | -- | Yes | No |
| QIDI Tech (7) | 7 URLs | 1 URL | 1 URL | 1 URL | 1 URL | -- | Yes | **YES** |
| Creality (17) | 17 URLs | **0 URLs** | **0 URLs** | **0 URLs** | **0 URLs** | -- | Yes | **YES** |
| Anycubic (9) | 9 URLs | 2 URLs | 2 URLs | 2 URLs | **0** | -- | Yes | **YES** |
| FlashForge (7) | 4 URLs | **0 URLs** | **0 URLs** | **0 URLs** | **0 URLs** | -- | Partial | **YES** |
| FLSUN (8) | 6 URLs | 7 URLs | 6 URLs | 2 URLs | 5 URLs | -- | No | **YES** |
| Prusa Research (7) | 7 URLs | **0 URLs** | **0 URLs** | **0 URLs** | **0 URLs** | -- | Yes | **YES** |
| Sovol (6) | 6 URLs | 0 URLs | 5 URLs | 0 URLs | 0 URLs | -- | Yes | Partial |
| AnkerMake (2) | 2 URLs | 0 | 0 | 0 | 0 | -- | **No** | **YES** |
| Raise3D (4) | 4 URLs | 0 | 0 | 0 | 0 | -- | Yes | Partial |
| Snapmaker (2) | 2 URLs | 0 | 0 | 0 | 0 | -- | **No** | TBD |
| UltiMaker (5) | 5 URLs | 0 | 0 | 0 | 0 | -- | Yes | US-only |
| RatRig (1) | 1 URL | 0 | 0 | 0 | 0 | -- | Yes | EU-only |
| Voron Design (3) | 3 URLs | 0 | 0 | 0 | 0 | -- | No | Kit-based |

---

## 2. Verified Regional Store Discovery

### FlashForge -- 4 NEW Regions Confirmed (Shopify)
- **CA**: `ca.flashforge.com/products.json` -- returns valid Shopify JSON (CAD prices)
- **EU**: `eu.flashforge.com/products.json` -- returns valid Shopify JSON (EUR prices)
- **UK**: `uk.flashforge.com/products.json` -- returns valid Shopify JSON (GBP prices)
- **AU**: `au.flashforge.com/products.json` -- returns valid Shopify JSON (AUD prices)
- JP: `jp.flashforge.com` -- DNS failure, does not exist
- **Implementation**: Low complexity. Add CA/UK/AU to BRAND_REGIONAL_DOMAINS maps. Populate printer regional URLs.

### Polymaker -- 1 NEW Region Confirmed
- **CA**: `ca.polymaker.com/products.json` -- returns valid Shopify JSON (CAD prices)
- UK: `uk.polymaker.com` -- DNS failure (fetch fails)
- AU: `au.polymaker.com` -- DNS failure (fetch fails)
- **Implementation**: Low complexity. Add CA to both BRAND_REGIONAL_DOMAINS maps. Remove UK/AU from `sync-regional-prices` map (currently listed but dead).

### AnkerMake/EufyMake -- MIGRATION Issue
- `ankermake.com` now **redirects to eufymake.com**
- `eufymake.com/products.json` returns **404** -- NOT Shopify
- EufyMake is a custom Anker platform (not scrapeable via Shopify JSON)
- Current DB URLs (`ankermake.com/products/m5`, `ankermake.com/m5c`) are **stale redirects**
- **Implementation**: High complexity. Need custom scraper or manual_only designation. URLs must be updated to eufymake.com equivalents.

### Anycubic -- AU/JP Do Not Exist
- `store.anycubic.com` (US) -- Shopify confirmed
- `ca.anycubic.com` (CA) -- Shopify confirmed  
- `eu.anycubic.com` (EU) -- already configured
- `uk.anycubic.com` (UK) -- already configured
- `au.anycubic.com` -- **DNS failure**, does not exist
- `jp.anycubic.com` -- **DNS failure**, does not exist
- **Note**: The `sync-regional-prices` map lists `au.store.anycubic.com` -- this is wrong. The brand_sync_config correctly has AU as nil.

### Creality -- Stores Exist but Use Custom Storefront
- `store.creality.com/ca`, `/eu`, `/uk`, `/au` -- all confirmed active (path-based routing)
- `/products.json` returns 404 on all regional paths (custom Shopify storefront blocks JSON API)
- Brand sync config already has correct URL templates
- **Gap**: 17 printers have zero regional URLs populated despite config existing
- **Implementation**: Medium complexity. Need to generate regional URLs from US URLs by inserting region prefix.

### Prusa Research -- Geo-Pricing on Single Domain
- `prusa3d.com` serves all regions from one domain with IP-based currency switching
- Brand sync config already has Firecrawl with location headers configured
- **Gap**: 7 printers have zero regional URLs -- but they all use the same base URL
- **Implementation**: Low complexity. Copy `product_url` to regional columns (same URL, different price via Firecrawl location).

### Snapmaker -- Not Shopify
- `snapmaker.com/products.json` returns **404** -- custom platform
- **Implementation**: Would need custom scraper. Skip for now (only 2 printers).

---

## 3. BRAND_REGIONAL_DOMAINS Map Discrepancies

The two edge functions have **inconsistent** regional domain maps:

| Brand | `sync-regional-prices` | `sync-brand-products` | Fix Needed |
|-------|----------------------|---------------------|------------|
| Polymaker | US, CA, UK, EU, AU | US, EU only | Remove dead UK/AU from regional; Add CA to brand-products |
| Anycubic | Wrong AU domain (`au.store.anycubic.com`) | Correct (`au.anycubic.com`) | Fix regional to match (but AU is dead anyway -- remove) |
| Sunlu | Has CA, UK, AU | Missing CA, UK, AU | Add to brand-products |
| Eryone | Has CA, UK, EU, AU | Only US, EU | Add CA, UK, AU to brand-products |
| Kingroon | Has CA, UK, EU, AU | Only US, EU | Add CA, UK, AU to brand-products |
| FlashForge | US, EU | US, EU | Both need CA, UK, AU added |
| FLSUN | Has full 5-region | Only US, EU | Add CA, UK, AU to brand-products |
| Creality | Wrong domains (`ca.store.creality.com`) | Wrong (`ca.store.creality.com`) | Should be `store.creality.com/ca` path-based |
| Sovol | US, EU | US only | Add EU to brand-products |

---

## 4. Implementation Plan

### Phase 1: Fix Data Inconsistencies (Database Only)

**A. FlashForge -- Add 4 Regions**
- Insert `brand_regional_stores` rows for CA, UK, AU (EU already exists)
- Update `brand_sync_config` with `store_url_ca`, `store_url_uk`, `store_url_au`
- Update `automated_brands.supported_regions` to `[US, CA, EU, UK, AU]`
- Generate printer regional URLs from US handles (same handles across all FlashForge stores)

**B. Polymaker -- Add CA Region**
- Insert `brand_regional_stores` row for CA
- Update `brand_sync_config` with `store_url_ca`
- Update `automated_brands.supported_regions` to include CA
- Remove dead UK/AU entries from `brand_regional_stores` if they exist

**C. Creality Printers -- Populate Regional URLs**
- For each of 17 active printers: derive CA/EU/UK/AU URLs from US URL by inserting region path prefix
- Example: `store.creality.com/products/k1-3d-printer` becomes `store.creality.com/ca/products/k1-3d-printer`

**D. Anycubic Printers -- Populate Missing Regional URLs**  
- For 7 printers missing CA/EU/UK URLs: derive from US handle using regional subdomain pattern
- Example: `store.anycubic.com/products/kobra-3` becomes `ca.anycubic.com/products/kobra-3`
- Remove AU from maps (confirmed dead)

**E. QIDI Tech Printers -- Populate Regional URLs**
- 6 of 7 printers missing CA/EU/UK/AU URLs despite stores being active
- Derive from US handle pattern

**F. Prusa Research Printers -- Set Regional URLs**
- Copy `product_url` to all regional URL columns (same domain, geo-pricing handles currency)

**G. AnkerMake -- Update to EufyMake**
- Update product_url for M5 and M5C to eufymake.com equivalents
- Mark as `manual_only` sync until custom scraper is built
- Create `brand_sync_config` entry with `store_platform = 'custom'`

### Phase 2: Sync Engine Updates (Edge Functions)

**A. Unify BRAND_REGIONAL_DOMAINS maps**
- Update `sync-brand-products/index.ts` to match the more complete map in `sync-regional-prices/index.ts`
- Add FlashForge CA, UK, AU to both maps
- Add Polymaker CA to both maps
- Fix Anycubic AU (remove from both -- dead domain)
- Fix Creality domains (path-based, not subdomain-based)
- Remove Polymaker UK/AU (dead DNS)

**B. Add FlashForge brand_sync_config**
- Create or update config with all 5 regional store URL templates
- Platform: `shopify`, extraction: `shopify_json`

**C. Add AnkerMake/EufyMake brand_sync_config**
- Platform: `custom`, extraction: `manual_only`
- Sync notes documenting the migration from ankermake.com

**D. Add FLSUN brand_sync_config**
- Platform: `shopify`, extraction: `shopify_json`
- 5 regions: US, CA, EU, UK, AU

### Phase 3: Verification

- Dry-run `sync-regional-prices` for FlashForge with regions CA, UK, AU
- Dry-run `sync-printer-prices` for Creality, Anycubic, QIDI to verify regional URL resolution
- Verify Polymaker CA prices populate correctly
- Confirm AnkerMake URLs resolve to eufymake.com product pages

---

## Technical Details

### Files to Modify
1. `supabase/functions/sync-regional-prices/index.ts` -- Fix BRAND_REGIONAL_DOMAINS (remove dead Polymaker UK/AU, remove dead Anycubic AU, add FlashForge CA/UK/AU, add Polymaker CA)
2. `supabase/functions/sync-brand-products/index.ts` -- Sync BRAND_REGIONAL_DOMAINS to match (add Sunlu CA/UK/AU, Eryone CA/UK/AU, Kingroon CA/UK/AU, FlashForge CA/UK/AU, FLSUN full set, Polymaker CA, Sovol EU)

### Database Changes (via insert tool)
- `brand_regional_stores`: INSERT rows for FlashForge CA/UK/AU, Polymaker CA
- `brand_sync_config`: UPDATE FlashForge, INSERT FLSUN, INSERT AnkerMake
- `automated_brands`: UPDATE supported_regions for FlashForge, Polymaker
- `printers`: UPDATE regional URL columns for ~50 printers across Creality (17), Anycubic (7), QIDI (6), Prusa (7), FlashForge (7), AnkerMake (2)

### Brands Confirmed as Correctly Configured (No Action)
- Bambu Lab, Elegoo, eSun, Eryone, Sunlu, Kingroon, Sovol, QIDI (filament side), Jayo, Raise3D, RatRig, UltiMaker, Voron Design

### Brands Confirmed as Single-Store (Skip)
- 3D Fuel, 3DHOJOR, Atomic Filament, Duramic 3D, Gizmo Dorks, IC3D, Hatchbox, Proto-Pasta, Fusion Filaments, VoxelPLA, NuMakers, Recreus, YOUSU, ZIRO, Paramount 3D, Push Plastic, Matter3D, NinjaTek

