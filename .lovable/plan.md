

## Mobile Filter Experience Redesign

### Current State

The mobile filter system already has solid foundations:
- **`MobileFilamentFilterSheet.tsx`**: A bottom sheet (Radix Sheet with `side="bottom"`, 85vh) containing accordion-style sections for Printer, Materials, Brands, Reinforcements, and Spool Size. Has a sticky footer with "Clear All" + "Apply Filters (N)" buttons and an active filter count badge on the trigger.
- **`MobileActiveFilterChips.tsx`**: Horizontal scrollable row of applied filter badges with remove buttons, shown below the filter bar.
- **Finder.tsx (lines 1427-1525)**: Sticky mobile controls bar at `top-16 z-30` with the filter sheet trigger + a separate Sort dropdown side by side, followed by the active chips row.

### What Needs to Change

The existing architecture is close to the goal. Enhancements are layered on top without restructuring:

---

### 1. Enhanced Filter Trigger Button

**File: `MobileFilamentFilterSheet.tsx` (lines 165-177)**

- Add `border-cyan-500/50` ring when filters are active (already has a count badge, just needs border emphasis)
- Append current sort label next to count: "Filters (3) . Scoring" -- pass `sortBy` as a new prop
- Haptic feedback on open (`navigator.vibrate?.(10)`)

### 2. Move Sort Into the Sheet

**File: `MobileFilamentFilterSheet.tsx`**

- Add `sortBy` and `onSortChange` as new props
- Render a "Sort By" row as the FIRST section inside the sheet (above Printer), styled as a horizontal row of toggle pills: "Score", "Price (low)", "Price (high)", "A-Z"
- Remove the separate Sort `<Select>` from `Finder.tsx` mobile controls bar (lines 1473-1484)

**File: `Finder.tsx` (lines 1427-1486)**

- Remove the standalone Sort dropdown
- Pass `sortBy` and `setSortBy` into `MobileFilamentFilterSheet`
- Show sort label on the filter button

### 3. Two-Tier Filter Prioritization

**File: `MobileFilamentFilterSheet.tsx`**

Reorganize the sheet content into two tiers:

**Top Tier (always visible, no accordion collapse needed):**
- **Quick Materials**: PLA, PETG, ABS, ASA, TPU as horizontal scrollable toggle chips (extracted from `MATERIAL_BASE_OPTIONS` top 5). These are visually distinct from the accordion sections -- styled as a row of rounded pills.
- **Quick Brands**: Show user's preferred brands (from the existing `usePrinterSelection` or a new `useUserSettings` hook) as toggle chips. Fall back to the top 5 `VERIFIED_BRANDS` if no preferences set.

**Bottom Tier (under "More Filters" collapsible):**
- Printer setup, remaining materials, remaining brands, Reinforcements, Spool Size, Color, Print Specs -- all existing accordion sections, wrapped in a single "Advanced Filters" expandable container.

No filter logic changes -- the same `onMaterialChange`, `onBrandChange` callbacks are called.

### 4. Live Result Count in Footer

**File: `MobileFilamentFilterSheet.tsx`**

- Add a `resultCount` prop (passed from `Finder.tsx` as `totalCount`)
- Replace "Apply Filters (N)" button text with "Show {resultCount} results"
- Add a brief cyan flash animation class when count changes (using a `useEffect` + `prevCount` ref pattern, same as `DataInventoryControlBar`)
- "Clear all filters" stays as the left button

**File: `Finder.tsx`**

- Pass `totalCount` to `MobileFilamentFilterSheet`

### 5. Enhanced Active Filter Chips

**File: `MobileActiveFilterChips.tsx`**

- Add fade-out gradient overlays (left/right) using `::before`/`::after` pseudo-elements when content overflows
- Add chip removal animation: `transition-all duration-150` with `scale-95 opacity-0` on remove (using a local `removing` state with 150ms delay before actual removal callback)
- Add an "Edit" pill at the end of the row that re-opens the filter sheet (pass `onEdit` prop)

**File: `Finder.tsx`**

- Pass `onEdit` callback that opens the filter sheet

### 6. Printer Compatibility Quick Filter

**File: `MobileFilamentFilterSheet.tsx`**

- At the top of the sheet (above quick materials), if `selectedPrinter` is set, render a one-tap suggestion banner:
  - "Show only filaments for your {printer name}" as a tappable row
  - Clicking it applies the printer's compatible material types as filters
  - Style: `bg-primary/10 border border-primary/30 rounded-xl p-3` with printer icon
  - This is a convenience shortcut -- it calls the existing `onMaterialChange` callbacks for compatible materials

### 7. Scroll Behavior and Accordion Improvements

**File: `MobileFilamentFilterSheet.tsx`**

- The Radix Sheet already prevents body scroll when open
- Add `overscroll-behavior: contain` to the sheet content via `style` prop
- Replace instant show/hide of accordion content with CSS `grid-template-rows` transition (0fr to 1fr) for smooth expand/collapse over 200ms
- When sheet opens, if any section has active filters, auto-expand that section (set `expandedSection` to first active section in a `useEffect`)

### 8. Touch-Friendly Sizing

**File: `MobileFilamentFilterSheet.tsx`**

- All chips/pills already use `min-h-[44px]` -- verify and enforce `min-w-[44px]` on all interactive elements
- Increase gap between filter chips from `gap-2` to `gap-2.5` for better touch targeting
- Quick material chips at top: `h-11 px-4` rounded pills

### 9. CSS Additions

**File: `src/index.css`**

- Add `@keyframes filter-count-flash` for the result count cyan highlight
- Add `.mobile-filter-chip-exit` animation class for chip removal
- Add `.filter-scroll-fade` gradient mask utility for the chips row
- Wrap all in `prefers-reduced-motion: reduce` override

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/components/filters/MobileFilamentFilterSheet.tsx` | Two-tier layout, sort integration, live count footer, printer quick filter, accordion transitions, new props |
| `src/components/filters/MobileActiveFilterChips.tsx` | Fade gradients, removal animations, "Edit" link |
| `src/pages/Finder.tsx` | Remove standalone sort dropdown, pass new props (sortBy, resultCount, onEdit) |
| `src/index.css` | New animation keyframes for count flash and chip removal |

No new files needed. No filter logic, URL handling, or SEO changes. All enhancements are mobile-only (`lg:hidden` / below `md:` breakpoint).

