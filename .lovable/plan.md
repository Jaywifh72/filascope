

# Enhance Substitution Finder Results Area

## Overview
The Substitution Finder already has the core functionality (reference card, filters, grouped results, empty states). This plan upgrades the visual presentation and adds a "Compare" affordance to make the results area more compelling and useful.

## Changes

### 1. Upgrade Reference Card in `TdSubstituteFinder.tsx`
- Increase color swatch from `w-10 h-10 rounded-full` to `w-12 h-12 rounded-lg`
- Update "Your Filament" label to use `text-[10px] uppercase tracking-[0.15em] text-primary font-semibold`
- Restyle card: `bg-primary/5 border border-primary/20 rounded-xl p-4` (remove default Card hover)
- Show brand and product name on separate lines (brand in `text-sm text-muted-foreground`, name in `text-lg font-semibold`)
- Move price to the right side of the card

### 2. Switch Results to 2-Column Grid Layout in `TdSubstituteFinder.tsx`
- Change result containers from `space-y-2` to `grid grid-cols-1 md:grid-cols-2 gap-3`
- Add colored left-border accents to group headings:
  - Exact Match: `border-l-2 border-green-500 pl-3` with `text-green-400`
  - Close Match: `border-l-2 border-amber-500 pl-3` with `text-amber-400`
  - Similar Range: `border-l-2 border-muted-foreground pl-3` with `text-muted-foreground`

### 3. Enhance Result Cards in `SubstituteResultCard.tsx`
- Increase swatch from `w-8 h-8` to `w-10 h-10 rounded-lg`
- Update card style: `bg-card/60 border border-border rounded-xl p-4 hover:border-primary/30`
- Add a "Compare" button next to the existing "View Details" button that links to the filament comparison page with both source and substitute pre-selected
- Accept a new `sourceHandle` prop to build the compare URL

### 4. Improve No-Results Empty State in `TdSubstituteFinder.tsx`
- Add a `Search` icon above the text
- Make suggestions into clickable actions (e.g., button to widen TD, button to toggle off filters)
- Keep the "Browse all filaments" link

### Files Modified

| File | Change |
|------|--------|
| `src/components/hueforge/TdSubstituteFinder.tsx` | Reference card styling, 2-column grid, group heading accents, improved empty state |
| `src/components/hueforge/SubstituteResultCard.tsx` | Larger swatch, rounded-xl card, "Compare" button with source handle |

### Technical Notes
- The "Compare" link will navigate to `/filament-comparison?a={sourceHandle}&b={substituteHandle}` (or equivalent existing comparison route)
- No new components needed; changes are styling and layout within existing files
- The `sourceHandle` prop on `SubstituteResultCard` will be the source filament's `product_handle` or `id`

