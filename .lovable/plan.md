
## Diagnosis Summary (what is actually happening)

The recurring Sovol EU failures are not coming from the new brand constants anymore. They are coming from **legacy database URL fields + UI fallback behavior**.

On `/admin/pricing-data?type=printer`, printer sync is called via `sync-printer-prices`, and the failure text `No sync result returned for EU` is generated in the UI fallback path when an EU row exists in UI but backend did not return an EU region payload for that printer.

---

## 1) Full database audit for `eu.sovol3d.com`

I checked all public tables by scanning full row JSON text and then drilled into each hit.

### Tables with matches

1. **`printers`**
   - **Column(s):** `official_store_url_eu`
   - **Row count:** 9
   - **Sample values:**
     - `https://eu.sovol3d.com/products/sovol-sv06-best-budget-3d-printer-for-beginner`
     - `https://eu.sovol3d.com/products/sovol-sv06-ace`
     - `https://eu.sovol3d.com/products/sovol-sv08-3d-printer`
     - `https://eu.sovol3d.com/products/sovol-zero-3d-printer`
   - Important: `product_url_eu` is already null for these rows; dead URLs persist in the **official** EU column.

2. **`brand_regional_stores`**
   - **Column(s):** `base_url`, `product_url_pattern`
   - **Row count:** 1
   - **Sample row:**
     - brand: Sovol
     - region: EU
     - `base_url = https://eu.sovol3d.com`
     - `product_url_pattern = https://eu.sovol3d.com/products/{sku}`
     - `is_active = true`

3. **`brand_sync_config`**
   - **Column(s):** `sync_notes` only
   - **Row count:** 1
   - `store_url_eu` is already null (good).
   - Hit is only textual note mentioning old EU domain.

4. **`url_validation_cache`**
   - **Column(s):** `url`
   - **Row count:** 1
   - Sample: `https://eu.sovol3d.com` (status invalid/404)

### Explicitly checked and found **0** hits
- `product_regional_prices`
- `product_regional_urls`
- `product_regional_slugs`
- `printer_url_validations`
- `price_extraction_logs`

So the persistent EU failures are **not** from regional join tables/slugs; they are from legacy Sovol EU references in `printers` + `brand_regional_stores`.

---

## 2) Sync engine URL source and precedence (for this UI flow)

### Actual function used by `/admin/pricing-data` printer sync
- Frontend calls `supabase.functions.invoke('sync-printer-prices', { printer_id })`.

### In `sync-printer-prices`:
It loads **database** config (`brand_sync_config`) and uses DB columns to build regional URL attempts.

Region inclusion logic:
- Regions are synced if either:
  - brand config has regional template (`store_url_eu`, etc.), **or**
  - printer has direct regional URL (`product_url_eu`, etc.)

URL precedence per region:
1. `printers.product_url_{region}` (highest)
2. cached slug (`product_regional_slugs`) + `brand_sync_config.store_url_{region}` template
3. template + US slug fallback

It does **not** read `BRAND_REGIONAL_DOMAINS` constants here.

### Why UI still shows EU and fails:
`usePricingData` currently backfills missing `product_url_eu` from `official_store_url_eu`.  
Because `official_store_url_eu` still contains `eu.sovol3d.com`, UI creates EU store rows.  
Then sync returns no EU region payload for those printers, and UI sets:
- `No sync result returned for EU` (marked as failed in log panel).

So this is a DB+UI shaping issue, not just edge-function constants.

---

## 3) `sovol.eu` replacement investigation

### Platform check
- `https://sovol.eu/products.json?limit=5` returns valid Shopify JSON.
- `https://www.sovol.eu/products.json?limit=5` also works.
- `https://sovol.eu` is a Shopify storefront.

### Handle availability checked
- Exists on `sovol.eu`:
  - `sovol-sv06-ace`
  - `sovol-sv06-plus-ace-3d-printer`
  - `sovol-sv08-3d-printer`
  - `sovol-sv08-max-3d-printer`
  - `sovol-zero-3d-printer`
- Missing / 404 on `sovol.eu`:
  - `sovol-sv06-best-budget-3d-printer-for-beginner`
  - `sovol-sv07-klipper-direct-drive-3d-printer-print-speed-250mm-s`
  - `sovol-sv07-plus-large-klipper-3d-printer`

This confirms `sovol.eu` is real and usable, but product coverage differs from US handles.

---

## 4) SV07 duplicate audit

Current DB state (Sovol):
- `SV07` (id `139e...`)  
  - active, `sync_status = never_synced`, same dead SV07 URL
- `SV07 KLIPPER DIRECT DRIVE` (id `8f8c...`)  
  - same URL, `is_discontinued = true`, `sync_status = manual_only`
- No `product_regional_slugs` rows for either SV07 record.
- The shared URL returns 404 (`.json` endpoint) on current storefront checks.

### Canonical recommendation
- Keep **`SV07`** as canonical product identity (cleaner name and existing primary record).
- Merge duplicate metadata/history from `SV07 KLIPPER DIRECT DRIVE` into canonical.
- Mark canonical as discontinued/manual_only unless a valid new SV07 handle is discovered.
- Retire duplicate with explicit merge note (no hard delete required).

---

## Surgical implementation plan

## Phase A — Immediate stop-the-bleeding (eliminate false EU failures)
1. **Data cleanup**
   - Remove all `eu.sovol3d.com` values from:
     - `printers.official_store_url_eu` (all Sovol rows)
     - `brand_regional_stores` Sovol EU row (`is_active=false` or replace base/pattern if moving to sovol.eu)
     - `url_validation_cache` dead entry (optional cleanup)
2. **UI row generation hardening**
   - In pricing data hook, stop unconditional fallback:
     - `product_url_eu <- official_store_url_eu`
   - Only backfill official regional URLs when:
     - region is active for brand, and
     - URL domain is not on blocked/deprecated list.
   - This prevents phantom EU store rows.

## Phase B — Prevent re-creation by engine/paths
3. **Sync source-of-truth alignment**
   - Keep `brand_sync_config.store_url_eu` null for Sovol unless explicitly migrating to `sovol.eu`.
   - Ensure Sovol EU is controlled by one source only (active regional store + config template), not legacy official URL remnants.
4. **Defensive sync behavior**
   - In `sync-printer-prices`, explicitly log skipped regions with reason (`inactive_region` / `not_configured`) so UI can classify as `not_in_region`, not failure.
   - In pricing UI, when requested region is missing in backend payload and brand-region is inactive/not configured, map to `not_in_region` instead of failed.

## Phase C — Choose Sovol strategy (recommended: adopt sovol.eu)
5. **Option A (recommended): migrate EU to `sovol.eu`**
   - Update Sovol EU row in `brand_regional_stores`:
     - base URL and pattern to `https://sovol.eu`
   - Populate/verify EU handles for existing active models:
     - SV06 ACE, SV06 Plus ACE, SV08, SV08 MAX, ZERO
   - Mark missing EU products (`SV06` old handle, SV07, SV07 Plus) as `not_in_region` or discontinued/manual_only per product.
6. **Option B: US-only permanently**
   - Keep EU inactive and no EU templates.
   - Ensure no UI EU rows render for Sovol.
   - Mark products that previously expected EU as `not_in_region` state only (non-failure).

## Phase D — SV07 de-duplication without data loss
7. **Canonicalize records**
   - Canonical = `SV07`.
   - Reassign any related rows from duplicate ID to canonical ID (history/validations/inventory references).
   - Set duplicate as archived/discontinued with merge note (or soft-retire).
   - If no valid live handle is found, set canonical `sync_status=manual_only`, clear broken product URL, and preserve MSRP as historical reference.

---

## Validation checklist (must pass)

1. `/admin/pricing-data?type=printer` shows Sovol with correct store count (no phantom dead EU rows).
2. Running single/batch Sovol sync produces:
   - no `No sync result returned for EU` for unsupported regions,
   - unsupported regions appear as `Not sold in this region` (not failed).
3. Sovol EU strategy chosen:
   - If `sovol.eu` enabled: EU prices update for available handles.
   - If US-only: no EU attempts at all.
4. SV07 appears once as canonical; duplicate no longer causes split statuses.
5. End-to-end test from UI sync action to sync log panel confirms failures drop and status classification is accurate.
