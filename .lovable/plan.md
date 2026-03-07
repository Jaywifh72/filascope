

## Plan: Add Spool Dimension Parsing to Brand Sync Pipeline

### Key Discovery
The `filaments` table **already has** `spool_outer_d_mm` and `spool_width_mm` columns (note: `spool_outer_d_mm`, not `spool_outer_diameter_mm`). The `brand_sync_items` table stores extracted data in a JSONB `extracted_data` column. **No migration needed.**

### Step 1: No Migration Required
Columns exist. Skip.

### Step 2: Add Spool Parsing to `parseSpecsFromHtml`
**File**: `supabase/functions/_shared/filament-utils.ts` (lines 195–271)

Add two new fields to the return type and parsing logic:

- **`spoolOuterDiameterMm`**: Regex patterns for "spool diameter", "spool OD", "outer diameter" followed by a number in mm or inches (convert inches × 25.4). Validate range 100–350mm.
- **`spoolWidthMm`**: Regex patterns for "spool width", "hub width", "spool thickness" followed by a number in mm. Validate range 30–120mm.

Add these after the existing drying time parsing block (~line 268), before the return statement.

### Step 3: Wire into `import-synced-filaments`
**File**: `supabase/functions/import-synced-filaments/index.ts` (~line 227)

Add two lines to the INSERT object:
```
spool_outer_d_mm: merged.spool_outer_d_mm,
spool_width_mm: merged.spool_width_mm,
```

### Step 4: Wire into extraction consumers
**Files**: `supabase/functions/extract-filament-data/index.ts` and `supabase/functions/sync-brand-catalog/index.ts`

Where `specs` from `parseSpecsFromHtml` is consumed, map `specs.spoolOuterDiameterMm` → `spool_outer_d_mm` and `specs.spoolWidthMm` → `spool_width_mm` in the output objects.

### Files to edit
1. `supabase/functions/_shared/filament-utils.ts` — add parsing logic
2. `supabase/functions/import-synced-filaments/index.ts` — add to INSERT
3. `supabase/functions/extract-filament-data/index.ts` — map parsed values
4. `supabase/functions/sync-brand-catalog/index.ts` — map parsed values

