

# Upgrade "Trending in Your Region" Section

The `TrendingSection` component already exists and is positioned correctly between the hero and the catalog. This plan refines it to match the requested design spec and makes the data query region-aware.

---

## 1. Make the data query region-aware

**Current**: Queries `filaments` table globally, ordered by `value_score`, ignoring region.

**Updated**: Query filaments that have active listings in the user's region via the `filament_listings` table. Fall back to the global `value_score` ordering if no region-specific results exist.

```text
Primary query:
  filament_listings (region = user_region, available = true)
  -> join filaments (get display data)
  -> order by current_price ASC or listing count DESC
  -> limit 8

Fallback (if < 4 results):
  filaments ordered by value_score DESC (current behavior)
```

The hook will accept `regionCode` from `useRegion()` and include it in the `queryKey` for proper cache separation.

## 2. Update card styling

Update `MiniFilamentCard` classes to match the requested spec:
- Background: `bg-white/5` (from current `bg-slate-800/60`)
- Border: `border border-white/10` (from `border-slate-700/40`)
- Hover: `hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-150`
- Remove the `hover:-translate-y-0.5` lift (not in spec)
- Brand name line below product name in `text-xs text-gray-400`

## 3. Update section header

- Replace `TrendingUp` icon with fire emoji prefix: "Trending in [Region]"
- Increase heading to `text-xl font-bold text-white` (from `text-lg font-semibold`)
- "See All" link stays cyan, right-aligned

## 4. Tighten spacing in Finder.tsx

Reduce the vertical gap between the hero, trending section, and catalog bridge. Change the trending section padding from `py-3` to `py-4` and reduce the bridge separator's `my-8` to `my-4` to eliminate excess whitespace.

## 5. Ensure mobile scroll-snap

The `ScrollCarousel` component already applies `snap-x snap-mandatory` and each `ScrollCarouselItem` has `snap-start`. The existing gradient edge fades and arrow navigation will continue working. No changes needed to `scroll-carousel.tsx`.

---

## Technical Details

### Files modified

| File | Change |
|------|--------|
| `src/components/TrendingSection.tsx` | Region-aware query, updated card/header styles |
| `src/pages/Finder.tsx` | Tighten spacing around the section (reduce bridge separator margin) |

### No new files, dependencies, or database changes required

The `filament_listings` table already has `region`, `available`, and `filament_id` columns, so the region-aware join works with existing schema.
