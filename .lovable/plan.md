

## Add Skeleton Loading, Empty States, and End-of-List Polish to Deals Page

### Overview
Enhance the Deals page with proper skeleton loading cards, diagnostic empty states, and a polished end-of-list experience including a scroll-to-top button.

### Changes

#### 1. New File: `src/components/deals/DealCardSkeleton.tsx`
Create a skeleton component matching the compressed deal card layout:
- Rounded-xl container with border, p-3
- Image area: h-[120px] rounded-lg skeleton shimmer
- Brand row: h-3 w-24
- Product name: two lines (h-4 w-3/4, h-4 w-1/2)
- Price: h-5 w-32
- Metadata line: h-3 w-full
- Swatches: 5 circles w-5 h-5 rounded-full
- CTA: h-9 w-full rounded-lg
- Uses existing `Skeleton` component and `skeleton-animated` class with staggered delays
- Export `DealCardSkeletonGrid` showing 8 cards in the same grid layout as the real cards

#### 2. New File: `src/components/deals/DealsEmptyState.tsx`
Create a diagnostic empty state component:
- Props: `selectedMaterials`, `selectedBrands`, `minDiscount`, `showLocalOnly`, `groupedDeals` (all deals before filtering for suggestions), `clearAllFilters`, `onBrandChange`, `onMaterialChange`
- Uses `SearchX` icon (h-12 w-12)
- Dynamic diagnostic message logic:
  - If brand + material filters active: "No [Material] deals found from [Brand]. Try broadening your search."
  - If high discount filter: "No deals with [X]%+ discount. Try lowering the minimum discount."
  - If local only: "No local deals match your filters. Try including international sellers."
  - Fallback: "No deals match your current filters."
- Primary CTA: "Clear All Filters" button styled with primary variant
- Secondary: "Browse All Deals" text link that clears filters
- Quick suggestion chips: derive up to 3 material categories that DO have results from the unfiltered deal data, rendered as clickable rounded-full border chips that set that material as the only filter

#### 3. Modify: `src/pages/Deals.tsx`
- **Skeleton loading**: Replace the current simple `Card` skeleton with `DealCardSkeletonGrid` component
- **Empty state**: Replace the current inline empty states (lines 297-334) with the new `DealsEmptyState` component, passing filter state and actions. Keep the special `showLocalOnly` empty state as a variant within the new component.
- **End-of-list section** (lines 344-364):
  - Add a divider above: `border-t border-border w-full mb-8`
  - Add "Last updated" timestamp derived from the most recent `last_scraped_at` in the deals data
  - Reorder CTAs: Deal Alerts as primary, Browse Filaments as outline/secondary
  - Add note: "New deals are checked multiple times weekly" in `text-xs text-muted-foreground italic`
- **Scroll-to-top button**: Import and add the existing `ScrollToTopButton` component, configured to target the filter section (e.g., targeting a div with an id like `deals-filters`). Add `id="deals-filters"` to the sticky filter section.

#### 4. Modify: `src/components/skeletons/index.ts`
- Add exports for `DealCardSkeleton` and `DealCardSkeletonGrid`

#### 5. Modify: `src/hooks/useDealsWithFilters.ts`
- Add a `lastUpdated` computed value (most recent `last_scraped_at` from raw deals) to the return object, so the end-of-list section can display it

### Technical Details

- **Files created**: `src/components/deals/DealCardSkeleton.tsx`, `src/components/deals/DealsEmptyState.tsx`
- **Files modified**: `src/pages/Deals.tsx`, `src/components/skeletons/index.ts`, `src/hooks/useDealsWithFilters.ts`
- No database changes required
- Uses existing `Skeleton` component, `skeleton-shimmer`/`skeleton-animated` CSS classes, and `ScrollToTopButton` component
- The diagnostic empty state follows patterns from `NoResultsEmpty.tsx` and `NoResultsState.tsx`
- Grid layout for skeletons matches the deals grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`

