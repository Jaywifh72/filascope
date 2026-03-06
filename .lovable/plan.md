

## Plan: Create `sync-brand-catalog` Edge Function

This is a large Edge Function (~600-800 lines) that performs full catalog sync for Shopify brands. It reuses most logic from `extract-filament-data` but adds filament filtering, price diffing, and a dedicated storage schema.

### 1. Database Migration — Two New Tables

**`brand_sync_jobs`** — stores catalog sync job metadata:
- `id` (uuid, PK), `brand_id` (uuid, FK→automated_brands), `brand_slug` (text), `status` (text: pending/running/completed/failed), `started_at` / `completed_at` (timestamptz), `duration_seconds` (numeric)
- `catalog_stats` (jsonb) — total_store_products, filament_products, skipped with reasons
- `sync_results_summary` (jsonb) — new_count, changed_count, matched_count, error_count
- `warnings` (text[])
- `triggered_by` (uuid, nullable)

**`brand_sync_items`** — stores per-filament results:
- `id` (uuid, PK), `job_id` (uuid, FK→brand_sync_jobs), `status` (text: new/price_changed/matched/error)
- `extracted_data` (jsonb), `display_name`, `color_name`, `material_type`, `image_url`
- `prices` (jsonb — {usd, eur, gbp, cad, aud})
- `variant_sku` (text), `is_new` (boolean), `existing_filament_id` (uuid, nullable, FK→filaments)
- `price_diff` (jsonb, nullable — {field, old, new} for changed prices)
- `error_message` (text, nullable)
- `created_at` (timestamptz)

RLS: Admin-only read/write using `has_role(auth.uid(), 'admin')`.

### 2. Shared Module: `_shared/filament-utils.ts`

Extract from `extract-filament-data/index.ts` into a shared file:
- `COLOR_HEX_MAP`, `COLOR_FAMILY_MAP`
- `guessColorHex()`, `guessColorFamily()`, `guessFinishType()`
- `stripMaterialPrefix()`, `parseSpecsFromHtml()`
- `detectOptionPositions()` + keyword arrays
- `ExtractedFilament` interface, `ScrapingConfig` interface

Both `extract-filament-data` and `sync-brand-catalog` will import from this shared module. Update `extract-filament-data` imports accordingly.

### 3. Edge Function: `sync-brand-catalog/index.ts`

**Auth**: Same admin JWT / service-role pattern as `extract-filament-data`.

**Step-by-step flow** (all within one Deno.serve handler):

1. **Parse input** — `{ brand_id, config_id }`
2. **Load config** — Query `brand_scraping_configs` by `config_id`, query `automated_brands` by `brand_id`
3. **Create job** — Insert into `brand_sync_jobs` with status `running`
4. **Fetch catalog** — Paginate Shopify `/products.json?limit=250&page=N` with 100ms delays and 429 backoff (max 10 pages = 2500 products)
5. **Filter filaments** — Classify each product as filament/non-filament using title keywords (PLA, PETG, ABS, etc.) and option names. Exclude dryer/printer/resin/accessories. Skip clearance/region-only bundles. Track skip reasons.
6. **Extract per product** — For each filament product:
   - Detect option positions (region/material/color) using shared `detectOptionPositions()`
   - Group variants by color
   - For each color group: extract material, color name/hex/family, display_name, regional prices, regional URLs, images, specs from body_html, SKU, finish type
   - Uses all shared utility functions
7. **Diff against DB** — For each extracted filament:
   - Primary match: `brand_id` + `variant_sku`
   - Secondary match: `brand_id` + `material` (ILIKE) + color name similarity
   - If matched: compare prices → categorize as `matched` or `price_changed`
   - If not matched: categorize as `new`
8. **Store results** — Insert items into `brand_sync_items`, update `brand_sync_jobs` with summary
9. **Return response** — JSON with catalog_stats, sync_results, counts, warnings

**Resilience**: Try/catch per product, 120s time guard, rate limit handling.

### 4. Config Registration

Add to `supabase/config.toml`:
```toml
[functions.sync-brand-catalog]
verify_jwt = false
```

### 5. Files Changed

| File | Action |
|------|--------|
| `supabase/functions/_shared/filament-utils.ts` | **Create** — shared maps, interfaces, utility functions |
| `supabase/functions/extract-filament-data/index.ts` | **Edit** — replace inline maps/functions with imports from shared module |
| `supabase/functions/sync-brand-catalog/index.ts` | **Create** — main function (~500 lines) |
| `supabase/config.toml` | **Edit** — add function entry |
| Database migration | **Create** — `brand_sync_jobs` + `brand_sync_items` tables with RLS |

### 6. Deployment

Deploy both `sync-brand-catalog` and re-deploy `extract-filament-data` (since its imports change). Test with a known brand config.

