

# Regional Store Strategy Alignment

## Overview

The CSV provides the authoritative store URL mapping for 24 brands across US, CA, UK, EU, and JP regions. This plan ensures the `brand_regional_stores` table is updated to match, and that the entire site's buy-button, affiliate, and pricing flows correctly adapt to the user's selected region.

## Current State

The site already has strong regional infrastructure:
- `brand_regional_stores` table stores per-brand, per-region store URLs
- `useUnifiedRegionalPricing` hook resolves the best store for a user's region via `brand_regional_stores`
- `useFilamentDetailPricing` aggregates prices from multiple sources (retailer listings, store pricing, unified regional, Amazon)
- `useAffiliateLink` wraps URLs with affiliate parameters
- The `RegionContext` provides the active region from the top-of-page selector

However, several brands from the CSV are **missing** from `brand_regional_stores`, and some existing entries have **incorrect URLs** that don't match the CSV.

## What Changes

### 1. Database: Update `brand_regional_stores` Table

**Correct existing entries** where URLs differ from the CSV:

| Brand | Region | Current DB URL | CSV (Correct) URL |
|-------|--------|---------------|-------------------|
| Creality | CA | `ca.store.creality.com` | `store.creality.com/ca` |
| Creality | US | `us.store.creality.com` | `store.creality.com` |
| Creality | EU | `store.creality.com/eu` | `www.creality.shop` |
| eSun | EU | `esun3dstore.com` | `esun3dstoreeu.com` |
| Anycubic | EU | `eu.anycubic.com` | `store.anycubic.com` |
| Eryone | US | `www.eryone3d.com` | `eryone3d.com` (drop www) |
| Eryone | EU | `eu.eryone3d.com` | `de.eryone3d.com` |
| Polymaker | US | varies | `us.polymaker.com` |

**Add new eSun UK** entry: `esun3dstore.uk`

**Insert entries for brands not yet in the table** (about 16 brands):
- TreeD Filaments (single global store for all regions)
- Push Plastic (US/CA only)
- Ultimaker (reseller-based, mark as `is_active: false` or add reseller URL)
- Fillamentum (EU only via `shop.fillamentum.com`)
- 3D-Fuel (US/CA/EU)
- Siraya Tech (global single store)
- Hatchbox (US/CA only)
- Proto-Pasta (global single store)
- Recreus (global single store)
- Spectrum Filaments (global single store)
- Gizmo Dorks (global single store)
- Amolen (global single store)
- Prusament (global single store via prusa3d.com)
- Duramic 3D (global single store)
- Geeetech (global single store)
- Yousu (global single store)

### 2. Update `affiliate_programs` Base URLs

Where `store_base_url` in the `affiliate_programs` table doesn't match the new CSV data, update those too (e.g., Creality CA, eSun EU). This ensures the `useAffiliateLink` hook generates correct affiliate-wrapped URLs.

### 3. Update Product URLs in `filaments` Table

For brands where the domain has changed (e.g., Creality CA from `ca.store.creality.com` to `store.creality.com/ca`), batch-update the corresponding `product_url_ca`, `product_url_eu`, etc. columns so that legacy product-level URLs also resolve correctly.

### 4. No Code Changes Required

The existing hooks and components already handle regional store resolution correctly:
- `useUnifiedRegionalPricing` fetches `brand_regional_stores` for the user's region and builds product URLs from the `base_url` + `product_url_pattern`
- `useFilamentDetailPricing` aggregates all price sources and determines the best price
- `useRegionalStores` provides the `getLocalStore()` lookup used by deal cards
- The region selector in the page header already drives `RegionContext`, which cascades to all pricing hooks

All logic is data-driven from the `brand_regional_stores` table, so fixing the data is sufficient.

## Technical Details

### SQL Operations (Data Updates Only)

```text
Phase 1: Fix existing brand_regional_stores entries
  - UPDATE base_url for ~8 mismatched entries
  - INSERT ~1 new regional entry (eSun UK)

Phase 2: Insert new brands (~16 brands x 2-5 regions each)
  - ~50-60 new rows in brand_regional_stores
  - Set appropriate currency_code per region (USD/CAD/GBP/EUR/JPY)
  - Set is_primary = true for the brand's home region
  - Set product_url_pattern based on brand's URL structure

Phase 3: Sync affiliate_programs.store_base_url
  - UPDATE any affiliate programs where the base URL changed

Phase 4: Batch-fix filaments product URLs
  - UPDATE product_url_ca, product_url_eu etc. for affected brands
  - Use REPLACE() for domain migrations
```

### Verification Steps

After data updates:
1. Switch region selector to CA, EU, UK and verify buy buttons on product pages point to correct regional stores
2. Spot-check affiliate link generation for Creality, eSun, Eryone, Polymaker
3. Confirm deal cards show correct "Buy at [Store Name]" labels per region

