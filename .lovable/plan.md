
# Redesign the Substitute Finder Tool Page

## Overview
Transform the sparse substitute finder page into an engaging, full-featured tool with a proper hero section, enhanced search, empty state with clickable examples, filter controls, and improved results grouping.

## Changes

### 1. Update `TdSubstituteFinder.tsx` — Major Redesign

**Hero Section:**
- Enhanced subtitle explaining use cases
- Three decorative use-case pills below the subtitle: "Out of Stock", "Find Cheaper", "Match a Color"

**Search Interface:**
- Keep existing `SubstituteFilamentPicker` combobox (it already has search with color swatches, brand, and TD values) but restyle the trigger button to be larger (`h-12`) with improved placeholder text and focus ring styling

**Filter Controls (new, below search):**
- "Same color family" toggle (default on) — filters results to matching `color_family`
- "Same material" toggle (default on) — filters results to matching `material`
- TD tolerance slider (default +/-0.5, range 0.1 to 2.0) — replaces the hardcoded 0.1/0.5 thresholds
- Laid out as a horizontal flex row with labels

**Empty State (before a filament is selected):**
- Visual diagram: three connected cards showing "Your Filament -> TD Match -> Substitute" with arrow icons
- "Popular substitution searches" section with 3-4 clickable example buttons that pre-select specific filaments from the data (find real entries for Overture Black, Bambu Lab White, eSUN Pine Green by scanning the filaments array)

**Reference Card Enhancement:**
- Add "YOUR FILAMENT" label in `text-xs uppercase tracking-wider text-cyan-400` above the card
- Keep existing card layout

**Results Grouping:**
- Rename sections to use emoji prefixes and adjust thresholds based on the user's TD tolerance slider:
  - "Exact TD Match" (within tolerance * 0.2)
  - "Close Match" (within tolerance * 1.0)
  - "Similar Range" (within tolerance * 2.0)
- Add a "Save $X" badge on result cards that are cheaper than the source filament

**No Results State:**
- Friendly message with suggestions to widen tolerance or remove filters
- Link to browse all filaments in the TD range on the main database page

### 2. Update `SubstituteFilamentPicker.tsx` — Styling Only

- Increase trigger button height to `h-12`
- Update placeholder text to "Search by filament name, brand, or color..."
- Add `focus:ring-2 focus:ring-cyan-500/20` styling to the trigger

### 3. Update `SubstituteResultCard.tsx` — Add Savings Badge

- When the substitute's price is lower than the source price, show a small green badge: "Save $X.XX"
- Add `sourcePrice` prop to enable this calculation

### 4. Files Modified

| File | Change |
|------|--------|
| `src/components/hueforge/TdSubstituteFinder.tsx` | Major redesign: hero, filters, empty state, results grouping |
| `src/components/hueforge/SubstituteFilamentPicker.tsx` | Restyle trigger button (h-12, updated placeholder) |
| `src/components/hueforge/SubstituteResultCard.tsx` | Add sourcePrice prop and savings badge |

### Technical Notes

- The empty state example buttons will find filaments by scanning the `filaments` array for known brand/color combinations (e.g., vendor="Overture" + color_family="Black") and calling `onSelect` with the found filament
- TD tolerance slider uses Radix `Slider` component (already installed)
- Filter state (sameColor, sameMaterial, tdTolerance) managed as local `useState` in `TdSubstituteFinder`
- The matching logic in `useMemo` will be updated to respect the dynamic tolerance and filter toggles instead of hardcoded 0.1/0.5 thresholds
