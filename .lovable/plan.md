

# Regional Price Sync Pipeline - Implementation Plan

## Overview

This plan addresses the EU pricing issues and establishes an automated regional price synchronization system. The goal is to ensure FilaScope displays accurate native currency prices from regional stores, not USD conversions.

## Current State Analysis

### What Works
- **Database schema**: Regional price columns (`price_eur`, `price_gbp`, `price_cad`, `price_aud`, `price_jpy`) exist on the `filaments` table
- **Data exists**: Bambu Lab has 227 products with EUR prices, Creality has 122 with EUR prices
- **UI hook fixed**: `useRegionalPrice.ts` now uses `RegionContext` for proper region synchronization
- **Existing edge functions**: `sync-regional-prices` and `sync-prices` provide foundational sync logic

### Critical Issues
1. **product_regional_urls table is EMPTY** (0 rows) - no regional store URLs stored
2. **product_url_eu columns are NULL** - regional URLs not in legacy columns either
3. **No URL construction for EU routing** - system can't build regional URLs
4. **Creality URL 404s** - EU product slugs don't match US slugs
5. **Price validation needed** - no mechanism to verify scraped prices match actual store prices

## Implementation Plan

### Phase 1: Fix Immediate EUR Display Issues

**Step 1.1: Verify useRegionalPrice fix**
- The recent fix to use `RegionContext` instead of `useCurrency` should now correctly prioritize `price_eur` column
- Test that Bambu Lab products show €22.99 (actual) instead of ~€16.81 (converted)

**Step 1.2: Add regional URL generation for EU routing**
Create a utility that constructs regional URLs from base URLs using brand store configurations:
- Bambu Lab: `us.store.bambulab.com` -> `eu.store.bambulab.com`
- Creality: `store.creality.com` -> `store.creality.com/eu`
- Polymaker: `us.polymaker.com` -> `eu.polymaker.com`

---

### Phase 2: Populate Regional URLs Table

**Step 2.1: Create edge function `populate-regional-urls`**
```text
Purpose: Populate product_regional_urls table from brand store configurations

Logic:
1. For each filament with a product_url and brand_id
2. Look up brand in BRAND_REGIONAL_STORES config
3. For each supported region in brand config:
   - Transform base URL to regional URL
   - Validate URL exists (HEAD request)
   - Insert into product_regional_urls
4. Mark filament.has_regional_urls = true
```

**Step 2.2: Handle brand-specific URL patterns**
- **Bambu Lab**: Subdomain swap (`us.` -> `eu.`)
- **Creality**: Path prefix (`/products/` -> `/eu/products/`)
- **Polymaker**: Subdomain swap
- **Global brands** (eSUN, Prusa): Single URL, no transformation needed

---

### Phase 3: Build Regional Price Sync Pipeline

**Step 3.1: Enhance `sync-regional-prices` edge function**
```text
Input parameters:
- brandSlug: string (required)
- regions: string[] (e.g., ['EU', 'UK', 'CA'])
- dryRun: boolean
- limit: number
- forceRefresh: boolean

Process per region:
1. Fetch products for brand from filaments table
2. For each product:
   a. Get regional URL from product_regional_urls table
   b. If no regional URL, construct from brand config
   c. Fetch product page using Firecrawl (via get-current-price)
   d. Extract native currency price
   e. Validate price ratio vs USD (sanity check)
   f. Update filaments.price_[currency] column
   g. Log result to brand_sync_logs

Rate limiting:
- 500ms delay between requests
- 2s delay between brands
- Respect Cloudflare/bot detection
```

**Step 3.2: Create scheduling system**
```text
Daily schedule (high-priority brands):
- Bambu Lab: 6 AM UTC
- Creality: 7 AM UTC  
- Prusa Research: 8 AM UTC
- Polymaker: 9 AM UTC
- Elegoo: 10 AM UTC

Weekly schedule (other brands):
- All other brands with regional stores
- Runs Sunday 3 AM UTC

Implementation:
- Use pg_cron with net.http_post to invoke edge function
- Store schedule in automated_brands.regional_sync_cron
```

---

### Phase 4: URL Validation and Repair

**Step 4.1: Create `validate-regional-urls` edge function**
```text
Purpose: Detect broken URLs and suggest repairs

Process:
1. Query products with regional URLs
2. For each URL, send HEAD request
3. If 404:
   - Check for redirects (store valid redirect targets)
   - Try slug variations (e.g., hyper-pla -> hyper-pla-refill)
   - Mark as needs_repair in product_regional_urls
4. Log validation results

Run weekly on Saturday night
```

**Step 4.2: Handle Creality slug inconsistencies**
```text
Problem: Creality EU uses different slugs than US store

Solution:
1. Create slug mapping table (us_slug -> eu_slug)
2. When syncing Creality EU:
   - Look up EU-specific slug from mapping
   - If not found, try common transformations:
     * Remove color suffixes
     * Add/remove "3d-printing-filament" suffix
   - Store successful mappings for future use
```

---

### Phase 5: Price Anomaly Detection and Alerts

**Step 5.1: Add price validation rules**
```text
Expected price ratios (vs USD):
- EUR: 0.85 - 1.25x
- GBP: 0.70 - 1.15x
- CAD: 1.1 - 1.6x
- AUD: 1.3 - 1.9x
- JPY: 100 - 160x

If price ratio outside range:
- Flag for manual review
- Don't auto-update database
- Log to admin_activity_log
```

**Step 5.2: Detect price changes >20%**
```text
When updating price:
1. Compare new price to existing price
2. If change > 20%:
   - Log to price_history with flag
   - Create alert in admin dashboard
   - Don't block update (prices do change)
```

---

### Phase 6: Admin UI Integration

**Step 6.1: Add Regional Sync tab to Admin Dashboard**
Location: `/admin/inventory?tab=regional`

Components:
- Brand coverage matrix (brand x region)
- Sync status per brand/region
- Last sync time and success rate
- "Sync Now" button per brand or region
- Price validation alerts

**Step 6.2: Sync monitoring dashboard**
```text
Display:
- Current sync status (running, completed, failed)
- Products synced / total
- Price changes detected
- URLs validated / broken
- Error logs with retry actions
```

---

## Technical Implementation Details

### Database Changes Required
```sql
-- None required - existing schema is sufficient:
-- filaments: price_eur, price_gbp, price_cad, price_aud, price_jpy
-- product_regional_urls: already exists, needs population
-- product_regional_prices: already exists, optional future use
```

### New Edge Functions
1. `populate-regional-urls` - One-time population of regional URLs
2. Enhanced `sync-regional-prices` - Main sync pipeline
3. `validate-regional-urls` - URL health checking

### Files to Modify
1. `src/hooks/useRegionalPrice.ts` - Already fixed to use RegionContext
2. `src/hooks/useRegionalStore.ts` - Add EU URL construction logic
3. `src/lib/brandRegionalStores.ts` - Add Creality EU path pattern
4. `supabase/functions/sync-regional-prices/index.ts` - Enhance sync logic

### Cron Schedule Setup
```sql
-- Daily syncs for high-priority brands
SELECT cron.schedule(
  'sync-bambulab-regional-daily',
  '0 6 * * *',
  $$SELECT net.http_post(
    url := '{SUPABASE_URL}/functions/v1/sync-regional-prices',
    body := '{"brandSlug": "bambu-lab", "regions": ["EU", "UK", "CA", "AU"]}'::jsonb
  )$$
);

-- Weekly syncs for other brands
SELECT cron.schedule(
  'sync-regional-weekly',
  '0 3 * * 0',
  $$SELECT net.http_post(
    url := '{SUPABASE_URL}/functions/v1/sync-regional-prices',
    body := '{"brandSlug": "all", "regions": ["EU", "UK"]}'::jsonb
  )$$
);
```

---

## Testing Strategy

### Phase 1 Verification
1. Load Bambu Lab product in EU region
2. Confirm price shows €22.99 (not ~€16.81)
3. Confirm no tilde (~) prefix on actual EUR prices

### Phase 2 Verification  
1. Run `populate-regional-urls` for Bambu Lab
2. Query product_regional_urls - should have entries
3. Verify URL transformation correctness

### Phase 3 Verification
1. Trigger sync for Bambu Lab EU
2. Check price_eur values updated with fresh data
3. Verify sync logs show success

---

## Rollout Plan

1. **Week 1**: Deploy Phase 1 fix, verify EUR display works
2. **Week 2**: Deploy Phase 2, populate URLs for top 5 brands
3. **Week 3**: Deploy Phase 3 sync pipeline, run manually
4. **Week 4**: Deploy Phase 4 validation, enable cron schedules
5. **Week 5**: Deploy Phase 5-6 monitoring and alerts

---

## Success Metrics

- EUR prices show actual store values (verified for top 10 Bambu Lab products)
- Regional URL coverage: >80% for brands with regional stores
- Sync success rate: >95% for verified URLs
- Price freshness: <7 days for high-priority brands
- Zero 404 errors on "Buy Now" clicks

