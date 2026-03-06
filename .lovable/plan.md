

# Post-Import Filament Setup Edge Function

## Overview
Create a new Edge Function that runs after filament onboarding import, performing 5 setup steps: price history initialization, URL validation, TD discovery queuing, data quality scoring, and job result storage.

## Database Migration

Add `post_import_results` JSONB column to `filament_onboarding_jobs`:

```sql
ALTER TABLE public.filament_onboarding_jobs
  ADD COLUMN IF NOT EXISTS post_import_results jsonb;
```

## Edge Function: `supabase/functions/post-import-filament-setup/index.ts`

**Auth**: Admin JWT validation using the same pattern as `extract-filament-data` (service role client for DB ops).

**5 Steps** (each wrapped in try/catch, failures don't block subsequent steps):

### Step 1 — Initialize Price History
- Query `filaments` for each ID, selecting `variant_price`, `price_cad`, `price_eur`, `price_gbp`, `price_aud`
- For each non-null price, insert into `price_history` matching the existing format:
  ```typescript
  { filament_id, price, region: "US"|"CA"|"EU"|"UK"|"AU", source: "onboarding_import" }
  ```

### Step 2 — Validate Product URLs
- Collect non-null URLs from each filament: `product_url`, `product_url_ca`, `product_url_eu`, `product_url_uk`, `product_url_au`
- HEAD request with 5s timeout, `User-Agent: FilaScope-LinkCheck/1.0`
- Record broken URLs as warnings
- Store results in job metadata (no new column on filaments — use job's `post_import_results`)

### Step 3 — Queue TD Discovery
- Query `td_reference_values` for matching `brand_name` (via the brand's name from `automated_brands`)
- If references exist: insert into `td_population_log` with `status: 'pending'`, `source: 'onboarding_auto'`
- If none: note "TD data not available for this brand"

### Step 4 — Calculate Data Quality Score
- For each filament, check: `display_name`, `color_family`, `color_hex` (not `#808080`), `material`, any price, any regional URL, `featured_image`, nozzle temps, bed temps
- Compute completeness percentage (filled / total fields)
- Collect warnings for missing critical fields

### Step 5 — Update Job Record
- Update `filament_onboarding_jobs.post_import_results` with aggregated results

## Config
Add to `supabase/config.toml`:
```toml
[functions.post-import-filament-setup]
verify_jwt = false
```

## File Changes

| File | Change |
|------|--------|
| `supabase/functions/post-import-filament-setup/index.ts` | New Edge Function |
| `supabase/config.toml` | Register function |
| Migration | Add `post_import_results` column to `filament_onboarding_jobs` |

