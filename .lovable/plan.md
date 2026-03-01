

# Scrape TD Values from 3DFilamentProfiles.com

## Overview

Create a backend function `scrape-td-values` that uses the existing Firecrawl connector to fetch filament pages from 3DFilamentProfiles.com, parse TD values from the rendered markdown tables, and upsert them into `td_reference_values`. Add a "Fetch External TD" button to the admin toolbar.

## Why Firecrawl

3DFilamentProfiles.com is a client-rendered Next.js app (no public API -- confirmed 404 on `/api/filaments`). The existing Firecrawl connector already handles JavaScript rendering and returns clean markdown tables that are straightforward to parse. Each brand page shows 50 rows per page with pagination ("Page X of Y").

## Architecture

```text
Admin UI  -->  supabase.functions.invoke('scrape-td-values', { brand })
                    |
                    v
              Edge Function
                    |
                    +--> Firecrawl scrape (markdown format) per page
                    |       rate limited: 2s between requests
                    |
                    +--> Parse markdown table rows
                    |       extract: brand, material, type, color, hex, td_value
                    |
                    +--> Upsert to td_reference_values
                            ON CONFLICT skip if confidence = 'high'
```

## New File: `supabase/functions/scrape-td-values/index.ts`

**Inputs** (JSON body):
- `brand`: single brand name (e.g., "Polymaker") -- required
- `allBrands`: boolean -- if true, iterate through all brands in the slug map

**Brand Slug Map**: 31 brands mapped to their 3DFilamentProfiles URL slugs (Polymaker -> "polymaker", "Bambu Lab" -> "bambu-lab", etc.)

**Processing per brand**:
1. Fetch page 1 via Firecrawl: `https://3dfilamentprofiles.com/filaments/{slug}` with `formats: ['markdown']`
2. Parse the "Page X of Y" text to determine total pages
3. Parse the markdown table -- each row has: Brand, Material, Type, Color, RGB Hex, TD, Website/Price, Deal
4. Extract only rows where TD column contains a numeric value (not empty, not just a link with no number)
5. For pages 2+, fetch with `?page=N` parameter, with 2-second delay between requests
6. Construct `material_type` by combining Material + Type columns (e.g., Material="PLA", Type="Basic" -> "PLA Basic"; Material="PLA", Type="PolyTerra" -> "PolyTerra PLA")
7. Upsert each entry into `td_reference_values` using the existing unique index

**Upsert logic** (same pattern as existing bulk inserts):
```text
INSERT INTO td_reference_values (brand_name, color_name, material_type, td_value, color_hex, source, confidence)
VALUES (...)
ON CONFLICT (lower(brand_name), lower(material_type), lower(color_name))
DO UPDATE SET td_value = EXCLUDED.td_value, color_hex = EXCLUDED.color_hex, updated_at = NOW()
WHERE td_reference_values.confidence != 'high';
```

**Response**: JSON with per-brand summary:
```text
{
  success: true,
  results: [
    { brand: "Polymaker", pages: 4, totalRows: 187, withTd: 52, inserted: 38, updated: 6, skipped: 8, errors: 0 }
  ]
}
```

**Error handling**:
- 404 on brand slug: log and skip, continue to next brand
- Firecrawl failure: retry once after 5 seconds
- Unparseable TD value: skip row, increment error count
- Time guard: 120-second internal limit; if approaching, save partial results and return

**Markdown parsing strategy** (based on actual page output observed):
- Table rows follow the pattern: `| [Brand](url) | [Material](url) | [Type](url) | [Color](url) | #HEX... | [TD_VALUE](url) or empty | ... |`
- TD values appear as `[0.3](url)` or `[100](url)` when present; empty cell means no TD
- Parse with regex: split on `|`, extract link text from markdown link syntax `[text](url)`

## Modified File: `src/components/admin/td-management/TdActionToolbar.tsx`

Add a "Fetch External TD" button (Cloud/Download icon) next to the existing buttons:

- On click: call `supabase.functions.invoke('scrape-td-values', { body: { brand: selectedBrand, allBrands: brand === 'all' } })`
- Show loading state with spinner: "Fetching {brand}..."
- On success: show toast with summary counts
- On error: show error toast
- After completion: invalidate `td-stats` and `td-population-log` queries
- Uses the existing brand dropdown to filter which brand to scrape

## Config Addition

Add to `supabase/config.toml`:
```text
[functions.scrape-td-values]
verify_jwt = false
```

## Files Summary

| Action | File |
|--------|------|
| CREATE | `supabase/functions/scrape-td-values/index.ts` |
| MODIFY | `src/components/admin/td-management/TdActionToolbar.tsx` |

No database schema changes. No new tables. Uses existing Firecrawl connector (already configured). Uses existing `td_reference_values` table and unique index.

