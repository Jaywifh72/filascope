

## Refine Deals Page Hero, Disclaimer, and Filter Bar

### Overview
Compress the hero section from ~250px to ~140px, make the price disclaimer use sessionStorage, add deal-type quick filter chips, convert the Local Only toggle to a proper switch, and show an active filter count indicator.

### Changes

#### 1. Compress Hero Section (`src/pages/Deals.tsx`, lines 134-183)

- Reduce heading from `text-3xl md:text-5xl` to `text-2xl md:text-3xl`
- Merge the subtitle text ("Discounted filaments...") into the stats row as a single compact line
- Remove `<BrandDistribution>` component call entirely (line 181) -- redundant with brand pills below
- Reduce hero padding from `py-6 md:py-8` to `py-4 md:py-5`
- Reduce "TODAY'S DEALS" badge margin from `mb-2` to `mb-1`
- Make "Get Deal Alerts" button smaller: add `text-sm py-1.5 px-4` classes, reduce icon size
- Remove the `mt-3 mb-2` wrapper div around the CTA, use `mt-2 mb-1` instead
- Target result: heading + stats + CTA all within ~140px

#### 2. Price Disclaimer -- sessionStorage (`src/pages/Deals.tsx`, lines 60-71)

- Change `localStorage` to `sessionStorage` for the dismissed state (so it returns next visit)
- After dismissal, show a mini note in the results bar: `"Prices are approximate"` in `text-[10px] text-muted-foreground` with an info icon
- Add a `disclaimerDismissed` check in the results bar section (line 246) to conditionally render the mini note

#### 3. Deal Type Quick Filter Chips (`src/pages/Deals.tsx`, after brand pills, line 243)

- Add a new chip row below brand pills with options:
  - "All Deals" (default, no filter)
  - "50%+ Off" (sets minDiscount to 50)
  - "New This Week" (filters to deals with `last_scraped_at` within 7 days)
  - "Ongoing Sales" (no specific discount threshold, just shows ongoing)
- Style: same as brand pills -- `rounded-full text-xs px-3 py-1 border border-border/50 text-muted-foreground`, active: `bg-primary/10 border-primary text-primary`
- Add a `dealTypeFilter` state to `src/pages/Deals.tsx` (local state, not in the hook)
- For "50%+ Off": call `setMinDiscount(50)` and track selection
- For "New This Week": add filtering logic in `useDealsWithFilters.ts` or filter locally in the page

**Simpler approach**: Since "50%+ Off" maps directly to `minDiscount` and "New This Week" / "Ongoing" need new filter logic:
- Add `dealTypeFilter` state: `"all" | "50plus" | "new-this-week" | "ongoing"`
- In `useDealsWithFilters.ts`: add `newThisWeek` boolean filter and `ongoingSales` boolean filter
- Deal type chips are mutually exclusive (radio behavior)

#### 4. Local Only Toggle Switch (`src/components/deals/DealFilters.tsx`, lines 236-258)

- Replace the custom radio-circle button with the Shadcn `Switch` component
- Import `Switch` from `@/components/ui/switch`
- Label text: change from `{userRegionFlag} Local Only` to `{userRegionFlag} Local Sellers Only`
- Layout: `flex items-center gap-2` with Switch + label text
- Keep the local deal count badge when active

#### 5. Active Filter Count in Filter Bar (`src/pages/Deals.tsx`, lines 212-216)

- The `DealFilters` component already computes `activeFilterCount` internally (line 63-68). Surface it to the parent or duplicate the logic in the page.
- In the filter bar label area (line 213-216), change from static "Filter deals:" to:
  - No filters: `"Filter deals:"`
  - With filters: `"Filter deals: (N active)"` where N is the count, styled in `text-primary`
- The "Clear All" button already exists inside `DealFilters` and in the results bar. Keep the one in the results bar and ensure consistency.

### Technical Details

**Files modified**:
- `src/pages/Deals.tsx` -- hero compression, sessionStorage disclaimer, deal type chips, filter count display, mini disclaimer note
- `src/components/deals/DealFilters.tsx` -- Switch component for Local Only toggle, expose active filter count
- `src/hooks/useDealsWithFilters.ts` -- add `dealTypeFilter` state and filtering for "New This Week" and "Ongoing"

**New imports**:
- `Switch` from `@/components/ui/switch` in DealFilters
- `Info` from lucide-react in Deals.tsx (for mini disclaimer note)

**No new files or dependencies needed.**

### Summary of Visual Impact
- Hero shrinks by ~110px (heading smaller, brand list removed, tighter spacing)
- Disclaimer dismisses per-session with a tiny reminder note in results bar
- Deal type chips give instant 1-click filtering for common queries
- Local toggle uses a proper switch matching catalog page patterns
- Active filter count visible at a glance in the filter bar header

