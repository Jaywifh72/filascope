

# Empty States With Illustrations and Recovery Actions

## Current State

The project already has **rich, custom empty states** for major pages:
- `FilamentsEmptyState` -- full with typo detection, smart suggestions, quick categories
- `PrintersEmptyState` -- full with typo detection, similar suggestions, popular brands
- `DealsEmptyState` -- full with restrictive filter detection, quick material chips
- `FilamentComparisonEmptyState` -- full with popular comparisons, how-it-works section
- `VaultEmptyState` -- reusable with icon/title/description/actions
- `CADEmptyState`, `NoResultsState`, `NoResultsEmpty` -- reference page empty states

There is also a base `EmptyState` component at `src/components/ui/empty-state.tsx` that is close to (but not exactly matching) the requested design.

**What is missing**: Several secondary areas use bare `<div>` with plain text instead of a proper empty state component. These are the targets for improvement.

---

## Step 1: Enhance the existing base EmptyState component

**File:** `src/components/ui/empty-state.tsx`

Update the existing `EmptyState` component to match the requested design spec while keeping backward compatibility:

- Add a `compact` prop (boolean, default false). When true: icon 36x36 in 56x56 container, `text-base` title, `py-8` padding
- Upgrade icon container styling: 80x80 `rounded-2xl` with `bg-white/[0.04] border border-white/[0.08]`, icon at 48x48, `text-muted-foreground`
- Ensure primary action supports both `onClick` and `href` (already does)
- Ensure secondary action supports both `onClick` and `href` (already does)
- Keep backward compatibility for existing `AccessoriesEmptyState` and `PriceEmptyState`

The existing `size` prop will map: `sm` = compact, `md` = default, `lg` = large. No breaking changes.

---

## Step 2: Create contextual empty state wrappers

**New file:** `src/components/empty-states/index.ts` (barrel export)

Create pre-configured wrappers for areas that currently use bare text. These wrap the enhanced `EmptyState`:

### A) BrandsEmptyState

For `/brands` page (currently inline `<div>` at line 535 of `Brands.tsx`).

- Icon: `Building2`
- Title: "No brands found" (with search query if present)
- Description: "Try searching for a different name or browse all brands by clearing your filters."
- Primary: "Clear Search and Filters" (accepts `onClearFilters` prop)
- Props: `searchQuery?: string`, `onClearFilters: () => void`

### B) ColorFinderEmptyState

For `ColorFinderResults.tsx` (currently bare `<p>` at line 179).

- Icon: `Palette` (Lucide)
- Title: "No color matches found"
- Description: "Try picking a different target color or broadening your tolerance range."
- Primary: "Reset Color" (accepts `onReset` prop)

### C) BuildPlateEmptyState

For `BuildPlateList.tsx` (bare text at line 208).

- Icon: `LayoutGrid`
- Title: "No build plates match your criteria"
- Description: "Try adjusting your filters to see more options."
- Primary: "Clear Filters" (accepts `onClearFilters` prop)
- Compact variant

### D) HotendEmptyState

For `HotendList.tsx` (bare text at line 512).

- Icon: `Cylinder`
- Title: "No hotends match your criteria"
- Description: "Try adjusting your filters to see more options."
- Primary: "Clear Filters" (accepts `onClearFilters` prop)
- Compact variant

### E) SharedWishlistEmptyState

For `SharedWishlist.tsx` (bare text at line 103).

- Icon: `Heart`
- Title: "This wishlist is empty"
- Description: "Items added to this wishlist will appear here."
- Compact variant

### F) PrinterQuizEmptyState

For `PrinterQuizResults.tsx` (bare text at line 122).

- Icon: `SearchX`
- Title: "No printers matched your criteria"
- Description: "Try adjusting your preferences to see more recommendations."
- Primary: "Retake Quiz" (accepts `onRetake` prop)

---

## Step 3: Integrate empty states into pages

Replace bare-text empty states with the new contextual components:

| File | Line(s) | Current | Replacement |
|------|---------|---------|-------------|
| `src/pages/Brands.tsx` | 535-561 | Inline div with Building2 icon | `BrandsEmptyState` |
| `src/components/color-finder/ColorFinderResults.tsx` | 178-181 | Bare `<p>` text | `ColorFinderEmptyState` |
| `src/components/BuildPlateList.tsx` | 206-209 | Bare text div | `BuildPlateEmptyState` |
| `src/components/HotendList.tsx` | 510-513 | Bare text div | `HotendEmptyState` |
| `src/pages/SharedWishlist.tsx` | 101-104 | Bare text div | `SharedWishlistEmptyState` |
| `src/components/printers/PrinterQuizResults.tsx` | 121-125 | Bare text div | `PrinterQuizEmptyState` |

---

## Step 4: Ensure FilamentCategoryPage uses FilamentsEmptyState

**File:** `src/pages/FilamentCategoryPage.tsx` (line 821-824)

Currently shows bare `"No filaments found for this category."` text. Replace with the existing `FilamentsEmptyState` component (which already has all the smart features).

---

## What will NOT change

- `FilamentsEmptyState` -- already fully featured, no changes
- `PrintersEmptyState` -- already fully featured, no changes
- `DealsEmptyState` -- already fully featured, no changes
- `FilamentComparisonEmptyState` -- already fully featured, no changes
- `VaultEmptyState` -- already working, no changes
- `CADEmptyState`, `NoResultsState`, `NoResultsEmpty` -- reference pages, no changes
- No data fetching, routing, Supabase queries, or SEO elements will be modified
- Admin pages will not be touched (low priority per previous plan)

---

## Files Created/Modified

| Action | File |
|--------|------|
| MODIFY | `src/components/ui/empty-state.tsx` (enhance icon container styling, add compact prop) |
| CREATE | `src/components/empty-states/index.ts` (barrel with 6 contextual wrappers) |
| MODIFY | `src/pages/Brands.tsx` (swap inline div for BrandsEmptyState) |
| MODIFY | `src/components/color-finder/ColorFinderResults.tsx` (swap bare text) |
| MODIFY | `src/components/BuildPlateList.tsx` (swap bare text) |
| MODIFY | `src/components/HotendList.tsx` (swap bare text) |
| MODIFY | `src/pages/SharedWishlist.tsx` (swap bare text) |
| MODIFY | `src/components/printers/PrinterQuizResults.tsx` (swap bare text) |
| MODIFY | `src/pages/FilamentCategoryPage.tsx` (use FilamentsEmptyState) |

