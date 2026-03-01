

# HueForge TD Substitute Finder

## Overview
Build a "Find TD-Matched Substitute" tool as both an inline section on `/hueforge-td-database` and a standalone page at `/hueforge-filament-substitute-finder`. Users select a source filament and instantly see alternatives with matching TD values and colors from other brands.

## Architecture

```text
src/
  pages/
    HueForgeSubstituteFinder.tsx        -- Standalone full page
  components/
    hueforge/
      TdSubstituteFinder.tsx            -- Core substitute finder (shared between inline + page)
      SubstituteFilamentPicker.tsx      -- Combobox to select source filament
      SubstituteResultCard.tsx          -- Individual result card with match badge
      SubstituteComparisonStrip.tsx     -- Color swatch strip (source vs top 3)
      SubstitutePriceTable.tsx          -- Price comparison table (full page only)
```

## Data Flow
- Reuse the existing `hueforge-td-database` query (filaments with `transmission_distance IS NOT NULL`) already cached by TanStack Query
- All filtering is client-side: given a source filament, filter by TD range and color family from the already-loaded dataset
- No new database tables or migrations needed
- Use `useRegion()`/`useCurrency()` for price formatting

## Core Logic: Substitute Matching

Given a source filament with `td_value` and `color_family`:

1. **Exact TD Matches**: same color family, `|td - source_td| <= 0.1`, different vendor preferred. Sort by TD diff then price.
2. **Close Matches**: same color family, `0.1 < |td - source_td| <= 0.5`. Excludes exact matches.
3. **Same Color, Different TD**: same color family, `|td - source_td| > 0.5`. Collapsed by default.

### Match Quality Badges
- "Perfect Match" (green): same color family, TD within +/-0.05
- "Close Match" (amber): same color family, TD within +/-0.2
- "TD Match Only" (blue): different color family, TD within +/-0.1
- "Budget Alternative" (purple): 20%+ cheaper, within +/-0.3 TD, same color family

## Components

### SubstituteFilamentPicker
- Uses Shadcn `Command` (cmdk) as a popover combobox
- Searches across name, brand, color in the filaments array
- Each option: `[color swatch] [Brand] [Name] -- TD [value]`
- Also accepts a `filamentId` URL param to pre-select

### TdSubstituteFinder (core component)
- Props: `filaments: TDFilament[]`, `compact?: boolean` (inline vs full page mode)
- Contains the picker, reference card, results sections, and comparison strip
- In compact mode: simpler layout, no price table
- In full page mode: adds "Compare by Brand" toggle grouping and price comparison table

### SubstituteResultCard
- Color swatch, brand, name, TD with delta indicator (e.g., "TD 0.58 (delta +0.03)")
- Delta text color: green for +/-0.05, amber for +/-0.2, default otherwise
- Match quality badge
- Material, color family, price
- "View Details" and "Buy" links

### SubstituteComparisonStrip
- Horizontal row showing source swatch labeled "Source" alongside top 3 substitute swatches
- Helps visual color comparison at a glance

### SubstitutePriceTable (full page only)
- Compact table: Brand, Product, TD, TD Diff, Price, Price Diff, Buy link
- Sortable columns

## Standalone Page (`/hueforge-filament-substitute-finder`)
- SEO: title "HueForge Filament Substitute Finder", meta description targeting substitute/alternative keywords
- Breadcrumb: Home > HueForge TD Database > Substitute Finder
- Full-width layout with the `TdSubstituteFinder` in non-compact mode
- Additional features: "Compare by Brand" toggle, price comparison table
- Accepts `?filament=<id>` URL param for deep linking from filament detail pages

## Integration Points

### TD Database Page (`HueForgeTDDatabase.tsx`)
- Insert `TdSubstituteFinder` (compact mode) between `FilamentsNeedingTdSection` and the FAQ section (around line 819)
- Add "Find Substitutes" button in the hero section cross-links area

### Filament Detail Pages
- Add "Find similar filaments by TD" link in the TD/specs area, linking to `/hueforge-filament-substitute-finder?filament={id}`

### Routing (`App.tsx`)
- Add route: `/hueforge-filament-substitute-finder` -> `HueForgeSubstituteFinder`

### Navigation
- Add to footer TOOLS section

## Styling
- Dark theme consistent with existing pages
- Source/reference card: cyan border (`border-primary`)
- Match badges use the defined color scheme (green/amber/blue/purple)
- Responsive: cards stack on mobile, price table scrolls horizontally

## Implementation Sequence
1. Build `SubstituteFilamentPicker` (combobox with filament search)
2. Build `SubstituteResultCard` with match badges and TD delta
3. Build `SubstituteComparisonStrip`
4. Build `TdSubstituteFinder` composing all above
5. Build `SubstitutePriceTable` for full page mode
6. Create `HueForgeSubstituteFinder.tsx` standalone page with SEO
7. Integrate inline section into `HueForgeTDDatabase.tsx`
8. Add route to `App.tsx`, add links from hero section and filament detail pages

