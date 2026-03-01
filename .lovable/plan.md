

# Populate TD Values Edge Function

## Overview

Create a new edge function `populate-td-values` that discovers HueForge Transmission Distance (TD) values and writes them to `filaments.transmission_distance`. Also create a `td_reference_values` reference table to store curated/community TD data for matching.

---

## Database Changes

### New Table: `td_reference_values`

Stores curated TD values from the HueForge community and brand specs for matching against filaments.

```text
td_reference_values
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  brand_name      text NOT NULL          -- e.g. "Bambu Lab"
  material_type   text NOT NULL          -- e.g. "PLA Basic"
  color_name      text NOT NULL          -- e.g. "White"
  color_hex       text                   -- optional, for tighter matching
  td_value        numeric NOT NULL       -- the TD value (0.1-15.0)
  source          text NOT NULL          -- 'hueforge_community', 'brand_published', 'user_measured'
  confidence      text DEFAULT 'medium'  -- 'high', 'medium', 'low'
  notes           text
  created_at      timestamptz DEFAULT now()
  updated_at      timestamptz DEFAULT now()
```

**Unique constraint**: `(LOWER(brand_name), LOWER(material_type), LOWER(color_name))` to prevent duplicates.

**RLS**: Public read access (no auth needed for lookups). Admin-only write via service role key in edge function.

---

## Edge Function: `populate-td-values/index.ts`

### Parameters (POST body)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | string | `'discovery'` | `'discovery'`, `'single-brand'`, or `'dry-run'` |
| `brand_slug` | string | null | Filter to single brand (vendor ILIKE match) |
| `limit` | number | 50 | Max filaments to process per invocation |
| `force_refresh` | boolean | false | Re-check filaments that already have TD values |
| `source` | string | `'all'` | `'reference-table'`, `'page-scrape'`, or `'all'` |

### Processing Pipeline

1. **Query filaments** needing TD values (where `transmission_distance IS NULL`, filtered by common materials, ordered by vendor)

2. **Source A -- Reference Table Lookup** (highest priority):
   - For each filament, query `td_reference_values` matching on:
     - Brand: `LOWER(vendor) = LOWER(brand_name)` or fuzzy substring match
     - Color: `LOWER(product_title) ILIKE '%' || LOWER(color_name) || '%'` or `LOWER(color_family) = LOWER(color_name)`
     - Material: exact match on material type
   - If a match is found with `confidence = 'high'`, auto-apply. For `'medium'`, apply but flag in results.

3. **Source B -- Product Page Scraping** (fallback):
   - For filaments with a `product_url` and no reference table match, fetch the page via Firecrawl (using `FIRECRAWL_API_KEY` from env)
   - Search the markdown/HTML for TD patterns:
     - Regex: `/(?:TD|transmission\s*distance|transmissivity)\s*[:=]?\s*(\d+\.?\d*)\s*(?:mm)?/gi`
     - Also check for structured table rows containing "TD" or "Transmission"
   - Validate extracted value is in 0.1--15.0 range

4. **Write results**: For each match, update `filaments.transmission_distance = td_value` and set a `td_source` field if one exists (or note the source in the response).

5. **Return summary**: JSON with counts of matched, updated, skipped, errors, and a details array.

### Rate Limiting and Timeouts

- Process filaments sequentially with 500ms delay between Firecrawl calls
- Total function timeout: use `EdgeRuntime.waitUntil()` pattern for background processing (return job summary immediately after reference table matches, run page scraping in background)
- Cap Firecrawl calls at 20 per invocation to stay within API limits

### Authentication

- Require admin auth (same pattern as other sync functions: check `Authorization` header, verify `has_role('admin')`)

### Dry-Run Mode

- When `mode = 'dry-run'`, do all matching but don't write to the database. Return what would have been updated.

---

## Seed Data for `td_reference_values`

Populate with well-known TD values from the HueForge community. Initial seed of ~50-100 values covering major brands:

- **Bambu Lab**: PLA Basic (White: 4.29, Black: 0.56, Red: 2.06, etc.), PLA Matte, PETG
- **Polymaker**: PolyTerra PLA (comprehensive TD data published), PolyLite PLA
- **eSUN**: PLA+ common colors
- **Prusament**: PLA (Galaxy Black: 0.84, etc.)
- **Hatchbox**: PLA common colors

These will be inserted via the migration tool as part of the table creation.

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| DB Migration | `td_reference_values` table | Reference table for curated TD values + seed data |
| CREATE | `supabase/functions/populate-td-values/index.ts` | Main edge function |
| MODIFY | `supabase/config.toml` -- NOT directly | Function config (auto-handled) |

No frontend changes needed -- `transmission_distance` is already rendered everywhere.
