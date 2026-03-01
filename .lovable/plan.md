
# Empty States: Remaining Gaps to Unify

## Current State

The project **already has a comprehensive empty state system** including:
- A base `EmptyState` component (`src/components/ui/empty-state.tsx`) with icon container, title, description, actions, and compact variant
- Pre-configured wrappers in `src/components/empty-states/index.tsx` (Brands, ColorFinder, BuildPlate, Hotend, SharedWishlist, PrinterQuiz)
- Rich custom empty states for major pages: `FilamentsEmptyState` (with typo detection), `PrintersEmptyState` (with fuzzy search), `DealsEmptyState` (with restrictive filter detection), `FilamentComparisonEmptyState`

**What remains**: 5 locations still use bare text or custom one-off designs instead of the unified `EmptyState` component.

---

## Changes

### 1. LearningCenter guides empty state
**File:** `src/pages/LearningCenter.tsx` (lines 597-606)

Currently: Inline `<Card>` with bare `BookOpen` icon and "No guides found matching your search." text.

Replace with `EmptyState` component using `BookOpen` icon, title "No guides found", description "Try a different search term or browse all categories.", primary action "Clear Filters" calling the existing clear logic.

### 2. Brand products tab empty state
**File:** `src/components/brands/tabs/BrandProductsTab.tsx` (lines 523-528)

Currently: Bare `<Card>` with "No products found matching your filters" text.

Replace with `EmptyState` (compact) using `SearchX` icon, title "No products match your filters", description "Try adjusting your material or category filters.", primary action "Clear Filters" (pass the existing filter-clear handler).

### 3. Glossary search empty state
**File:** `src/components/filament/education/GlossarySearchModal.tsx` (lines 91-94)

Currently: Bare `<p>` with "No terms found matching..." text.

Replace with `EmptyState` (compact) using `SearchX` icon, title with the search query interpolated, description "Try a different spelling or browse the full glossary."

### 4. CADEmptyState migration
**File:** `src/components/reference/CADEmptyState.tsx`

Currently: Fully custom one-off design with hand-styled button.

Refactor to use the base `EmptyState` component with `SearchX` icon, keeping the same title/description/action. This eliminates duplicate styling code.

### 5. Specialty NoResultsState migration
**File:** `src/components/reference/specialty/NoResultsState.tsx`

Currently: Custom design with emoji icon and hand-styled button.

Refactor to use the base `EmptyState` component with `SearchX` icon, same title/description, primary action calling `clearFilters` from context.

---

## What will NOT change

- `FilamentsEmptyState`, `PrintersEmptyState`, `DealsEmptyState`, `FilamentComparisonEmptyState` -- these are already rich and feature-complete with typo detection and smart suggestions that go beyond what the base component offers
- The base `EmptyState` component itself -- already matches the requested design spec
- The barrel file `src/components/empty-states/index.tsx` -- already has the needed wrappers
- No data fetching, routing, SEO elements, or component APIs will be modified
- Admin pages will not be touched

## Files Modified

| File | Change |
|------|--------|
| `src/pages/LearningCenter.tsx` | Replace inline empty state with `EmptyState` component |
| `src/components/brands/tabs/BrandProductsTab.tsx` | Replace bare text with compact `EmptyState` |
| `src/components/filament/education/GlossarySearchModal.tsx` | Replace bare `<p>` with compact `EmptyState` |
| `src/components/reference/CADEmptyState.tsx` | Refactor to use base `EmptyState` |
| `src/components/reference/specialty/NoResultsState.tsx` | Refactor to use base `EmptyState` |
