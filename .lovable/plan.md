

# Enhanced Reference Values Tab

## Problem
The Reference Values tab is a basic flat table with no match status indicators, no search/filter, no inline editing, no bulk actions, and no gap analysis. Admins can't tell which references are actually matching filaments.

## Solution: Server-Side Match Stats + Rich UI

### Step 1: Database RPC Function

Create `get_td_reference_match_stats()` that returns match counts for each reference value by joining `td_reference_values` with `filaments`:

```text
For each reference:
  - matched_count: filaments WHERE vendor ILIKE brand_name 
                    AND transmission_distance = td_value 
                    AND (color_family ILIKE color_name OR product_title ILIKE '%' || color_name || '%')
  - brand_total: total filaments for that vendor + material
  - brand_with_td: filaments with any TD for that vendor + material
```

Returns JSON array with ref ID, matched_count, brand_total, brand_with_td. Single query, no N+1 problem.

Also create a gap analysis query that identifies:
- Brands in references with zero matches
- Duplicate (brand, color, material) entries with different TD values

### Step 2: New Hooks in `useTdManagement.ts`

- `useReferenceMatchStats()` -- calls the RPC, returns a Map keyed by ref ID
- `useUpdateReferenceValue()` -- mutation for inline edits (`.update()` on `td_reference_values`)
- `useBulkDeleteReferences()` -- deletes multiple IDs
- `useBulkUpdateConfidence()` -- updates confidence for multiple IDs

### Step 3: Rewrite `TdReferenceTable.tsx`

Major UI rebuild with these sections:

**Header bar**: Count label + Search input + Filter dropdowns (Source, Confidence, Match Status) + Add Reference button

**Table columns**: Checkbox | Brand | Color | Material | TD | Source | Confidence | Match Status | Coverage | Actions (edit/delete)

**Features**:
- **Search**: Real-time filter by brand, color, or material
- **Sortable columns**: Click header to toggle ASC/DESC sort
- **Inline editing**: Click TD value/confidence/source cells to edit in-place, save on blur/Enter
- **Bulk actions**: Floating bar when checkboxes selected -- "Delete Selected", "Set Confidence", "Re-run Matching"
- **Match Status badge**: Green "Matched (N)" / Amber "Partial (N)" / Red "No Match" computed from RPC stats
- **Coverage column**: "12/47" format showing brand+material TD coverage
- **Pagination**: 50 rows per page default, with page size selector

**Gap Analysis panel** (collapsible, below table):
- Brands with references but no matches (naming mismatches)
- Duplicate references (same brand+color+material, different TD)
- Stale references (not updated in 30+ days)

**Improved Add Reference dialog**:
- Brand field with autocomplete from filament vendors
- Hex code input with color preview swatch
- Expanded source options including `3dfilamentprofiles_community`, `manufacturer_official`
- TD range expanded to 0.1-100

## Files

| Action | File | Description |
|--------|------|-------------|
| CREATE | Database migration | `get_td_reference_match_stats()` RPC |
| MODIFY | `src/hooks/useTdManagement.ts` | Add match stats hook, update mutation, bulk operations |
| REWRITE | `src/components/admin/td-management/TdReferenceTable.tsx` | Full rebuild with all enhancements |

## Technical Notes

- The RPC uses a single aggregate query joining `td_reference_values` with `filaments`, avoiding per-row queries
- Match status is cached via React Query key `['td-reference-match-stats']`, invalidated alongside `['td-reference-values']`
- Inline edit saves use optimistic updates for responsiveness
- Gap analysis (duplicates, stale) is computed client-side from the reference data since it's only ~234 rows
- Brand autocomplete fetches distinct vendors from filaments table (separate small query)

