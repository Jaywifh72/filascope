

## Add Sort Control Bar to Deals Page

### Goal
Add a sort dropdown between the brand filter pills and the deal grid, allowing users to reorder deals by discount, price, recency, or brand name.

### Changes

#### 1. Modify `src/hooks/useDealsWithFilters.ts`
- Add `sortBy` state with type `DealSortOption` defaulting to `"discount-desc"`
- Define sort options: `discount-desc`, `price-asc`, `price-desc`, `newest`, `brand-az`
- Update the `filteredDeals` sort logic (lines 210-214) to use the selected sort option instead of hardcoded discount-descending
- Keep "local deals first" as a tiebreaker within the chosen sort
- Export `sortBy` and `setSortBy` in the return object
- Add `DealSortOption` type export

#### 2. Modify `src/pages/Deals.tsx`
- Import `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` from shadcn select component
- Destructure `sortBy` and `setSortBy` from the hook
- Replace the existing "Results Count Bar" section (lines 271-290) with a combined results + sort control bar:
  - Left side: "Showing all X deals" or "Showing X of Y deals" (existing logic)
  - Right side: "Sort By" label + Select dropdown with 5 options
  - Select styled with theme-appropriate classes
- Move this combined bar **inside** the sticky filter section (before the closing `</section>` of the sticky area at line 235), so it sticks along with the filters
- The Price Disclaimer stays outside the sticky section (unchanged)
- Remove the now-redundant standalone results count section (lines 271-290)

### Sort Options
| Value | Label | Sort Logic |
|-------|-------|------------|
| `discount-desc` | Biggest Discount | `b.discount - a.discount` (default, matches current) |
| `price-asc` | Price: Low to High | `a.variant_price - b.variant_price` |
| `price-desc` | Price: High to Low | `b.variant_price - a.variant_price` |
| `newest` | Newest First | `b.last_scraped_at - a.last_scraped_at` |
| `brand-az` | Brand A-Z | `a.vendor.localeCompare(b.vendor)` |

### Technical Notes
- The sticky section already has `id="deals-filters"` and sticky positioning -- the results bar just moves inside it
- No new files needed; only two files modified
- The Select component is already available in the project (`src/components/ui/select.tsx`)

