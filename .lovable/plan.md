

## Table View Improvements for Power Users

### Context

The FilamentTableView component renders a 12-column table for filament data. Key findings:
- TD data exists in the database but only 3 of 8,069 filaments have values -- the "---" display is correct behavior, not a query bug
- `transmission_distance` is already in the select query and interface
- Sorting is managed at the Finder page level, not passed into the table component
- There's a route inconsistency: row click navigates to `/filaments/{id}` (line 149) but the Details link goes to `/filament/{id}` (line 311) -- needs fixing
- The table has `sticky top-0` on thead already, but it may not work correctly due to the `overflow-x-auto` wrapper

### Changes

**File: `src/components/FilamentTableView.tsx`**

**1. Fix overflow + sticky header conflict**

The `overflow-x-auto` on the wrapper div breaks `sticky` positioning. Restructure: move the sticky behavior to use `position: sticky` on `th` elements directly, and ensure the scrollable container has a defined max-height or that the parent scroll context is correct. Add a right-edge fade shadow indicator using a CSS pseudo-element or gradient overlay on the wrapper when content overflows.

Add to wrapper div:
```
className="relative overflow-x-auto rounded-lg border border-border/50
  [mask-image:linear-gradient(to_right,black_calc(100%-40px),transparent)]
  hover:[mask-image:none]"
```
This shows a fade hint on the right edge, removed on hover so users can see the Actions column.

**2. Increase color swatch size**

Change the swatch from `w-6 h-6` (line 178) to `w-8 h-8 rounded-full ring-1 ring-border`. This makes colors much easier to distinguish at a glance.

**3. Differentiate True Cost from Price visually**

True Cost column (line 244): already styled `text-orange-400 font-bold` -- keep this.
Price column (line 249): currently `text-muted-foreground` -- change to `text-foreground` so it's clearly a different weight than True Cost. The orange vs white distinction is sufficient.

Change True Cost to `text-cyan-400 font-semibold` per the user's request (replacing orange).

**4. Add sort indicators to column headers**

The table doesn't receive sort state. Add two new props: `sortBy?: string` and `onSortChange?: (sort: string) => void`. Render clickable headers with `ChevronUp`/`ChevronDown` icons (h-3 w-3) on the active column, and a muted chevron on hover for sortable columns. Sortable columns: Brand, Type, TD, True Cost, Price, Stock, Rating.

Wire these props from Finder.tsx where the FilamentTableView is rendered.

**5. Stock column: dot indicators**

Replace the `CheckCircle`/`XCircle` icons (lines 254-258) with simple colored dots:
- In stock: `w-2.5 h-2.5 rounded-full bg-emerald-500`
- Out of stock: `w-2.5 h-2.5 rounded-full bg-red-500`
- Low stock (if quantity data available): `w-2.5 h-2.5 rounded-full bg-amber-500`

**6. Fix route inconsistency**

Line 149 navigates to `/filaments/${filament.id}` but line 311 links to `/filament/${filament.id}`. Standardize both to `/filament/${filament.id}` to match the app's routing.

**7. TD column -- no query fix needed**

The `transmission_distance` field is already queried and passed. Only 3 filaments in the entire database have TD values. The "---" display is accurate. No changes needed here beyond what's already done.

---

**File: `src/pages/Finder.tsx`**

Pass `sortBy` and `onSortChange` props to `FilamentTableView`:
```tsx
<FilamentTableView
  ...existing props...
  sortBy={sortBy}
  onSortChange={setSortBy}
/>
```

---

### Technical Details

```text
Component Prop Flow:

Finder.tsx (sortBy state)
    |
    +--> FilamentTableView
           sortBy="price-asc"
           onSortChange={setSortBy}
           |
           +--> <th onClick> with ChevronUp/ChevronDown
```

Column widths will be constrained with `min-w` classes to prevent excessive squishing:
- Color: `min-w-[60px]`
- Brand: `min-w-[100px]`
- Product: `min-w-[180px] max-w-[300px]`
- Type: `min-w-[80px]`
- TD: `min-w-[50px]`
- True Cost: `min-w-[90px]`
- Price: `min-w-[80px]`
- Stock: `min-w-[50px]`
- Updated: `min-w-[70px]`
- Rating: `min-w-[60px]`
- Actions: `min-w-[90px]`

Total minimum: ~910px, well within 1440px+ screens.
