
# Add HueForge TD Visibility Across Product Views

## Overview
Surface the `transmission_distance` (TD) value -- FilaScope's key HueForge differentiator -- across card views, table views, detail pages, and add sort/filter capabilities. Currently only 3 products have TD data, but the infrastructure should be ready as coverage grows.

## Database Status
- Column: `transmission_distance` (numeric, nullable) on `filaments` table
- Current coverage: 3 products (all Polymaker, TD = 2.0)
- No database changes needed -- the column already exists

## Changes

### 1. FilamentCard -- TD Badge (Card View)
**File:** `src/components/FilamentCard.tsx`

- Add `transmission_distance` to the `Filament` interface (line ~53)
- In **Element 4** (the material + standout feature badges section, around line 660), add a gold/amber "TD X.X" badge when `transmission_distance` is present and non-null
- Badge styling: `bg-amber-500/15 border-amber-500/30 text-amber-400` with a `Lightbulb` icon (consistent with existing HueForge styling in `CompareActionRow.tsx`)
- This badge appears alongside the material badge and standout feature, making it a third potential badge
- Products without TD data show nothing (silent absence)

### 2. FilamentTableView -- TD Column (Table View)
**File:** `src/components/FilamentTableView.tsx`

- Add `transmission_distance` to the local `Filament` interface
- Add a "TD" column header after the "Type" column, styled in amber (`text-amber-400`) to signal its premium nature
- In each row, display `X.X` in mono font with amber coloring when available, or an em-dash when absent
- Keep the column compact (no tooltip needed in table -- users can click through for details)

### 3. SpecificationsContent -- TD in Quick Specs (Detail Page)
**File:** `src/components/filament/sections/SpecificationsContent.tsx`

- Add a "Transmission Distance (TD)" row to the specifications array, positioned near the top (after Material Type)
- Format as `X.X mm` with a HueForge-ready indicator when TD >= 2.0
- This supplements the existing TD display in the advanced Specifications tab (`SpecificationsTabContent.tsx` under "Appearance & HueForge")

### 4. Sort Option -- Sort by TD Value
**File:** `src/components/DataInventoryControlBar.tsx`

- Add `"td-desc"` to the `SortOption` type union
- Add a new sort option: `{ value: "td-desc", label: "HueForge TD" }` to the `SORT_OPTIONS` array

**File:** `src/pages/Finder.tsx`

- Add a `case "td-desc"` in the sort switch statement (~line 1463) that sorts by `transmission_distance` descending, with nulls pushed to the bottom
- This lets HueForge users quickly find filaments with known TD values

### 5. Filter -- "Has TD Data" Toggle
**File:** `src/hooks/useSessionFilters.ts`

- Add `hasTdData: boolean` to `FilamentFiltersState` (default: `false`)
- Add it to the `hasActiveFilters` check

**File:** `src/components/filters/MoreFiltersModal.tsx`

- Add a "Has HueForge TD" checkbox under a new "HueForge" section (or under "Performance & Compatibility")
- Uses the amber Lightbulb icon for the section header

**File:** `src/pages/Finder.tsx`

- Wire up the new `hasTdData` filter state
- In the client-side filtering logic, when `hasTdData` is true, exclude filaments where `transmission_distance` is null
- Add an active filter tag for "HueForge TD" when the filter is on

## Visual Design

The TD badge on cards will look like:
```text
+-------------------------------+
| [Layers] PLA   [Lightbulb] TD 2.0 |
+-------------------------------+
```

Amber/gold coloring throughout signals this as premium data -- consistent with the existing `TDValueBadge` component in the compare view.

## Technical Notes
- The Finder page already fetches `select("*")`, so `transmission_distance` is available without query changes
- The existing `TDValueBadge` component in `CompareActionRow.tsx` can be reused or its styling pattern followed for consistency
- Only ~0.04% of products currently have TD data, so the badge will be rare and distinctive -- exactly the "premium differentiator" positioning intended
- No new dependencies required
