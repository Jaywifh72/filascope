

# Client-Side TD Value Matching Engine

## Overview

Replace the "Run Discovery" button's edge function call with a client-side matching engine that reads `td_reference_values`, matches them against `filaments`, and writes `transmission_distance` values directly from the admin panel.

---

## New File: `src/hooks/useTdMatching.ts`

Core matching hook with the following exports:

- `runMatching({ dryRun, brandFilter })` -- executes the match algorithm
- `applyMatches(matches)` -- writes selected matches to the database
- `matches`, `isRunning`, `progress`, `stats`, `unmatchedRefs`

**Matching Algorithm:**

1. Fetch all rows from `td_reference_values` (optionally filtered by brand)
2. For each reference row, query filaments where:
   - `vendor ILIKE '%{brand_name}%'`
   - `product_title ILIKE '%{material_type}%'` (for product-line refs like "PLA Basic", "PolyTerra PLA")
   - For simple single-word materials (e.g. just "PLA"), also fall back to `material = ref.material_type`
   - Color matching: `color_family ILIKE ref.color_name` (case-insensitive exact match first)
   - For multi-word ref colors like "Army Dark Green": check if `color_family` matches exactly; don't partial-match just "Green"
3. Confidence scoring:
   - **High**: Exact vendor match + product_title contains ref material + exact color_family match
   - **Medium**: Vendor match + only base material matches (not in product_title) + color match
   - **Low**: Fuzzy/partial matches
4. Only match filaments where `transmission_distance IS NULL` (unless force_refresh)
5. Report progress: "Processing ref 12/76..."
6. Track unmatched reference values for display

**Write-back (`applyMatches`):**

For each match, batch in groups of 10:
```text
UPDATE filaments SET transmission_distance = tdValue WHERE id = filamentId
INSERT INTO td_population_log (filament_id, td_value, previous_value, source, confidence, status, notes)
```

After completion, invalidate `td-stats`, `td-filaments`, `td-population-log` query caches.

---

## New File: `src/components/admin/td-management/TdMatchResultsPanel.tsx`

Results panel shown after matching completes:

- Summary bar: "Found X matches across Y brands"
- Sortable table: Vendor, Product Title, Color, TD Value, Confidence (color-coded badge), Match Reason
- Checkbox per row for selective application
- "Apply All" and "Apply Selected" buttons
- Unmatched references section at the bottom showing refs that didn't find any filaments
- Progress indicator during application

---

## Modified File: `src/components/admin/td-management/TdActionToolbar.tsx`

Changes:

- Import and use `useTdMatching` instead of `useRunTdDiscovery`
- "Run Discovery" button calls `runMatching({ dryRun, brandFilter: brand })` 
- Default `dryRun` to `true` (safer default)
- When matching completes, show `TdMatchResultsPanel` in a Dialog
- Keep CSV import and Export Missing unchanged

---

## Files Summary

| Action | File |
|--------|------|
| CREATE | `src/hooks/useTdMatching.ts` |
| CREATE | `src/components/admin/td-management/TdMatchResultsPanel.tsx` |
| MODIFY | `src/components/admin/td-management/TdActionToolbar.tsx` |

No database schema changes needed. No edge function changes. No modifications to filament display components.

