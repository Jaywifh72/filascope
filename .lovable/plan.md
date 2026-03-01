

# Enhanced Filaments Tab for TD Management

## Root Cause of "All Dashes" Issue

The query and data are correct -- 111 filaments have `transmission_distance` values. The display code at line 125 properly checks `f.transmission_distance != null`. The issue is that the default sort is `vendor ASC`, and with 8,277 filaments across many vendors, the first pages happen to show filaments without TD. The fix: default sort should prioritize filaments with TD, and the TD Status filter should be more prominent.

## Database Changes

### Add `td_confidence` and `td_source` columns to `filaments`

The filaments table currently only has `transmission_distance`. Confidence and source metadata lives only in `td_population_log`. Add two columns directly to filaments so the table can display them without a join:

- `td_confidence` (text, nullable) -- "high", "medium", "low"
- `td_source` (text, nullable) -- "reference_match", "manual", "csv_import", etc.
- `td_matched_at` (timestamptz, nullable) -- when the TD was applied

Also create a trigger that auto-populates these when `transmission_distance` is updated, or backfill from the population log for existing data.

### Backfill existing data

Run a one-time UPDATE that sets `td_confidence` and `td_source` from the most recent `td_population_log` entry for each filament that has a TD value.

## Hook Changes (`useTdManagement.ts`)

### Expand `TdFilamentFilters`

Add new filter options:
- `tdStatus` expanded from `'all' | 'has-td' | 'missing-td'` to also include `'high-conf' | 'medium-conf' | 'low-conf' | 'recent-24h'`

### Update `useTdFilaments` query

- Add `td_confidence, td_source, td_matched_at` to the SELECT
- Add filter logic for confidence-based and recently-matched filters
- Accept a `pageSize` parameter instead of fixed 50
- Support multi-column sorting (vendor, then material, then color as secondary)

### Update `useUpdateTdValue`

- Accept `source` and `confidence` parameters for the quick-assign feature
- Update `td_confidence`, `td_source`, `td_matched_at` on the filaments table alongside `transmission_distance`

### Add `useTdSuggestions` hook

A lightweight hook that fetches from `td_reference_values` for a given brand+material combo to provide suggested TD values for unmatched filaments. Called lazily when a user expands a row or hovers.

### Add `useBulkUpdateTd` and `useBulkClearTd` mutations

For bulk selection actions -- set or clear TD for multiple filaments at once.

## Component Rewrite (`TdFilamentsTable.tsx`)

### Filter bar improvements
- TD Status dropdown expanded with confidence-level and "Recently Matched" options
- Page size selector (25/50/100/200)
- Display "Showing 1-50 of 8,277" text

### Table columns
| Checkbox | Vendor | Product Title | Material | Color | Swatch | TD Value | Suggested | Updated |

### TD Value cell
- When populated: cyan text with confidence dot (green/amber/gray circle)
- Tooltip on hover showing TD value, source, confidence, and match reason
- Click to open edit popover (not just an input field)
- When empty: gray dash with a small "+" button

### Quick-assign popover
When clicking "+" or an existing TD value:
- TD Value number input (0.1-100, step 0.01)
- Source dropdown: manual_entry, self_measured, community_report
- Confidence dropdown: high, medium, low
- "Find Similar" section showing matching reference values for this brand+color+material
- Save button that updates filament + logs to population log

### Suggested TD column
- Looks up `td_reference_values` for matching brand + material
- Shows suggested value in gray italic (e.g., "~2.36") with an "Apply" button
- Computed client-side by fetching reference values for the current page's brands

### Row styling
- Left border color coding: green for has-TD, amber for low-confidence TD, none for missing
- Zebra striping for readability

### Checkbox column and bulk actions
- Checkbox per row + "Select All" in header
- Floating action bar when selections exist:
  - "Set TD for Selected (N)" -- opens dialog with TD value + source + confidence
  - "Clear TD for Selected (N)" -- with confirmation dialog

### Column sorting
- Clickable headers with sort indicators
- Sort by TD Value puts nulls last
- Default multi-sort: vendor ASC, material ASC, color ASC

### Pagination
- Page size selector (25/50/100/200)
- "Showing X-Y of Z" display
- Previous/Next buttons

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | Database migration | Add td_confidence, td_source, td_matched_at columns; backfill from logs |
| MODIFY | `src/hooks/useTdManagement.ts` | Expand filters, update query SELECT, add bulk mutations, add suggestions hook |
| REWRITE | `src/components/admin/td-management/TdFilamentsTable.tsx` | Full rebuild with all enhancements |

## Technical Notes

- The backfill migration uses a correlated subquery: `UPDATE filaments SET td_confidence = (SELECT confidence FROM td_population_log WHERE filament_id = filaments.id AND status = 'applied' ORDER BY created_at DESC LIMIT 1)` and similarly for td_source
- Suggested TD values are fetched once per page load by collecting the unique vendors on the current page and querying `td_reference_values` for those brands
- The quick-assign popover uses the existing Popover component from Radix
- Bulk operations log each affected filament to `td_population_log` individually for audit trail completeness
- The TD value range is expanded from 0.1-15 to 0.1-100 to accommodate specialty filaments

